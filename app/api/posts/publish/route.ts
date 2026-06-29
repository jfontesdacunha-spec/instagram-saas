import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getProxyAgent } from "@/lib/proxy"

const MOBILE_USER_AGENTS = [
  "Instagram 269.0.0.18.75 Android (26/8.0.0; 480dpi; 1080x1920; OnePlus; ONEPLUS A3003; OnePlus3; qcom; pt_BR; 314665256)",
  "Instagram 261.0.0.21.111 Android (30/11; 420dpi; 1080x2340; samsung; SM-G991B; o1s; exynos2100; pt_BR; 306670813)",
  "Instagram 275.0.0.27.98 Android (31/12; 440dpi; 1080x2400; Xiaomi; M2101K6G; alioth; qcom; pt_BR; 321468954)",
  "Instagram 263.0.0.19.104 Android (29/10; 480dpi; 1080x2280; samsung; SM-A515F; a51; exynos9611; pt_BR; 309495735)",
  "Instagram 265.0.0.20.301 Android (28/9.0; 420dpi; 1080x2220; Motorola; moto g7 play; channel; qcom; pt_BR; 311489654)",
  "Instagram 271.0.0.22.96 Android (32/12L; 400dpi; 1080x2400; Google; Pixel 6; oriole; tensor; pt_BR; 317892341)",
  "Instagram 273.0.0.25.107 Android (30/11; 560dpi; 1440x3200; samsung; SM-G998B; p3; exynos2100; pt_BR; 319234567)",
  "Instagram 259.0.0.17.113 Android (27/8.1.0; 480dpi; 1080x1920; LGE; LG-H870; lucye; qcom; pt_BR; 304523198)",
]

function getRandomUserAgent() {
  return MOBILE_USER_AGENTS[Math.floor(Math.random() * MOBILE_USER_AGENTS.length)]
}

async function uploadToCloudinary(buffer: Buffer, resourceType: "video" | "image", filename: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
  const apiKey = process.env.CLOUDINARY_API_KEY!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!

  const timestamp = Math.floor(Date.now() / 1000)
  const signature_string = `timestamp=${timestamp}${apiSecret}`

  const encoder = new TextEncoder()
  const data = encoder.encode(signature_string)
  const hashBuffer = await crypto.subtle.digest("SHA-1", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")

  const formData = new FormData()
  const blob = new Blob([buffer], { type: resourceType === "video" ? "video/mp4" : "image/jpeg" })
  formData.append("file", blob, filename)
  formData.append("api_key", apiKey)
  formData.append("timestamp", timestamp.toString())
  formData.append("signature", signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  })

  const data2 = await res.json()
  if (!data2.secure_url) throw new Error(`Cloudinary upload failed: ${JSON.stringify(data2)}`)
  return data2.secure_url
}

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const videoFile = formData.get("video") as File | null
  const coverFile = formData.get("cover") as File | null
  const imageFile = formData.get("image") as File | null
  const caption = formData.get("caption") as string || ""
  const hashtags = formData.get("hashtags") as string || ""
  const accountIds = JSON.parse(formData.get("accountIds") as string || "[]")

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  let videoUrl = ""
  let coverUrl = ""
  let imageUrl = ""

  if (videoFile) {
    const buffer = Buffer.from(await videoFile.arrayBuffer())
    videoUrl = await uploadToCloudinary(buffer, "video", videoFile.name)
  }
  if (coverFile) {
    const buffer = Buffer.from(await coverFile.arrayBuffer())
    coverUrl = await uploadToCloudinary(buffer, "image", coverFile.name)
  }
  if (imageFile) {
    const buffer = Buffer.from(await imageFile.arrayBuffer())
    imageUrl = await uploadToCloudinary(buffer, "image", imageFile.name)
  }

  const post = await prisma.post.create({
    data: {
      userId: user.id,
      videoUrl,
      imageUrl,
      caption,
      hashtags,
      status: "publishing",
    },
  })

  const accounts = await prisma.instagramAccount.findMany({
    where: { id: { in: accountIds }, userId: user.id, isActive: true },
  })

  const results = []
  for (const account of accounts) {
    try {
      const userAgent = getRandomUserAgent()
      const agent = getProxyAgent(account.proxy)
      const fullCaption = `${caption} ${hashtags}`.trim()
      let containerId = ""

      if (videoUrl) {
        const body: any = {
          media_type: "REELS",
          video_url: videoUrl,
          caption: fullCaption,
          access_token: account.accessToken,
        }
        if (coverUrl) {
          body.cover_url = coverUrl
          body.thumb_offset = 0
        }

        const containerRes = await fetch(
          `https://graph.instagram.com/v19.0/${account.igUserId}/media`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": userAgent,
            },
            body: JSON.stringify(body),
            // @ts-ignore
            agent,
          }
        )
        const containerData = await containerRes.json()
        containerId = containerData.id
      } else if (imageUrl) {
        const containerRes = await fetch(
          `https://graph.instagram.com/v19.0/${account.igUserId}/media`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": userAgent,
            },
            body: JSON.stringify({
              image_url: imageUrl,
              caption: fullCaption,
              access_token: account.accessToken,
            }),
            // @ts-ignore
            agent,
          }
        )
        const containerData = await containerRes.json()
        containerId = containerData.id
      }

      if (!containerId) throw new Error("Failed to create media container")

      let status = "IN_PROGRESS"
      let attempts = 0
      while (status === "IN_PROGRESS" && attempts < 12) {
        await new Promise((r) => setTimeout(r, 5000))
        const statusRes = await fetch(
          `https://graph.instagram.com/v19.0/${containerId}?fields=status_code&access_token=${account.accessToken}`,
          {
            headers: { "User-Agent": userAgent },
            // @ts-ignore
            agent,
          }
        )
        const statusData = await statusRes.json()
        status = statusData.status_code || "FINISHED"
        attempts++
      }

      const publishRes = await fetch(
        `https://graph.instagram.com/v19.0/${account.igUserId}/media_publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": userAgent,
          },
          body: JSON.stringify({
            creation_id: containerId,
            access_token: account.accessToken,
          }),
          // @ts-ignore
          agent,
        }
      )
      const publishData = await publishRes.json()

      if (publishData.id) {
        await prisma.postLog.create({
          data: { postId: post.id, instagramAccountId: account.id, status: "success" },
        })
        results.push({ accountId: account.id, username: account.username, status: "success" })
      } else {
        throw new Error(publishData.error?.message || "Publish failed")
      }
    } catch (err: any) {
      await prisma.postLog.create({
        data: {
          postId: post.id,
          instagramAccountId: account.id,
          status: "error",
          errorMessage: err.message,
        },
      })
      results.push({ accountId: account.id, username: account.username, status: "error", error: err.message })
    }
  }

  const allSuccess = results.every((r) => r.status === "success")
  await prisma.post.update({
    where: { id: post.id },
    data: { status: allSuccess ? "published" : "partial", publishedAt: new Date() },
  })

  return NextResponse.json({ post, results })
}

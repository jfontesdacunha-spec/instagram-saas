import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

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
  const imageFile = formData.get("image") as File | null
  const caption = formData.get("caption") as string || ""
  const hashtags = formData.get("hashtags") as string || ""
  const accountIds = JSON.parse(formData.get("accountIds") as string || "[]")

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Upload para Cloudinary
  let videoUrl = ""
  let imageUrl = ""

  if (videoFile) {
    const buffer = Buffer.from(await videoFile.arrayBuffer())
    videoUrl = await uploadToCloudinary(buffer, "video", videoFile.name)
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
      const fullCaption = `${caption} ${hashtags}`.trim()
      let containerId = ""

      if (videoUrl) {
        const containerRes = await fetch(
          `https://graph.instagram.com/v19.0/${account.igUserId}/media`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              media_type: "REELS",
              video_url: videoUrl,
              caption: fullCaption,
              access_token: account.accessToken,
            }),
          }
        )
        const containerData = await containerRes.json()
        containerId = containerData.id
      } else if (imageUrl) {
        const containerRes = await fetch(
          `https://graph.instagram.com/v19.0/${account.igUserId}/media`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: imageUrl,
              caption: fullCaption,
              access_token: account.accessToken,
            }),
          }
        )
        const containerData = await containerRes.json()
        containerId = containerData.id
      }

      if (!containerId) throw new Error("Failed to create media container")

     // Aguardar processamento do vídeo (até 60 segundos)
let status = "IN_PROGRESS"
let attempts = 0
while (status === "IN_PROGRESS" && attempts < 12) {
  await new Promise((r) => setTimeout(r, 5000))
  const statusRes = await fetch(
    `https://graph.instagram.com/v19.0/${containerId}?fields=status_code&access_token=${account.accessToken}`
  )
  const statusData = await statusRes.json()
  status = statusData.status_code || "FINISHED"
  attempts++
}

      const publishRes = await fetch(
        `https://graph.instagram.com/v19.0/${account.igUserId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: containerId,
            access_token: account.accessToken,
          }),
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

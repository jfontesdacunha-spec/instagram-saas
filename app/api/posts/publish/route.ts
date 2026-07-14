import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getProxyAgent } from "@/lib/proxy"

// URL do Worker Python
const INSTAGRAPI_WORKER_URL = process.env.INSTAGRAPI_WORKER_URL || "http://localhost:8000"



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
      const fullCaption = `${caption} ${hashtags}`.trim()
      let mediaType: "photo" | "video" = "photo"
      let mediaUrlToPost = imageUrl

      if (videoUrl) {
        mediaType = "video"
        mediaUrlToPost = videoUrl
      }

      if (!mediaUrlToPost) {
        throw new Error("Nenhuma mídia para postar.")
      }

      // Chamar o Worker Python para postar
      const workerPostResponse = await fetch(`${INSTAGRAPI_WORKER_URL}/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: account.instagramUsername, // Usar o username do Instagram
          media_type: mediaType,
          media_url: mediaUrlToPost,
          caption: fullCaption,
          cover_url: coverUrl, // Apenas para vídeos
        }),
      })

      const workerPostData = await workerPostResponse.json()

      if (!workerPostResponse.ok) {
        throw new Error(workerPostData.detail || "Erro ao postar via Worker Instagrapi")
      }

      // O workerPostData deve conter o resultado da postagem, incluindo o mediaId
      if (workerPostData.result && workerPostData.result.pk) {
        await prisma.postLog.create({
          data: { postId: post.id, instagramAccountId: account.id, status: "success", mediaId: workerPostData.result.pk },
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

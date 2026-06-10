import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"




export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { videoUrl, imageUrl, caption, hashtags, accountIds } = await request.json()

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Criar o post
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

  // Buscar contas selecionadas
  const accounts = await prisma.instagramAccount.findMany({
    where: { id: { in: accountIds }, userId: user.id, isActive: true },
  })

  const results = []

  for (const account of accounts) {
    try {
      const fullCaption = `${caption || ""} ${hashtags || ""}`.trim()
      let containerId = ""

      if (videoUrl) {
        // Upload de Reel
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
        // Upload de imagem
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

      // Aguardar processamento
      await new Promise((r) => setTimeout(r, 5000))

      // Publicar
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

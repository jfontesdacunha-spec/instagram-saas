import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getProxyAgent } from "@/lib/proxy"

export async function GET() {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json([])

  const logs = await prisma.postLog.findMany({
    where: {
      status: "success",
      mediaId: { not: null },
      post: { userId: user.id },
    },
    include: {
      post: true,
      instagramAccount: true,
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  const results = await Promise.all(
    logs.map(async (log) => {
      try {
        const agent = getProxyAgent(log.instagramAccount.proxy)
        const fields = "like_count,comments_count,media_type,media_product_type,permalink,timestamp"
        const res = await fetch(
          `https://graph.instagram.com/v19.0/${log.mediaId}?fields=${fields}&access_token=${log.instagramAccount.accessToken}`,
          // @ts-ignore
          { agent }
        )
        const data = await res.json()

        return {
          id: log.id,
          username: log.instagramAccount.username,
          profilePicture: log.instagramAccount.profilePicture,
          caption: log.post.caption,
          permalink: data.permalink || null,
          likeCount: data.like_count ?? null,
          commentsCount: data.comments_count ?? null,
          mediaType: data.media_type || null,
          publishedAt: log.createdAt,
          error: data.error?.message || null,
        }
      } catch (err: any) {
        return {
          id: log.id,
          username: log.instagramAccount.username,
          profilePicture: log.instagramAccount.profilePicture,
          caption: log.post.caption,
          permalink: null,
          likeCount: null,
          commentsCount: null,
          mediaType: null,
          publishedAt: log.createdAt,
          error: "Não foi possível carregar",
        }
      }
    })
  )

  return NextResponse.json(results)
}

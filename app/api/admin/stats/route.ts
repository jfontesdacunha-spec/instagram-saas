import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

const ADMIN_EMAIL = "jfontesdacunha@gmail.com"

export async function GET() {
  const session = await getServerSession()
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      igAccounts: { select: { id: true } },
      posts: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const totalUsers = users.length
  const totalAccounts = users.reduce((sum, u) => sum + u.igAccounts.length, 0)
  const totalPosts = users.reduce((sum, u) => sum + u.posts.length, 0)

  const usersFormatted = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    accountsCount: u.igAccounts.length,
    postsCount: u.posts.length,
    publishedCount: u.posts.filter((p) => p.status === "published").length,
  }))

  return NextResponse.json({
    totalUsers,
    totalAccounts,
    totalPosts,
    users: usersFormatted,
  })
}

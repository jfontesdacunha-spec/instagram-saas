import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { name } = await request.json()
  await prisma.user.update({
    where: { email: session.user.email },
    data: { name },
  })
  return NextResponse.json({ success: true })
}

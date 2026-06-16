import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { currentPassword, newPassword } = await request.json()

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.password) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  const match = await bcrypt.compare(currentPassword, user.password)
  if (!match) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { email: session.user.email },
    data: { password: hashed },
  })

  return NextResponse.json({ success: true })
}

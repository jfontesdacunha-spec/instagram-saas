
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { username, password, verificationCode, proxy } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
  }

  try {
    // Chamar o Worker Python para tentar o login
    const workerResponse = await fetch(`${process.env.INSTAGRAPI_WORKER_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        verification_code: verificationCode,
        proxy,
      }),
    })

    const workerData = await workerResponse.json()

    if (!workerResponse.ok) {
      // Se o Worker retornar um erro (ex: 2FA, senha incorreta)
      return NextResponse.json({ error: workerData.detail || "Erro no Worker Instagrapi" }, { status: workerResponse.status })
    }

    // Login bem-sucedido, agora precisamos salvar as informações no banco de dados
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // O Worker Python salva a sessão em um arquivo. O caminho é inferido.
    const sessionFilePath = `./sessions/${username}_session.json`

    // Chamar o Worker Python para obter informações do usuário após o login
    const userInfoResponse = await fetch(`${process.env.INSTAGRAPI_WORKER_URL}/user-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
      }),
    })
    const userInfoData = await userInfoResponse.json()

    if (!userInfoResponse.ok) {
      throw new Error(userInfoData.detail || "Erro ao obter informações do usuário via Worker Instagrapi")
    }

    const { pk, profile_pic_url, follower_count } = userInfoData.user_info

    await prisma.instagramAccount.upsert({
      where: { instagramUsername: username }, // Usar o username do Instagram como identificador único
      update: {
        instagramUsername: username,
        instagramPassword: password, // Em um sistema real, isso deveria ser criptografado
        sessionFilePath: sessionFilePath,
        isActive: true,
        lastActiveAt: new Date(),
        // Manter o accessToken da API oficial se ainda for necessário para outras operações
      },
      create: {
        userId: user.id,
        igUserId: pk,
        username: username,
        instagramUsername: username,
        instagramPassword: password, // Criptografar!
        sessionFilePath: sessionFilePath,
        profilePicture: profile_pic_url,
        followerCount: follower_count,
        isActive: true,
      },
    })

    return NextResponse.json({ message: "Conta Instagram conectada com sucesso via Instagrapi!", username: username })

  } catch (error: any) {
    // Se o erro for de 2FA, podemos retornar uma mensagem específica para o frontend
    if (error.message && error.message.includes("ChallengeRequired")) {
      return NextResponse.json({ error: "ChallengeRequired: 2FA ou outro desafio de segurança necessário." }, { status: 400 })
    }
    console.error("Erro ao conectar conta Instagram via Instagrapi:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}

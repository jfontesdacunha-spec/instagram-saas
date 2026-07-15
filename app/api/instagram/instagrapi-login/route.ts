import { NextResponse } from "next/server"
import { IgApiClient } from "instagram-private-api"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { username, password, verificationCode, proxy } = await req.json()

    const ig = new IgApiClient()
    
    // Configurar proxy se fornecido
    if (proxy) {
      ig.state.proxyUrl = proxy
    }

    ig.state.generateDevice(username)

    try {
      // Tentar o login
      await ig.simulate.preLoginFlow()
      const loggedInUser = await ig.account.login(username, password)
      
      // Se chegar aqui, o login foi bem-sucedido (sem 2FA ou 2FA já fornecido)
      // Mas se houver um verificationCode, precisamos completar o login de 2FA
      // No entanto, a biblioteca instagram-private-api lida com 2FA lançando um erro específico
      
      process.nextTick(async () => await ig.simulate.postLoginFlow())

      // Salvar no banco de dados
      await prisma.instagramAccount.upsert({
        where: { instagramUsername: username },
        update: {
          instagramPassword: password,
          isActive: true,
          profilePicture: loggedInUser.profile_pic_url,
        },
        create: {
          userId: session.user.id,
          igUserId: loggedInUser.pk.toString(),
          username: username,
          instagramUsername: username,
          instagramPassword: password,
          profilePicture: loggedInUser.profile_pic_url,
          isActive: true,
        },
      })

      return NextResponse.json({ message: "Login bem-sucedido!", username })

    } catch (error: any) {
      // Tratar desafio de 2FA
      if (error.name === 'IgCheckpointError' || error.message.includes('checkpoint')) {
        return NextResponse.json({ error: "ChallengeRequired: 2FA ou verificação necessária." }, { status: 400 })
      }
      
      if (error.name === 'IgLoginTwoFactorRequiredError') {
        // Se já temos o código, tentamos finalizar
        if (verificationCode) {
          const twoFactorData = error.response.body.two_factor_info;
          const method = '1'; // SMS ou App
          await ig.account.twoFactorLogin({
            username,
            verificationCode,
            twoFactorIdentifier: twoFactorData.two_factor_identifier,
            verificationMethod: method,
            trustThisDevice: '1',
          });
          
          const currentUser = await ig.account.currentUser();
          
          await prisma.instagramAccount.upsert({
            where: { instagramUsername: username },
            update: { isActive: true },
            create: {
              userId: session.user.id,
              igUserId: currentUser.pk.toString(),
              username: username,
              instagramUsername: username,
              instagramPassword: password,
              isActive: true,
            },
          })
          
          return NextResponse.json({ message: "Login 2FA bem-sucedido!", username })
        }
        return NextResponse.json({ error: "ChallengeRequired: Digite o código 2FA." }, { status: 400 })
      }

      throw error
    }

  } catch (error: any) {
    console.error("Erro no login Instagram:", error)
    return NextResponse.json({ error: error.message || "Erro interno no servidor" }, { status: 500 })
  }
}

import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(new URL("/dashboard/accounts?error=cancelled", request.url))
  }

  try {
    const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID!,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/instagram/callback`,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()
    if (tokenData.error_type || tokenData.error) {
      console.error("Token error:", tokenData)
      return NextResponse.redirect(new URL("/dashboard/accounts?error=token", request.url))
    }

    const longTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${tokenData.access_token}`
    )
    const longTokenData = await longTokenResponse.json()
    const finalToken = longTokenData.access_token || tokenData.access_token

    const profileResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,profile_picture_url,followers_count&access_token=${finalToken}`
    )
    const profile = await profileResponse.json()

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user) {
      return NextResponse.redirect(new URL("/dashboard/accounts?error=user", request.url))
    }

    await prisma.instagramAccount.upsert({
      where: { igUserId: profile.id },
      update: {
        accessToken: finalToken,
        username: profile.username,
        profilePicture: profile.profile_picture_url,
        followerCount: profile.followers_count,
        isActive: true,
        lastActiveAt: new Date(),
      },
      create: {
        userId: user.id,
        igUserId: profile.id,
        username: profile.username,
        accessToken: finalToken,
        profilePicture: profile.profile_picture_url,
        followerCount: profile.followers_count,
      },
    })

    return NextResponse.redirect(new URL("/dashboard/accounts?success=true", request.url))
  } catch (err) {
    console.error("Instagram callback error:", err)
    return NextResponse.redirect(new URL("/dashboard/accounts?error=server", request.url))
  }
}

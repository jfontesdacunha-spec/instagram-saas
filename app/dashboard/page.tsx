"use client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Instagram, Upload, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/instagram/accounts").then(r => r.json()).then(setAccounts)
  }, [])

  const stats = [
    { label: "Contas conectadas", value: accounts.length, icon: Instagram, color: "purple" },
    { label: "Posts publicados", value: "—", icon: CheckCircle, color: "green" },
    { label: "Agendamentos", value: "—", icon: Upload, color: "blue" },
    { label: "Erros", value: "—", icon: AlertCircle, color: "red" },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Olá, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Bem-vindo ao seu painel de controle</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#111] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
              <stat.icon size={15} className="text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/dashboard/accounts" className="bg-[#111] border border-white/5 rounded-xl p-6 hover:border-purple-500/30 transition-all group">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
            <Instagram size={18} className="text-purple-400" />
          </div>
          <h3 className="font-semibold text-white mb-1">Conectar Instagram</h3>
          <p className="text-sm text-gray-500">Adicione suas contas do Instagram para publicar</p>
        </Link>

        <Link href="/dashboard/publish" className="bg-[#111] border border-white/5 rounded-xl p-6 hover:border-purple-500/30 transition-all group">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
            <Upload size={18} className="text-purple-400" />
          </div>
          <h3 className="font-semibold text-white mb-1">Publicar conteúdo</h3>
          <p className="text-sm text-gray-500">Envie vídeos e imagens para várias contas</p>
        </Link>
      </div>

      {/* Empty state */}
      {accounts.length === 0 && (
        <div className="mt-8 bg-[#111] border border-white/5 rounded-xl p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
            <Instagram size={22} className="text-purple-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Nenhuma conta conectada</h3>
          <p className="text-gray-500 text-sm mb-6">Conecte sua primeira conta do Instagram para começar</p>
          <Link
            href="/dashboard/accounts"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <Instagram size={15} />
            Conectar agora
          </Link>
        </div>
      )}
    </div>
  )
}

"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Users, Instagram, FileText, Shield, ShieldOff } from "lucide-react"

export default function AdminPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (r) => {
        if (r.status === 403) {
          setForbidden(true)
          setLoading(false)
          return
        }
        const json = await r.json()
        setData(json)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="bg-[#111] border border-white/5 rounded-xl p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
          <ShieldOff size={24} className="text-red-400" />
        </div>
        <h3 className="font-semibold text-white mb-2">Acesso restrito</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Você não tem permissão para acessar o painel administrativo.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        <Shield size={20} className="text-purple-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Painel Admin</h1>
          <p className="text-gray-500 mt-1">Visão geral de todos os usuários da plataforma</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Usuários cadastrados</span>
            <Users size={14} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{data.totalUsers}</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Contas Instagram conectadas</span>
            <Instagram size={14} className="text-pink-400" />
          </div>
          <p className="text-2xl font-bold text-white">{data.totalAccounts}</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Posts criados</span>
            <FileText size={14} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{data.totalPosts}</p>
        </div>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-semibold text-white text-sm">Usuários</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-white/5">
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Contas</th>
              <th className="px-5 py-3 font-medium">Posts</th>
              <th className="px-5 py-3 font-medium">Publicados</th>
              <th className="px-5 py-3 font-medium">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((u: any) => (
              <tr key={u.id} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-3 text-white">{u.name || "—"}</td>
                <td className="px-5 py-3 text-gray-400">{u.email}</td>
                <td className="px-5 py-3 text-gray-300">{u.accountsCount}</td>
                <td className="px-5 py-3 text-gray-300">{u.postsCount}</td>
                <td className="px-5 py-3 text-gray-300">{u.publishedCount}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">
                  {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

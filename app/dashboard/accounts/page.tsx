"use client"
import { useEffect, useState } from "react"
import { Instagram, Plus, Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"

const INSTAGRAM_AUTH_URL = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_URL}/api/instagram/callback&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights`

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const success = searchParams.get("success")
  const error = searchParams.get("error")

  const fetchAccounts = async () => {
    const res = await fetch("/api/instagram/accounts")
    const data = await res.json()
    setAccounts(data)
    setLoading(false)
  }

  useEffect(() => { fetchAccounts() }, [])

  const removeAccount = async (id: string) => {
    if (!confirm("Remover esta conta?")) return
    await fetch("/api/instagram/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    fetchAccounts()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Contas do Instagram</h1>
          <p className="text-gray-500 mt-1">{accounts.length}/30 contas conectadas</p>
        </div>
        <a href={INSTAGRAM_AUTH_URL} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-opacity">
          <Plus size={15} />
          Conectar Instagram
        </a>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
          <CheckCircle size={16} className="text-green-400" />
          <p className="text-green-400 text-sm font-medium">Conta conectada com sucesso!</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <XCircle size={16} className="text-red-400" />
          <p className="text-red-400 text-sm font-medium">
            {error === "cancelled" ? "Conexao cancelada." : "Erro ao conectar. Tente novamente."}
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && accounts.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div key={account.id} className="bg-[#111] border border-white/5 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {account.profilePicture ? (
                    <img src={account.profilePicture} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Instagram size={16} className="text-white" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-white text-sm">@{account.username}</p>
                    <p className="text-xs text-gray-500">{account.followerCount ? account.followerCount.toLocaleString() + " seguidores" : "—"}</p>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full mt-1 ${account.isActive ? "bg-green-400" : "bg-red-400"}`} />
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                <span className={`px-2 py-0.5 rounded-full ${account.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {account.isActive ? "Ativa" : "Inativa"}
                </span>
              </div>
              <div className="flex gap-2">
                <a href={INSTAGRAM_AUTH_URL} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 py-2 rounded-lg transition-colors">
                  <RefreshCw size={12} />
                  Reconectar
                </a>
                <button onClick={() => removeAccount(account.id)} className="flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 py-2 px-3 rounded-lg transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && accounts.length === 0 && (
        <div className="bg-[#111] border border-white/5 rounded-xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-5">
            <Instagram size={24} className="text-purple-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Nenhuma conta ainda</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">Clique em Conectar Instagram para adicionar sua primeira conta</p>
          <a href={INSTAGRAM_AUTH_URL} className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
            <Plus size={15} />
            Conectar Instagram
          </a>
        </div>
      )}
    </div>
  )
}

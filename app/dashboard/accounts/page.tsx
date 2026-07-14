"use client"
import { useEffect, useState } from "react"
import { Instagram, Plus, Trash2, RefreshCw, CheckCircle, XCircle, Globe, Save, Lock, User, Key } from "lucide-react"
import { useSearchParams } from "next/navigation"

const INSTAGRAM_AUTH_URL = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_URL}/api/instagram/callback&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights`

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [proxyOpenFor, setProxyOpenFor] = useState<string | null>(null)
  const [proxyValue, setProxyValue] = useState("")
  const [savingProxy, setSavingProxy] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [loginData, setLoginData] = useState({ username: "", password: "", verificationCode: "", proxy: "" })
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [show2FA, setShow2FA] = useState(false)
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

  const openProxyEditor = (account: any) => {
    setProxyOpenFor(account.id)
    setProxyValue(account.proxy || "")
  }

  const saveProxy = async (accountId: string) => {
    setSavingProxy(true)
    await fetch("/api/instagram/accounts/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, proxy: proxyValue.trim() }),
    })
    await fetchAccounts()
    setSavingProxy(false)
    setProxyOpenFor(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginError(null)

    try {
      // Usar o Worker externo no Railway que é mais robusto para instagrapi
      const workerUrl = process.env.NEXT_PUBLIC_INSTAGRAPI_WORKER_URL || "https://instagram-saas-production.up.railway.app";
      const res = await fetch(`${workerUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password,
          verification_code: loginData.verificationCode,
          proxy: loginData.proxy
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Tentar capturar o erro de várias formas possíveis (FastAPI ou Next.js)
        const errorMessage = data.detail || data.error || data.message || "Erro desconhecido no servidor";
        
        if (errorMessage.includes("ChallengeRequired")) {
          setShow2FA(true)
          setLoginError("Código 2FA necessário. Por favor, insira abaixo.")
        } else {
          setLoginError(`Erro: ${errorMessage}`);
        }
      } else {
        setIsLoginModalOpen(false)
        setLoginData({ username: "", password: "", verificationCode: "", proxy: "" })
        setShow2FA(false)
        fetchAccounts()
      }
    } catch (err) {
      setLoginError("Erro de conexão com o servidor.")
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Contas do Instagram</h1>
          <p className="text-gray-500 mt-1">{accounts.length}/30 contas conectadas</p>
        </div>
        <button 
          onClick={() => setIsLoginModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-opacity"
        >
          <Plus size={15} />
          Conectar Instagram
        </button>
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

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-0.5 rounded-full text-xs ${account.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {account.isActive ? "Ativa" : "Inativa"}
                </span>
                {account.proxy && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400">
                    <Globe size={10} />
                    Proxy
                  </span>
                )}
              </div>

              {proxyOpenFor === account.id ? (
                <div className="mb-3 space-y-2">
                  <input
                    type="text"
                    value={proxyValue}
                    onChange={e => setProxyValue(e.target.value)}
                    placeholder="ip:porta:usuario:senha"
                    className="w-full bg-white/5 border border-blue-500/30 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveProxy(account.id)}
                      disabled={savingProxy}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Save size={11} />
                      {savingProxy ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      onClick={() => setProxyOpenFor(null)}
                      className="px-3 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 py-2 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => openProxyEditor(account)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-blue-300 bg-white/5 hover:bg-blue-500/10 py-2 rounded-lg transition-colors mb-2"
                >
                  <Globe size={12} />
                  {account.proxy ? "Editar proxy" : "Adicionar proxy"}
                </button>
              )}

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
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            Conectar Instagram
          </button>
        </div>
      )}

      {/* Modal de Login Instagrapi */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Conectar Conta</h2>
              <button onClick={() => setIsLoginModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Usuário do Instagram</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input
                    type="text"
                    required
                    value={loginData.username}
                    onChange={e => setLoginData({...loginData, username: e.target.value})}
                    placeholder="ex: @seu_usuario"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input
                    type="password"
                    required
                    value={loginData.password}
                    onChange={e => setLoginData({...loginData, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              {show2FA && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-medium text-purple-400 mb-1.5 ml-1">Código 2FA (6 dígitos)</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={16} />
                    <input
                      type="text"
                      required
                      value={loginData.verificationCode}
                      onChange={e => setLoginData({...loginData, verificationCode: e.target.value})}
                      placeholder="000000"
                      className="w-full bg-purple-500/5 border border-purple-500/30 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Proxy (Opcional)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input
                    type="text"
                    value={loginData.proxy}
                    onChange={e => setLoginData({...loginData, proxy: e.target.value})}
                    placeholder="ip:porta:usuario:senha"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              {loginError && (
                <p className="text-red-400 text-xs font-medium bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {show2FA ? "Verificando..." : "Conectando..."}
                  </>
                ) : (
                  show2FA ? "Verificar Código" : "Entrar agora"
                )}
              </button>
              
              <p className="text-[10px] text-gray-500 text-center px-4">
                Suas credenciais são usadas apenas para criar uma sessão segura e não são compartilhadas.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

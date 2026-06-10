"use client"
import { useEffect, useState } from "react"
import { Upload, Instagram, CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function PublishPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [caption, setCaption] = useState("")
  const [hashtags, setHashtags] = useState("")
  const [publishing, setPublishing] = useState(false)
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/instagram/accounts").then(r => r.json()).then(data => {
      setAccounts(data)
      setSelectedAccounts(data.map((a: any) => a.id))
    })
  }, [])

  const toggleAccount = (id: string) => {
    setSelectedAccounts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedAccounts(accounts.map(a => a.id))
  }

  const publish = async () => {
    if (!videoUrl && !imageUrl) return alert("Adicione uma URL de vídeo ou imagem")
    if (selectedAccounts.length === 0) return alert("Selecione pelo menos uma conta")

    setPublishing(true)
    setResults([])

    const res = await fetch("/api/posts/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl, imageUrl, caption, hashtags, accountIds: selectedAccounts }),
    })

    const data = await res.json()
    setResults(data.results || [])
    setPublishing(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Publicar conteúdo</h1>
        <p className="text-gray-500 mt-1">Publique em múltiplas contas ao mesmo tempo</p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Form */}
        <div className="col-span-3 space-y-4">
          <div className="bg-[#111] border border-white/5 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-white text-sm">Conteúdo</h2>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">URL do vídeo (Reel)</label>
              <input
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">URL da imagem (opcional)</label>
              <input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Legenda</label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Escreva a legenda do post..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Hashtags</label>
              <input
                value={hashtags}
                onChange={e => setHashtags(e.target.value)}
                placeholder="#hashtag1 #hashtag2"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            onClick={publish}
            disabled={publishing}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-opacity"
          >
            {publishing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {publishing ? "Publicando..." : `Publicar em ${selectedAccounts.length} conta(s)`}
          </button>

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-[#111] border border-white/5 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-white text-sm">Resultado</h3>
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  {r.status === "success"
                    ? <CheckCircle size={15} className="text-green-400" />
                    : <XCircle size={15} className="text-red-400" />
                  }
                  <span className="text-sm text-gray-300">@{r.username}</span>
                  <span className={`text-xs ml-auto ${r.status === "success" ? "text-green-400" : "text-red-400"}`}>
                    {r.status === "success" ? "Publicado" : r.error || "Erro"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accounts selector */}
        <div className="col-span-2">
          <div className="bg-[#111] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-sm">Contas</h2>
              <button onClick={selectAll} className="text-xs text-purple-400 hover:text-purple-300">
                Todas
              </button>
            </div>

            {accounts.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">
                Nenhuma conta conectada
              </p>
            ) : (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => toggleAccount(account.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedAccounts.includes(account.id)
                        ? "bg-purple-500/10 border border-purple-500/30"
                        : "bg-white/3 border border-white/5 hover:bg-white/5"
                    }`}
                  >
                    {account.profilePicture ? (
                      <img src={account.profilePicture} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Instagram size={13} className="text-white" />
                      </div>
                    )}
                    <span className="text-sm text-white">@{account.username}</span>
                    {selectedAccounts.includes(account.id) && (
                      <CheckCircle size={14} className="text-purple-400 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

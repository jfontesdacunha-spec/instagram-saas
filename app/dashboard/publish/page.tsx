"use client"
import { useEffect, useState, useRef } from "react"
import { Upload, Instagram, CheckCircle, XCircle, Loader2, Film, Image, X } from "lucide-react"

export default function PublishPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [caption, setCaption] = useState("")
  const [hashtags, setHashtags] = useState("")
  const [publishing, setPublishing] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const videoRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

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

  const selectAll = () => setSelectedAccounts(accounts.map(a => a.id))

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleCoverChange = (file: File | null) => {
    setCoverFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setCoverPreview(url)
    } else {
      setCoverPreview(null)
    }
  }

  const publish = async () => {
    if (!videoFile && !imageFile) return alert("Adicione um vídeo ou imagem")
    if (selectedAccounts.length === 0) return alert("Selecione pelo menos uma conta")
    setPublishing(true)
    setResults([])
    const formData = new FormData()
    if (videoFile) formData.append("video", videoFile)
    if (coverFile) formData.append("cover", coverFile)
    if (imageFile) formData.append("image", imageFile)
    formData.append("caption", caption)
    formData.append("hashtags", hashtags)
    formData.append("accountIds", JSON.stringify(selectedAccounts))
    const res = await fetch("/api/posts/publish", { method: "POST", body: formData })
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
        <div className="col-span-3 space-y-4">
          <div className="bg-[#111] border border-white/5 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-white text-sm">Conteúdo</h2>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Vídeo (Reel)</label>
              <input ref={videoRef} type="file" accept="video/*" className="hidden"
                onChange={e => setVideoFile(e.target.files?.[0] || null)} />
              {videoFile ? (
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                  <Film size={15} className="text-purple-400" />
                  <span className="text-sm text-white flex-1 truncate">{videoFile.name}</span>
                  <span className="text-xs text-gray-500">{formatSize(videoFile.size)}</span>
                  <button onClick={() => setVideoFile(null)}><X size={14} className="text-gray-500 hover:text-white" /></button>
                </div>
              ) : (
                <button onClick={() => videoRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 border border-dashed border-white/10 rounded-lg px-3 py-4 text-sm text-gray-500 hover:text-white hover:border-purple-500/50 transition-colors">
                  <Film size={15} />
                  Clique para selecionar vídeo
                </button>
              )}
            </div>
            {videoFile && (
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Capa do Reel <span className="text-gray-600">(opcional)</span></label>
                <input ref={coverRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleCoverChange(e.target.files?.[0] || null)} />
                {coverFile && coverPreview ? (
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                    <img src={coverPreview} alt="capa" className="w-10 h-10 rounded object-cover" />
                    <span className="text-sm text-white flex-1 truncate">{coverFile.name}</span>
                    <span className="text-xs text-gray-500">{formatSize(coverFile.size)}</span>
                    <button onClick={() => handleCoverChange(null)}><X size={14} className="text-gray-500 hover:text-white" /></button>
                  </div>
                ) : (
                  <button onClick={() => coverRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 border border-dashed border-yellow-500/20 rounded-lg px-3 py-4 text-sm text-gray-500 hover:text-white hover:border-yellow-500/50 transition-colors">
                    <Image size={15} />
                    Clique para adicionar capa do Reel
                  </button>
                )}
              </div>
            )}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Imagem (opcional)</label>
              <input ref={imageRef} type="file" accept="image/*" className="hidden"
                onChange={e => setImageFile(e.target.files?.[0] || null)} />
              {imageFile ? (
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                  <Image size={15} className="text-pink-400" />
                  <span className="text-sm text-white flex-1 truncate">{imageFile.name}</span>
                  <span className="text-xs text-gray-500">{formatSize(imageFile.size)}</span>
                  <button onClick={() => setImageFile(null)}><X size={14} className="text-gray-500 hover:text-white" /></button>
                </div>
              ) : (
                <button onClick={() => imageRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 border border-dashed border-white/10 rounded-lg px-3 py-4 text-sm text-gray-500 hover:text-white hover:border-pink-500/50 transition-colors">
                  <Image size={15} />
                  Clique para selecionar imagem
                </button>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Legenda</label>
              <textarea value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="Escreva a legenda do post..." rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Hashtags</label>
              <input value={hashtags} onChange={e => setHashtags(e.target.value)}
                placeholder="#hashtag1 #hashtag2"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500" />
            </div>
          </div>
          <button onClick={publish} disabled={publishing}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-opacity">
            {publishing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {publishing ? "Publicando..." : `Publicar em ${selectedAccounts.length} conta(s)`}
          </button>
          {results.length > 0 && (
            <div className="bg-[#111] border border-white/5 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-white text-sm">Resultado</h3>
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  {r.status === "success" ? <CheckCircle size={15} className="text-green-400" /> : <XCircle size={15} className="text-red-400" />}
                  <span className="text-sm text-gray-300">@{r.username}</span>
                  <span className={`text-xs ml-auto ${r.status === "success" ? "text-green-400" : "text-red-400"}`}>
                    {r.status === "success" ? "Publicado" : r.error || "Erro"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="col-span-2">
          <div className="bg-[#111] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-sm">Contas</h2>
              <button onClick={selectAll} className="text-xs text-purple-400 hover:text-purple-300">Todas</button>
            </div>
            {accounts.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">Nenhuma conta conectada</p>
            ) : (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <button key={account.id} onClick={() => toggleAccount(account.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedAccounts.includes(account.id)
                        ? "bg-purple-500/10 border border-purple-500/30"
                        : "bg-white/3 border border-white/5 hover:bg-white/5"
                    }`}>
                    {account.profilePicture ? (
                      <img src={account.profilePicture} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Instagram size={13} className="text-white" />
                      </div>
                    )}
                    <span className="text-sm text-white">@{account.username}</span>
                    {selectedAccounts.includes(account.id) && <CheckCircle size={14} className="text-purple-400 ml-auto" />}
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

"use client"
import { useEffect, useState, useRef } from "react"
import { FolderOpen, Film, Image, Trash2, Copy, Check } from "lucide-react"

export default function LibraryPage() {
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "video" | "image">("all")
  const videoRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  const fetchMedia = async () => {
    const res = await fetch("/api/library")
    const data = await res.json()
    setMedia(data)
    setLoading(false)
  }

  useEffect(() => { fetchMedia() }, [])

  const uploadFile = async (file: File, type: "video" | "image") => {
    setUploading(true)
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", "ml_default")
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.secure_url) {
        await fetch("/api/library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: data.secure_url, type, fileName: file.name }),
        })
        fetchMedia()
      } else {
        alert("Erro ao fazer upload: " + (data.error?.message || "Tente novamente"))
      }
    } catch (err) {
      alert("Erro ao fazer upload")
    }
    setUploading(false)
  }

  const deleteMedia = async (id: string) => {
    if (!confirm("Remover arquivo da biblioteca?")) return
    await fetch("/api/library", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    fetchMedia()
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = filter === "all" ? media : media.filter(m => m.type === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Biblioteca</h1>
          <p className="text-gray-500 mt-1">{media.length} arquivo{media.length !== 1 ? "s" : ""} salvos</p>
        </div>
        <div className="flex gap-2">
          <input ref={videoRef} type="file" accept="video/*" className="hidden"
            onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], "video")} />
          <input ref={imageRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], "image")} />
          <button onClick={() => videoRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            <Film size={15} />
            {uploading ? "Enviando..." : "Vídeo"}
          </button>
          <button onClick={() => imageRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-opacity disabled:opacity-50">
            <Image size={15} />
            {uploading ? "Enviando..." : "Imagem"}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(["all", "video", "image"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "bg-white/5 text-gray-500 hover:text-white border border-white/5"
            }`}>
            {f === "all" ? "Todos" : f === "video" ? "Vídeos" : "Imagens"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-[#111] border border-white/5 rounded-xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-5">
            <FolderOpen size={24} className="text-purple-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Nenhum arquivo ainda</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            Faça upload de vídeos e imagens para reutilizar em posts futuros.
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-[#111] border border-white/5 rounded-xl overflow-hidden group">
              <div className="aspect-square bg-black flex items-center justify-center relative">
                {item.type === "video" ? (
                  <video src={item.url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={item.url} alt={item.fileName} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => copyUrl(item.url)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                    {copied === item.url ? <Check size={15} className="text-green-400" /> : <Copy size={15} className="text-white" />}
                  </button>
                  <button onClick={() => deleteMedia(item.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors">
                    <Trash2 size={15} className="text-red-400" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  {item.type === "video"
                    ? <Film size={12} className="text-purple-400" />
                    : <Image size={12} className="text-pink-400" />}
                  <p className="text-xs text-white truncate">{item.fileName}</p>
                </div>
                <p className="text-xs text-gray-600">
                  {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

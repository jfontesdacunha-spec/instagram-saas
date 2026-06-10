"use client"
import { useState, useRef } from "react"
import { Calendar, Clock, Trash2, Plus, Film, Image, X } from "lucide-react"

type ScheduledPost = {
  id: string
  date: string
  time: string
  caption: string
  hashtags: string
  type: "video" | "image"
  fileName: string
  coverName?: string
}

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [caption, setCaption] = useState("")
  const [hashtags, setHashtags] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<"video" | "image">("video")
  const videoRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleCoverChange = (file: File | null) => {
    setCoverFile(file)
    if (file) {
      setCoverPreview(URL.createObjectURL(file))
    } else {
      setCoverPreview(null)
    }
  }

  const switchType = (type: "video" | "image") => {
    setFileType(type)
    setVideoFile(null)
    setCoverFile(null)
    setCoverPreview(null)
    setImageFile(null)
  }

  const addPost = () => {
    const file = fileType === "video" ? videoFile : imageFile
    if (!date || !time || !file) return alert("Preencha data, hora e selecione um arquivo")
    const newPost: ScheduledPost = {
      id: Math.random().toString(36).slice(2),
      date,
      time,
      caption,
      hashtags,
      type: fileType,
      fileName: file.name,
      coverName: coverFile?.name,
    }
    setPosts(prev => [...prev, newPost].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)))
    setShowForm(false)
    setDate("")
    setTime("")
    setCaption("")
    setHashtags("")
    setVideoFile(null)
    setCoverFile(null)
    setCoverPreview(null)
    setImageFile(null)
  }

  const removePost = (id: string) => {
    if (!confirm("Remover agendamento?")) return
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const formatDate = (date: string) => {
    const [y, m, d] = date.split("-")
    return `${d}/${m}/${y}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Agendamentos</h1>
          <p className="text-gray-500 mt-1">{posts.length} post{posts.length !== 1 ? "s" : ""} agendado{posts.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-opacity">
          <Plus size={15} />
          Novo agendamento
        </button>
      </div>

      {showForm && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-white text-sm">Novo agendamento</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Hora</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Tipo de conteúdo</label>
            <div className="flex gap-2">
              <button onClick={() => switchType("video")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${fileType === "video" ? "bg-purple-500/20 border border-purple-500/40 text-purple-300" : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"}`}>
                <Film size={14} /> Vídeo (Reel)
              </button>
              <button onClick={() => switchType("image")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${fileType === "image" ? "bg-pink-500/20 border border-pink-500/40 text-pink-300" : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"}`}>
                <Image size={14} /> Imagem
              </button>
            </div>
          </div>

          {fileType === "video" && (
            <>
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
            </>
          )}

          {fileType === "image" && (
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Imagem</label>
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
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Legenda</label>
            <textarea value={caption} onChange={e => setCaption(e.target.value)}
              placeholder="Escreva a legenda..." rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Hashtags</label>
            <input type="text" value={hashtags} onChange={e => setHashtags(e.target.value)}
              placeholder="#hashtag1 #hashtag2"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500" />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={addPost}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white text-sm font-medium py-2.5 rounded-lg transition-opacity">
              Agendar post
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 bg-white/5 hover:bg-white/10 text-gray-400 text-sm rounded-lg transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-5">
            <Calendar size={24} className="text-purple-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Nenhum post agendado</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">Clique em "Novo agendamento" para agendar seu primeiro post</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-[#111] border border-white/5 rounded-xl p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${post.type === "video" ? "bg-purple-500/20" : "bg-pink-500/20"}`}>
                {post.type === "video" ? <Film size={18} className="text-purple-400" /> : <Image size={18} className="text-pink-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{post.fileName}</p>
                {post.coverName && <p className="text-xs text-yellow-500/70 truncate mt-0.5">Capa: {post.coverName}</p>}
                {post.caption && <p className="text-xs text-gray-500 truncate mt-0.5">{post.caption}</p>}
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-sm text-white">
                    <Calendar size={13} className="text-gray-500" />
                    {formatDate(post.date)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                    <Clock size={11} />
                    {post.time}
                  </div>
                </div>
                <button onClick={() => removePost(post.id)}
                  className="text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

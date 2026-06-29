"use client"
import { useEffect, useState } from "react"
import { Heart, MessageCircle, ExternalLink, TrendingUp, Instagram } from "lucide-react"

export default function PerformancePage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/posts/performance")
      .then(r => r.json())
      .then(data => {
        setPosts(data)
        setLoading(false)
      })
  }, [])

  const totalLikes = posts.reduce((sum, p) => sum + (p.likeCount || 0), 0)
  const totalComments = posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Performance</h1>
        <p className="text-gray-500 mt-1">Métricas dos seus últimos posts publicados</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Posts analisados</span>
            <TrendingUp size={14} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : posts.length}</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Total de curtidas</span>
            <Heart size={14} className="text-pink-400" />
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : totalLikes.toLocaleString()}</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Total de comentários</span>
            <MessageCircle size={14} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{loading ? "..." : totalComments.toLocaleString()}</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="bg-[#111] border border-white/5 rounded-xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-5">

import { Star } from "lucide-react"

export default function StoriesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Stories</h1>
      <p className="text-gray-500 mb-8">Em breve — a API do Instagram ainda não permite publicar Stories automaticamente.</p>
      <div className="bg-[#111] border border-white/5 rounded-xl p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-5">
          <Star size={24} className="text-purple-400" />
        </div>
        <h3 className="font-semibold text-white mb-2">Funcionalidade em breve</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          O Meta ainda não libera publicação de Stories via API para a maioria dos apps. Estamos acompanhando essa liberação.
        </p>
      </div>
    </div>
  )
}

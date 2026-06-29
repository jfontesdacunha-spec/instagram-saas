import { FolderOpen } from "lucide-react"

export default function LibraryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Biblioteca</h1>
      <p className="text-gray-500 mb-8">Em breve — guarde seus vídeos e imagens para reutilizar em posts futuros.</p>
      <div className="bg-[#111] border border-white/5 rounded-xl p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-5">
          <FolderOpen size={24} className="text-purple-400" />
        </div>
        <h3 className="font-semibold text-white mb-2">Nenhum arquivo salvo</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Em breve você poderá salvar conteúdos aqui para reutilizar em futuras publicações.
        </p>
      </div>
    </div>
  )
}

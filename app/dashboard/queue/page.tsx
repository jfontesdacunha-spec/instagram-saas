import { ListChecks } from "lucide-react"

export default function QueuePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Status da Fila</h1>
      <p className="text-gray-500 mb-8">Acompanhe posts pendentes, em processamento e concluídos.</p>
      <div className="bg-[#111] border border-white/5 rounded-xl p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-5">
          <ListChecks size={24} className="text-purple-400" />
        </div>
        <h3 className="font-semibold text-white mb-2">Fila vazia</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Quando você publicar ou agendar conteúdo, o status aparecerá aqui.
        </p>
      </div>
    </div>
  )
}

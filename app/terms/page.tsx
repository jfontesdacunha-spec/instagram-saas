export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Termos de Serviço</h1>
        <p className="text-gray-500 mb-10">Última atualização: junho de 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Aceitação dos termos</h2>
            <p>Ao usar nossa plataforma, você concorda com estes Termos de Serviço. Se não concordar com qualquer parte, não utilize o serviço.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Descrição do serviço</h2>
            <p>Nossa plataforma permite gerenciar e publicar conteúdo em múltiplas contas do Instagram de forma automatizada, usando a API oficial do Meta.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Uso aceitável</h2>
            <p>Você concorda em usar o serviço apenas para fins legais e de acordo com as políticas do Instagram e do Meta. É proibido:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
              <li>Publicar conteúdo ilegal, ofensivo ou que viole direitos de terceiros</li>
              <li>Usar o serviço para spam ou práticas enganosas</li>
              <li>Tentar contornar as limitações da plataforma</li>
              <li>Compartilhar credenciais de acesso com terceiros</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Responsabilidade pelo conteúdo</h2>
            <p>Você é o único responsável pelo conteúdo publicado através da plataforma. Não nos responsabilizamos por conteúdo que viole as políticas do Instagram ou leis aplicáveis.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Disponibilidade do serviço</h2>
            <p>Nos esforçamos para manter o serviço disponível, mas não garantimos disponibilidade ininterrupta. Podemos suspender o serviço para manutenção ou por razões técnicas.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Encerramento de conta</h2>
            <p>Você pode encerrar sua conta a qualquer momento. Reservamos o direito de suspender ou encerrar contas que violem estes termos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Limitação de responsabilidade</h2>
            <p>Não nos responsabilizamos por danos indiretos, incidentais ou consequentes decorrentes do uso ou incapacidade de usar o serviço.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Alterações nos termos</h2>
            <p>Podemos atualizar estes termos periodicamente. Continuando a usar o serviço após as alterações, você concorda com os novos termos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contato</h2>
            <p>Dúvidas sobre estes termos: <span className="text-purple-400">contato@automationpro.com.br</span></p>
          </section>
        </div>
      </div>
    </div>
  )
}

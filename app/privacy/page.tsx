export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Política de Privacidade</h1>
        <p className="text-gray-500 mb-10">Última atualização: junho de 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Informações que coletamos</h2>
            <p>Coletamos informações que você nos fornece diretamente, como nome, endereço de e-mail e dados de contas do Instagram conectadas à plataforma. Também coletamos dados de uso para melhorar nossos serviços.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Como usamos suas informações</h2>
            <p>Usamos suas informações para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Publicar conteúdo nas contas do Instagram conectadas</li>
              <li>Enviar comunicações relacionadas ao serviço</li>
              <li>Garantir a segurança da plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Compartilhamento de dados</h2>
            <p>Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto quando necessário para operar o serviço ou quando exigido por lei.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Dados do Instagram</h2>
            <p>Acessamos dados das suas contas do Instagram apenas para publicar conteúdo em seu nome, conforme autorizado por você. Não armazenamos senhas do Instagram. Os tokens de acesso são armazenados de forma segura e usados exclusivamente para as funcionalidades da plataforma.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Segurança</h2>
            <p>Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Seus direitos</h2>
            <p>Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento. Para exercer esses direitos, entre em contato conosco.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Retenção de dados</h2>
            <p>Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir sua conta, seus dados serão removidos de nossos sistemas em até 30 dias.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contato</h2>
            <p>Se tiver dúvidas sobre esta política, entre em contato pelo e-mail: <span className="text-purple-400">contato@automationpro.com.br</span></p>
          </section>
        </div>
      </div>
    </div>
  )
}

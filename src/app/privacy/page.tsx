import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade - PediuFood',
  description: 'Nossa política de privacidade e proteção de dados pessoais conforme LGPD',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Política de Privacidade
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Última atualização:</strong> 03 de janeiro de 2026
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Informações Gerais</h2>
              <p className="text-gray-700 mb-4">
                A PediuFood ("nós", "nosso" ou "empresa") respeita sua privacidade e está comprometida em proteger suas informações pessoais. 
                Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações quando você usa nossa plataforma.
              </p>
              <p className="text-gray-700">
                Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018) e demais regulamentações aplicáveis.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Informações que Coletamos</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-3">2.1 Informações Fornecidas por Você</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Nome completo e dados de identificação</li>
                <li>Endereço de e-mail e telefone</li>
                <li>Endereço de entrega e cobrança</li>
                <li>Informações de pagamento (processadas por terceiros seguros)</li>
                <li>Preferências e histórico de pedidos</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-3">2.2 Informações Coletadas Automaticamente</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Dados de uso da plataforma</li>
                <li>Informações do dispositivo (IP, navegador, sistema operacional)</li>
                <li>Cookies e tecnologias similares</li>
                <li>Localização (com seu consentimento)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Como Usamos suas Informações</h2>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Processar e entregar seus pedidos</li>
                <li>Comunicar sobre status de pedidos e atualizações</li>
                <li>Melhorar nossos serviços e experiência do usuário</li>
                <li>Prevenir fraudes e garantir segurança</li>
                <li>Cumprir obrigações legais e regulamentares</li>
                <li>Enviar comunicações de marketing (com seu consentimento)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Compartilhamento de Informações</h2>
              <p className="text-gray-700 mb-4">
                Não vendemos suas informações pessoais. Compartilhamos apenas quando necessário:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Com restaurantes parceiros para processamento de pedidos</li>
                <li>Com prestadores de serviços (pagamento, entrega, tecnologia)</li>
                <li>Por exigência legal ou ordem judicial</li>
                <li>Com seu consentimento explícito</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Integração com o Google</h2>
              <p className="text-gray-700 mb-4">
                Utilizamos serviços do Google para melhorar sua experiência:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Google My Business para reviews e avaliações</li>
                <li>Google Maps para localização e entrega</li>
                <li>Google Analytics para análise de uso</li>
              </ul>
              <p className="text-gray-700">
                O uso destes serviços está sujeito à Política de Privacidade do Google.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Seus Direitos (LGPD)</h2>
              <p className="text-gray-700 mb-4">Você tem direito a:</p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Confirmação da existência de tratamento de dados</li>
                <li>Acesso aos seus dados pessoais</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados</li>
                <li>Anonimização, bloqueio ou eliminação de dados</li>
                <li>Portabilidade dos dados</li>
                <li>Revogação do consentimento</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Segurança dos Dados</h2>
              <p className="text-gray-700">
                Implementamos medidas técnicas e organizacionais adequadas para proteger suas informações contra acesso não autorizado, 
                alteração, divulgação ou destruição, incluindo criptografia, controles de acesso e monitoramento contínuo.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Retenção de Dados</h2>
              <p className="text-gray-700">
                Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta política, 
                obrigações legais ou até que você solicite a exclusão.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Cookies</h2>
              <p className="text-gray-700">
                Utilizamos cookies essenciais para o funcionamento da plataforma e cookies analíticos para melhorar nossos serviços. 
                Você pode gerenciar suas preferências de cookies nas configurações do navegador.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Alterações nesta Política</h2>
              <p className="text-gray-700">
                Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas por e-mail ou através da plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contato</h2>
              <p className="text-gray-700 mb-4">
                Para questões sobre esta política ou exercer seus direitos, entre em contato:
              </p>
              <ul className="list-none text-gray-700">
                <li><strong>E-mail:</strong> privacidade@pediufood.com</li>
                <li><strong>Endereço:</strong> [Endereço da empresa]</li>
                <li><strong>DPO:</strong> dpo@pediufood.com</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

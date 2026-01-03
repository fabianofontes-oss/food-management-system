import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Serviço - PediuFood',
  description: 'Termos e condições de uso da plataforma PediuFood',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Termos de Serviço
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Última atualização:</strong> 03 de janeiro de 2026
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
              <p className="text-gray-700 mb-4">
                Ao acessar e usar a plataforma PediuFood ("Serviço"), você concorda em cumprir e ficar vinculado a estes Termos de Serviço. 
                Se você não concordar com algum destes termos, não deve usar nosso serviço.
              </p>
              <p className="text-gray-700">
                Estes termos se aplicam a todos os visitantes, usuários e outras pessoas que acessam ou usam o serviço.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Descrição do Serviço</h2>
              <p className="text-gray-700 mb-4">
                A PediuFood é uma plataforma que oferece:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Sistema de gestão para restaurantes e estabelecimentos de food service</li>
                <li>Cardápios digitais e sistema de pedidos online</li>
                <li>Ferramentas de gestão de entregas e motoristas</li>
                <li>Integração com sistemas de pagamento</li>
                <li>Analytics e relatórios de vendas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Registro e Contas de Usuário</h2>
              <p className="text-gray-700 mb-4">
                Para usar alguns aspectos do serviço, você deve criar uma conta e fornecer informações precisas e completas. 
                Você é responsável por:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Manter a confidencialidade de sua senha</li>
                <li>Todas as atividades que ocorrem em sua conta</li>
                <li>Notificar-nos imediatamente sobre uso não autorizado</li>
                <li>Manter informações de conta atualizadas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Uso Aceitável</h2>
              <p className="text-gray-700 mb-4">Você concorda em NÃO:</p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Usar o serviço para atividades ilegais ou não autorizadas</li>
                <li>Violar direitos de propriedade intelectual</li>
                <li>Transmitir vírus, malware ou código malicioso</li>
                <li>Interferir com a segurança do serviço</li>
                <li>Criar contas múltiplas para contornar limitações</li>
                <li>Usar dados de outros usuários sem permissão</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Planos e Pagamentos</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-3">5.1 Planos de Assinatura</h3>
              <p className="text-gray-700 mb-4">
                Oferecemos diferentes planos de assinatura com recursos e limitações específicas. 
                Os detalhes de cada plano estão disponíveis em nossa página de preços.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mb-3">5.2 Cobrança</h3>
              <ul className="list-disc pl-6 text-gray-700">
                <li>As assinaturas são cobradas mensalmente</li>
                <li>Os pagamentos são processados automaticamente</li>
                <li>Preços podem ser alterados com 30 dias de antecedência</li>
                <li>Não oferecemos reembolsos para períodos já utilizados</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Propriedade Intelectual</h2>
              <p className="text-gray-700 mb-4">
                O serviço e seu conteúdo original, recursos e funcionalidades são de propriedade da PediuFood e são protegidos por 
                direitos autorais, marcas registradas, patentes, segredos comerciais e outras leis de propriedade intelectual.
              </p>
              <p className="text-gray-700">
                Você mantém os direitos sobre o conteúdo que carrega, mas nos concede uma licença para usar, 
                modificar e exibir esse conteúdo em conexão com o serviço.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Privacidade e Proteção de Dados</h2>
              <p className="text-gray-700">
                Sua privacidade é importante para nós. Nossa Política de Privacidade explica como coletamos, 
                usamos e protegemos suas informações quando você usa nosso serviço. 
                Ao usar nosso serviço, você concorda com a coleta e uso de informações de acordo com nossa política.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Rescisão</h2>
              <p className="text-gray-700 mb-4">
                Podemos encerrar ou suspender sua conta e acesso ao serviço imediatamente, 
                sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo violação destes Termos.
              </p>
              <p className="text-gray-700">
                Você pode cancelar sua conta a qualquer momento através das configurações da conta ou entrando em contato conosco.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Isenção de Garantias</h2>
              <p className="text-gray-700">
                O serviço é fornecido "como está" e "conforme disponível", sem garantias de qualquer tipo. 
                Não garantimos que o serviço será ininterrupto, livre de erros ou completamente seguro.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Limitação de Responsabilidade</h2>
              <p className="text-gray-700">
                Em nenhuma circunstância a PediuFood será responsável por danos indiretos, incidentais, 
                especiais, consequenciais ou punitivos, incluindo perda de lucros, dados ou uso.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Lei Aplicável</h2>
              <p className="text-gray-700">
                Estes Termos serão interpretados e regidos pelas leis do Brasil, 
                sem considerar conflitos de princípios legais. Qualquer disputa será resolvida nos tribunais brasileiros.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Alterações nos Termos</h2>
              <p className="text-gray-700">
                Reservamos o direito de modificar estes termos a qualquer momento. 
                Se fizermos alterações materiais, notificaremos você por e-mail ou através de um aviso em nosso serviço.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Contato</h2>
              <p className="text-gray-700 mb-4">
                Se você tiver dúvidas sobre estes Termos de Serviço, entre em contato conosco:
              </p>
              <ul className="list-none text-gray-700">
                <li><strong>E-mail:</strong> suporte@pediufood.com</li>
                <li><strong>Telefone:</strong> [Telefone da empresa]</li>
                <li><strong>Endereço:</strong> [Endereço da empresa]</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

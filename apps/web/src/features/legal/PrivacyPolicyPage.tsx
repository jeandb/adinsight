import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = 'Política de Privacidade — AdInsight'
    return () => { document.title = 'AdInsight' }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar para o login
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Política de Privacidade — AdInsight</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Última atualização: 20 de abril de 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">1. Sobre esta Política</h2>
            <p>
              Esta Política de Privacidade descreve como o <strong>AdInsight</strong> coleta,
              utiliza, compartilha e protege dados pessoais de usuários da plataforma.
            </p>
            <p>Ao utilizar o AdInsight, você declara ciência desta Política.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">2. Quem somos</h2>
            <p>
              O AdInsight é uma plataforma de análise de dados de campanhas e performance
              comercial utilizada no ecossistema da Prof Jaque Mendes.
            </p>
            <p>
              Para fins da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 —{' '}
              <strong>LGPD</strong>), o AdInsight atua como <strong>Controlador</strong> de dados
              pessoais nos contextos em que define as finalidades e os meios de tratamento.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">3. Dados pessoais que podemos tratar</h2>
            <p>Podemos tratar as seguintes categorias de dados:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Dados de identificação e conta:</strong> nome, e-mail, perfil de acesso,
                credenciais de autenticação.
              </li>
              <li>
                <strong>Dados de uso da plataforma:</strong> logs de acesso, ações realizadas,
                data e horário de operações, preferências.
              </li>
              <li>
                <strong>Dados técnicos:</strong> endereço IP, tipo de dispositivo, navegador,
                sistema operacional, identificadores de sessão.
              </li>
              <li>
                <strong>Dados de integrações:</strong> informações vinculadas a conexões com
                plataformas de mídia e sistemas de e-commerce, conforme permissões concedidas.
              </li>
              <li>
                <strong>Dados de suporte:</strong> informações enviadas em solicitações de
                atendimento e contato.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">4. Finalidades do tratamento</h2>
            <p>Tratamos dados pessoais para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>viabilizar autenticação, autorização e gestão de usuários;</li>
              <li>operar funcionalidades analíticas e de visualização de métricas;</li>
              <li>executar integrações com fontes de dados conectadas;</li>
              <li>garantir segurança, prevenção a fraudes e integridade da plataforma;</li>
              <li>cumprir obrigações legais, regulatórias e de auditoria;</li>
              <li>melhorar desempenho, usabilidade e estabilidade do AdInsight;</li>
              <li>atender solicitações de suporte e comunicação operacional.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">5. Bases legais (LGPD)</h2>
            <p>As operações de tratamento podem se fundamentar, conforme o caso, em:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>execução de contrato</strong> e procedimentos preliminares relacionados;
              </li>
              <li>
                <strong>cumprimento de obrigação legal ou regulatória</strong>;
              </li>
              <li>
                <strong>legítimo interesse</strong> do Controlador, com avaliação de
                proporcionalidade;
              </li>
              <li>
                <strong>exercício regular de direitos</strong> em processo judicial,
                administrativo ou arbitral;
              </li>
              <li>
                <strong>consentimento</strong>, quando legalmente exigido.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">6. Compartilhamento de dados</h2>
            <p>Os dados poderão ser compartilhados com:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>provedores de infraestrutura em nuvem, banco de dados e serviços de fila/cache;</li>
              <li>fornecedores de autenticação, monitoramento, e-mail e observabilidade;</li>
              <li>
                parceiros de tecnologia necessários à execução das integrações da plataforma;
              </li>
              <li>
                autoridades públicas, quando houver obrigação legal, ordem judicial ou requisição
                válida.
              </li>
            </ul>
            <p>Não comercializamos dados pessoais.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">7. Transferência internacional</h2>
            <p>
              Dependendo da infraestrutura utilizada, alguns dados podem ser processados ou
              armazenados fora do Brasil.
            </p>
            <p>
              Nesses casos, adotamos medidas para assegurar nível adequado de proteção e
              conformidade com a LGPD, incluindo cláusulas contratuais e avaliação de
              fornecedores.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">8. Retenção e descarte</h2>
            <p>
              Os dados são mantidos pelo período necessário para cumprir as finalidades desta
              Política, obrigações legais e defesa de direitos.
            </p>
            <p>
              Encerrada a necessidade, os dados serão eliminados ou anonimizados, ressalvadas
              hipóteses legais de conservação.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">9. Segurança da informação</h2>
            <p>
              Adotamos medidas técnicas e organizacionais compatíveis com o mercado para proteção
              dos dados pessoais, incluindo, entre outras:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>controle de acesso por perfil e autenticação;</li>
              <li>criptografia de dados sensíveis em repouso e em trânsito, quando aplicável;</li>
              <li>monitoramento de eventos e registros de auditoria;</li>
              <li>boas práticas de desenvolvimento e gestão de vulnerabilidades.</li>
            </ul>
            <p>
              Apesar dos esforços, nenhum ambiente é totalmente imune a riscos. Por isso,
              recomendamos que usuários também adotem práticas seguras de uso.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">10. Direitos do titular de dados</h2>
            <p>Nos termos da LGPD, você poderá solicitar:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>confirmação da existência de tratamento;</li>
              <li>acesso aos dados pessoais;</li>
              <li>correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>
                anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em
                desconformidade;
              </li>
              <li>portabilidade, quando aplicável;</li>
              <li>eliminação dos dados tratados com consentimento, quando cabível;</li>
              <li>informação sobre compartilhamento;</li>
              <li>revisão de decisões automatizadas, quando aplicável;</li>
              <li>
                revogação de consentimento, nos casos em que essa for a base legal.
              </li>
            </ul>
            <p>
              As solicitações serão analisadas nos prazos legais e podem depender de validação de
              identidade.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">11. Cookies e tecnologias semelhantes</h2>
            <p>O AdInsight pode utilizar cookies e tecnologias equivalentes para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>manter sessão autenticada;</li>
              <li>lembrar preferências;</li>
              <li>medir desempenho e uso da aplicação;</li>
              <li>aprimorar experiência e segurança.</li>
            </ul>
            <p>
              Sempre que necessário, mecanismos de consentimento e gestão de preferências serão
              disponibilizados.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">12. Crianças e adolescentes</h2>
            <p>
              A plataforma AdInsight não é direcionada a crianças. Caso seja identificado
              tratamento indevido de dados de menores, medidas de bloqueio e exclusão poderão ser
              adotadas, observada a legislação aplicável.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">13. Alterações desta Política</h2>
            <p>
              Esta Política poderá ser atualizada periodicamente para refletir mudanças legais,
              regulatórias ou operacionais.
            </p>
            <p>A versão vigente será sempre publicada com a data de última atualização.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">14. Contato e canal de privacidade</h2>
            <p>
              Para dúvidas, solicitações relacionadas a dados pessoais ou exercício de direitos do
              titular:
            </p>
            <p>
              <strong>E-mail:</strong>{' '}
              <a
                href="mailto:admin@jaquemendes.com"
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                admin@jaquemendes.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            AdInsight · Prof Jaque Mendes · Uso interno
          </p>
        </div>
      </div>
    </div>
  )
}

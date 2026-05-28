/**
 * Termos de Uso - Interno Rotas
 *
 * Texto integral conforme o Marco Civil da Internet (Lei nº 12.965/2014),
 * o Código de Defesa do Consumidor (Lei nº 8.078/1990) e a LGPD (Lei nº
 * 13.709/2018).
 */

import { tenantConfig } from '@/tenants/tenantConfig';

const LAST_UPDATED = '21 de maio de 2026';
const EFFECTIVE_DATE = '21 de maio de 2026';

interface SectionProps {
  id?: string;
  title: string;
  children: React.ReactNode;
}

function Section({ id, title, children }: SectionProps) {
  return (
    <section id={id} className="space-y-2">
      <h3 className="text-base font-semibold text-text-primary sm:text-lg">{title}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-text-secondary">{children}</div>
    </section>
  );
}

export function TermsOfUseContent() {
  return (
    <article className="space-y-6 text-sm leading-relaxed text-text-secondary">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-text-tertiary">
          Última atualização: {LAST_UPDATED} · Vigência: {EFFECTIVE_DATE}
        </p>
        <p>
          Estes Termos de Uso ("Termos") regulam o acesso e a utilização do aplicativo{' '}
          <strong>{tenantConfig.appName}</strong> ("Interno Rotas", "aplicativo" ou "serviço")
          disponibilizado por <strong>Igor Martins</strong> ("Operador" ou "nós") aos usuários
          ("você").
        </p>
        <p>
          Ao acessar ou utilizar o Interno Rotas, você declara haver lido, compreendido e aceitado
          integralmente estes Termos, bem como a{' '}
          <a
            href="/privacidade"
            className="font-medium text-brand-primary underline-offset-2 hover:underline"
          >
            Política de Privacidade
          </a>
          . Caso não concorde, deverá interromper imediatamente o uso.
        </p>
      </header>

      <Section id="aceitacao" title="1. Aceitação e capacidade">
        <p>
          Estes Termos constituem contrato eletrônico entre você e o Operador, com força obrigatória
          a partir do primeiro acesso. Para utilizar o aplicativo você declara ter pelo menos{' '}
          <strong>13 (treze) anos completos</strong>, idade mínima compatível com o Estatuto da
          Criança e do Adolescente (Lei nº 8.069/1990) e com a Lei Geral de Proteção de Dados
          (LGPD), observadas as condições deste item.
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong>Usuários a partir de 18 anos:</strong> possuem capacidade civil plena e podem
            aceitar estes Termos de forma autônoma.
          </li>
          <li>
            <strong>Adolescentes entre 13 e 17 anos:</strong> podem utilizar o aplicativo mediante{' '}
            <strong>
              autorização e supervisão de pelo menos um dos pais ou responsáveis legais
            </strong>
            , que respondem pelos atos do adolescente perante estes Termos e podem solicitar, a
            qualquer tempo, o encerramento da conta e a exclusão dos dados pelos canais previstos na{' '}
            <a
              href="/privacidade"
              className="font-medium text-brand-primary underline-offset-2 hover:underline"
            >
              Política de Privacidade
            </a>
            .
          </li>
          <li>
            <strong>Menores de 13 anos:</strong> não podem criar conta ou contribuir com dados (GPS,
            avaliações, doações). Contas detectadas como pertencentes a crianças serão excluídas e
            os dados anonimizados conforme art. 14 da LGPD.
          </li>
        </ul>
        <p>
          O serviço é fornecido "no estado em que se encontra" e pode ser atualizado, alterado ou
          descontinuado total ou parcialmente, com aviso prévio razoável quando aplicável.
        </p>
      </Section>

      <Section id="natureza-do-servico" title="2. Natureza do serviço">
        <p>
          O Interno Rotas é uma <strong>iniciativa comunitária independente</strong>, sem qualquer
          vínculo institucional formal com a {tenantConfig.institutionName} ou com órgãos públicos.
          Seu objetivo é facilitar a consulta de linhas, paradas e estimativas de chegada (ETA) das
          rotas internas universitárias.
        </p>
        <p>
          As informações exibidas têm <strong>caráter meramente informativo</strong>. Horários,
          itinerários e previsões podem variar em razão de fatores operacionais, climáticos, de
          trânsito ou colaboração dos usuários. O Operador não garante exatidão absoluta nem
          disponibilidade ininterrupta do serviço.
        </p>
      </Section>

      <Section id="cadastro" title="3. Cadastro e conta de usuário">
        <p>
          Funcionalidades específicas (rastreio colaborativo, gamificação, doações) exigem
          autenticação via provedor Google. Você se compromete a:
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>fornecer informações verdadeiras, atualizadas e completas;</li>
          <li>manter sigilo absoluto sobre suas credenciais de acesso;</li>
          <li>notificar o Operador imediatamente em caso de uso não autorizado de sua conta;</li>
          <li>ser o único responsável por toda atividade realizada por meio de sua conta.</li>
        </ul>
        <p>
          O Operador poderá suspender ou cancelar contas que apresentem indícios de fraude,
          múltiplos acessos suspeitos, automação não autorizada ou violação destes Termos, mediante
          análise técnica fundamentada.
        </p>
      </Section>

      <Section id="uso-permitido" title="4. Uso permitido">
        <p>O serviço é destinado ao uso pessoal, não comercial. É permitido:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>consultar linhas, paradas, horários e estimativas;</li>
          <li>compartilhar links públicos do aplicativo;</li>
          <li>colaborar com rastreio GPS de forma voluntária, durante deslocamentos efetivos;</li>
          <li>realizar contribuições financeiras voluntárias por meio dos canais oficiais.</li>
        </ul>
      </Section>

      <Section id="uso-proibido" title="5. Condutas vedadas">
        <p>
          É vedado ao usuário, sob pena de suspensão imediata da conta e responsabilização civil e
          criminal:
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            fornecer coordenadas GPS simuladas, falsificadas ou geradas artificialmente (spoofing);
          </li>
          <li>utilizar bots, scripts, scrapers ou qualquer automação não autorizada;</li>
          <li>tentar acessar áreas administrativas, dados de terceiros ou recursos protegidos;</li>
          <li>
            realizar engenharia reversa, descompilação ou modificação não autorizada do código;
          </li>
          <li>introduzir malware, exploits, vulnerabilidades ou sobrecarregar a infraestrutura;</li>
          <li>burlar mecanismos de gamificação ou inflacionar pontuação de forma indevida;</li>
          <li>
            utilizar o serviço para finalidades ilícitas, discriminatórias, ofensivas ou que violem
            direitos de terceiros;
          </li>
          <li>
            copiar, reproduzir, distribuir ou explorar comercialmente qualquer parte do conteúdo sem
            autorização expressa.
          </li>
        </ul>
      </Section>

      <Section id="propriedade" title="6. Propriedade intelectual">
        <p>
          A marca <strong>Interno Rotas</strong>, o logotipo, o design system, a identidade visual,
          textos, ícones e demais elementos do aplicativo são protegidos pela Lei nº 9.279/1996
          (Propriedade Industrial), Lei nº 9.610/1998 (Direitos Autorais) e tratados internacionais
          aplicáveis.
        </p>
        <p>
          O código-fonte do frontend é disponibilizado publicamente sob licença específica indicada
          no{' '}
          {tenantConfig.publicRepositoryUrl ? (
            <a
              href={tenantConfig.publicRepositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-primary underline-offset-2 hover:underline"
            >
              repositório oficial
            </a>
          ) : (
            'repositório oficial'
          )}
          . O backend, motor de validação anti-fraude (engine) e dados curados permanecem
          proprietários e não são licenciados ao público.
        </p>
        <p>
          Dados de transporte coletivo divulgados pela {tenantConfig.institutionName} podem estar
          sujeitos a regimes próprios de uso. Recomenda-se consulta direta à instituição quando
          necessário.
        </p>
      </Section>

      <Section id="conteudo-do-usuario" title="7. Contribuições colaborativas">
        <p>
          Ao enviar coordenadas GPS, avaliações ou demais contribuições, você concede ao Operador
          licença não exclusiva, gratuita, mundial e por prazo indeterminado para tratar, agregar e
          processar tais dados unicamente para as finalidades descritas na Política de Privacidade.
        </p>
        <p>
          Você se compromete a colaborar de boa-fé, com dados condizentes com sua realidade de
          deslocamento. Contribuições maliciosas, automatizadas ou que violem direitos de terceiros
          poderão ser descartadas e ensejar suspensão da conta.
        </p>
      </Section>

      <Section id="pagamentos" title="8. Doações e contribuições financeiras">
        <p>
          O Interno Rotas pode oferecer canais voluntários de apoio financeiro (doação única ou
          contribuição recorrente) operados por meio de provedor de pagamentos certificado
          (atualmente Mercado Pago). Tais contribuições:
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            são integralmente voluntárias e <strong>não</strong> desbloqueiam funcionalidades
            essenciais do serviço;
          </li>
          <li>não geram vínculo contratual de prestação de serviço pago;</li>
          <li>
            são tratadas conforme termos do operador de pagamento e legislação tributária aplicável;
          </li>
          <li>
            podem ser objeto de estorno ou solicitação de chargeback nos termos da legislação
            consumerista; a devolução, quando aplicável, observará prazos e procedimentos do
            operador de pagamento.
          </li>
        </ul>
      </Section>

      <Section id="responsabilidade" title="9. Limitação de responsabilidade">
        <p>
          Dentro dos limites permitidos pelo Código de Defesa do Consumidor e demais legislações
          aplicáveis, o Operador <strong>não se responsabiliza</strong> por:
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            decisões tomadas com base em horários, paradas ou ETAs informados pelo aplicativo;
          </li>
          <li>
            indisponibilidade temporária decorrente de manutenção, falhas de rede ou caso fortuito;
          </li>
          <li>condutas de terceiros que violem estes Termos;</li>
          <li>
            perdas indiretas, lucros cessantes ou danos morais não decorrentes de dolo ou culpa
            grave do Operador;
          </li>
          <li>conteúdos, sistemas ou produtos de terceiros referenciados no aplicativo.</li>
        </ul>
        <p>
          A responsabilidade objetiva do Operador, quando aplicável, limita-se ao valor das
          contribuições efetivamente recebidas do usuário nos últimos 12 meses, salvo quando a
          legislação dispuser de modo diverso.
        </p>
      </Section>

      <Section id="suspensao" title="10. Suspensão e encerramento">
        <p>
          O Operador poderá suspender ou encerrar o acesso do usuário ao serviço, com ou sem aviso
          prévio, nas hipóteses de:
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>violação destes Termos ou da legislação aplicável;</li>
          <li>uso fraudulento, abusivo ou em desacordo com a finalidade pretendida;</li>
          <li>determinação judicial ou administrativa;</li>
          <li>
            descontinuação total ou parcial do serviço, com aviso público com antecedência mínima de
            30 dias quando viável.
          </li>
        </ul>
        <p>
          Você pode encerrar sua conta a qualquer momento pela opção{' '}
          <em>Solicitar exclusão de conta</em> na página de perfil, sem prejuízo do direito de
          oposição e revogação de consentimento previstos na Política de Privacidade.
        </p>
      </Section>

      <Section id="comunicacoes" title="11. Comunicações">
        <p>
          As comunicações entre você e o Operador ocorrem preferencialmente por meios eletrônicos.
          Notificações relevantes sobre alterações no serviço, nestes Termos ou na Política de
          Privacidade serão publicadas no próprio aplicativo, no repositório público ou enviadas por
          e-mail quando aplicável.
        </p>
      </Section>

      <Section id="alteracoes" title="12. Alterações dos Termos">
        <p>
          Estes Termos podem ser revisados periodicamente. Alterações materiais entrarão em vigor
          após 15 (quinze) dias de publicação no aplicativo. A continuidade do uso após esse prazo
          implica concordância tácita com a nova versão. A versão vigente estará sempre disponível
          em <code className="rounded bg-background-secondary px-1">/termos</code>.
        </p>
      </Section>

      <Section id="legislacao" title="13. Legislação aplicável e foro">
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial pelo
          Marco Civil da Internet (Lei nº 12.965/2014), pelo Código de Defesa do Consumidor (Lei nº
          8.078/1990) e pela LGPD (Lei nº 13.709/2018).
        </p>
        <p>
          Fica eleito o foro da comarca de {tenantConfig.cityName}/MG para dirimir quaisquer
          controvérsias decorrentes destes Termos, com renúncia a qualquer outro foro, por mais
          privilegiado que seja, ressalvadas as hipóteses de competência absoluta previstas em lei,
          em especial as relativas a relação de consumo, que observarão o foro do domicílio do
          consumidor.
        </p>
      </Section>

      <Section id="disposicoes-gerais" title="14. Disposições gerais">
        <p>
          A invalidade ou inexequibilidade de qualquer cláusula destes Termos não prejudicará a
          validade das demais. A omissão do Operador em exercer qualquer direito previsto nestes
          Termos não constituirá renúncia.
        </p>
        <p>
          Em caso de dúvida, sugestão ou solicitação relacionada a estes Termos, utilize o{' '}
          <a
            href="https://forms.gle/5e9MHq9pp1p8T5Px5"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-primary underline-offset-2 hover:underline"
          >
            canal de contato
          </a>
          .
        </p>
      </Section>
    </article>
  );
}

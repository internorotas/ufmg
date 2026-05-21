/**
 * Política de Privacidade - Interno Rotas
 *
 * Texto integral em conformidade com a Lei Geral de Proteção de Dados Pessoais
 * (Lei nº 13.709/2018 - LGPD), Marco Civil da Internet (Lei nº 12.965/2014) e
 * orientações da Autoridade Nacional de Proteção de Dados (ANPD).
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

export function PrivacyPolicyContent() {
  return (
    <article className="space-y-6 text-sm leading-relaxed text-text-secondary">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-text-tertiary">
          Última atualização: {LAST_UPDATED} · Vigência: {EFFECTIVE_DATE}
        </p>
        <p>
          Esta Política de Privacidade descreve como o aplicativo{' '}
          <strong>{tenantConfig.appName}</strong> ("Interno Rotas", "aplicativo" ou "serviço")
          coleta, utiliza, armazena, compartilha e protege os dados pessoais dos titulares ("você"),
          em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD),
          o Marco Civil da Internet (Lei nº 12.965/2014) e demais normas aplicáveis.
        </p>
        <p>
          Ao utilizar o Interno Rotas, você declara estar ciente desta Política e, quando exigido,
          fornece consentimento livre, informado e inequívoco para o tratamento de dados descrito
          aqui.
        </p>
      </header>

      <Section id="controlador" title="1. Controlador e contato do encarregado">
        <p>
          O Interno Rotas é um projeto comunitário mantido por <strong>Igor Martins</strong>
          ("Controlador"), responsável pelas decisões sobre o tratamento dos dados pessoais
          relacionados ao aplicativo. O projeto não é uma iniciativa oficial da{' '}
          {tenantConfig.institutionName} e atua de forma autônoma com finalidade pública e
          colaborativa.
        </p>
        <p>
          O Encarregado pela Proteção de Dados (DPO) pode ser contatado pelo canal oficial de
          comunicação do projeto:{' '}
          <a
            href="https://forms.gle/5e9MHq9pp1p8T5Px5"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-primary underline-offset-2 hover:underline"
          >
            formulário de contato
          </a>
          . Toda comunicação relativa à LGPD será respondida em até 15 (quinze) dias úteis.
        </p>
      </Section>

      <Section id="bases-legais" title="2. Bases legais do tratamento">
        <p>
          O tratamento de dados pessoais ocorre com base nas seguintes hipóteses legais previstas no
          art. 7º e art. 11 da LGPD, conforme a finalidade:
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong>Consentimento (art. 7º, I):</strong> coleta e envio de coordenadas GPS para
            rastreio colaborativo, participação em pesquisas científicas e envio de notificações
            push;
          </li>
          <li>
            <strong>Execução de contrato (art. 7º, V):</strong> criação e manutenção de conta de
            usuário, autenticação e operação do sistema de gamificação;
          </li>
          <li>
            <strong>Legítimo interesse (art. 7º, IX):</strong> prevenção a fraude, segurança da
            informação, registros de auditoria e métricas operacionais agregadas;
          </li>
          <li>
            <strong>Cumprimento de obrigação legal (art. 7º, II):</strong> retenção mínima exigida
            pelo Marco Civil da Internet (logs de acesso por seis meses) e atendimento a requisições
            de autoridades competentes;
          </li>
          <li>
            <strong>
              Tutela da saúde, exercício regular de direitos e proteção do crédito (art. 7º, VIII e
              art. 11):
            </strong>{' '}
            processamento de doações e contribuições financeiras voluntárias.
          </li>
        </ul>
      </Section>

      <Section id="dados-coletados" title="3. Dados pessoais tratados">
        <p>
          O Interno Rotas trata as seguintes categorias de dados, observado o princípio da
          minimização:
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong>Dados de identificação e cadastro:</strong> nome de exibição, endereço de e-mail
            institucional ou pessoal, foto de avatar e identificador único do provedor de
            autenticação (Google), obtidos exclusivamente por meio do fluxo OAuth 2.0.
          </li>
          <li>
            <strong>Dados de uso e dispositivo:</strong> tipo e versão do navegador, sistema
            operacional, idioma, fuso horário, endereço IP truncado e identificadores anônimos de
            sessão.
          </li>
          <li>
            <strong>Dados de geolocalização (sensíveis quanto à finalidade):</strong> coordenadas
            latitude e longitude, precisão estimada e direção (heading), coletadas pelo dispositivo
            apenas quando você ativa o rastreio colaborativo de uma linha. As coordenadas são sempre
            associadas a um <em>identificador hash</em> derivado por HMAC-SHA-256 com sal semanal,
            de modo que o backend nunca recebe o identificador legível do usuário.
          </li>
          <li>
            <strong>Preferências e consentimentos:</strong> tema visual, perfil público,
            visibilidade do marcador no mapa, nível de detalhamento do ranking, perfil de
            notificação, data e hora dos consentimentos concedidos.
          </li>
          <li>
            <strong>Contribuições colaborativas:</strong> registros de viagens iniciadas/encerradas,
            avaliações pós-viagem, sinalizações de serviço e pontuação de gamificação.
          </li>
          <li>
            <strong>Dados de pagamento (quando aplicável):</strong> identificador de transação
            (token opaco), valor, status, data e modalidade. O Interno Rotas{' '}
            <strong>não armazena</strong> dados de cartão, chave PIX ou credencial bancária; estes
            são tratados exclusivamente pelo operador de pagamento.
          </li>
          <li>
            <strong>Logs de acesso e auditoria:</strong> mantidos pelo prazo legal de seis meses
            conforme art. 15 do Marco Civil da Internet.
          </li>
        </ul>
        <p className="text-xs text-text-tertiary">
          O Interno Rotas não coleta intencionalmente dados de categorias sensíveis (origem racial,
          convicção religiosa, opinião política, filiação sindical, saúde, vida sexual, dado
          genético ou biométrico). Caso identifique qualquer coleta acidental, entre em contato
          imediatamente para remoção.
        </p>
      </Section>

      <Section id="finalidades" title="4. Finalidades do tratamento">
        <p>Os dados são tratados estritamente para as finalidades descritas a seguir:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>fornecer e manter o serviço de consulta de linhas, paradas e previsões;</li>
          <li>autenticar usuários e proteger o acesso à conta;</li>
          <li>
            calcular estimativas de chegada (ETA) e melhorar a qualidade das previsões por meio de
            agregação estatística;
          </li>
          <li>
            operar o rastreio colaborativo opcional e o sistema de gamificação (ranking, emblemas);
          </li>
          <li>enviar notificações operacionais quando autorizadas pelo titular;</li>
          <li>processar contribuições financeiras voluntárias por meio de operador certificado;</li>
          <li>
            prevenir fraudes, abusos e ataques (rate-limiting, honeypot, detecção de anomalias);
          </li>
          <li>
            cumprir obrigações legais e responder a requisições judiciais ou administrativas
            cabíveis;
          </li>
          <li>
            quando você consentir expressamente, viabilizar análises científicas e de mobilidade
            urbana, sempre com dados agregados ou pseudonimizados.
          </li>
        </ul>
      </Section>

      <Section id="compartilhamento" title="5. Compartilhamento com terceiros">
        <p>
          O Interno Rotas <strong>não vende</strong> dados pessoais. O compartilhamento ocorre
          apenas com operadores estritamente necessários à prestação do serviço, sob contrato e com
          dever de confidencialidade:
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong>Google LLC</strong> – autenticação OAuth 2.0 e métricas agregadas (Google
            Analytics 4 com IP anonimizado, sem cross-site tracking). Política:{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-primary underline-offset-2 hover:underline"
            >
              policies.google.com/privacy
            </a>
            .
          </li>
          <li>
            <strong>Mercado Pago (Ebazar.com Ltda.)</strong> – processamento de doações PIX, quando
            aplicável. Política:{' '}
            <a
              href="https://www.mercadopago.com.br/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-primary underline-offset-2 hover:underline"
            >
              mercadopago.com.br/privacidade
            </a>
            .
          </li>
          <li>
            <strong>Render Services Inc.</strong> – provedor de infraestrutura de hospedagem do
            backend. Política:{' '}
            <a
              href="https://render.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-primary underline-offset-2 hover:underline"
            >
              render.com/privacy
            </a>
            .
          </li>
          <li>
            <strong>GitHub, Inc.</strong> – hospedagem da interface pública (GitHub Pages) e
            repositório do código-fonte. Política:{' '}
            <a
              href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-primary underline-offset-2 hover:underline"
            >
              docs.github.com/privacy
            </a>
            .
          </li>
          <li>
            <strong>Cloudflare, Inc.</strong> – proteção contra abuso, mitigação de DDoS e túnel de
            acesso administrativo. Política:{' '}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-primary underline-offset-2 hover:underline"
            >
              cloudflare.com/privacypolicy
            </a>
            .
          </li>
        </ul>
        <p>
          Pesquisadores e parceiros institucionais somente acessam dados agregados ou anonimizados
          (dataset estatístico, sem identificadores), nos termos do art. 7º, IV e art. 12 da LGPD.
        </p>
      </Section>

      <Section id="transferencia-internacional" title="6. Transferência internacional de dados">
        <p>
          Alguns operadores citados acima processam dados fora do território nacional (Estados
          Unidos e União Europeia). Essas transferências observam o art. 33 da LGPD, ocorrendo
          mediante cláusulas contratuais padrão, certificações reconhecidas (TRUSTe, ISO 27701) e
          adoção de medidas técnicas (criptografia em trânsito e em repouso) que garantem grau de
          proteção equivalente ao da LGPD.
        </p>
      </Section>

      <Section id="retencao" title="7. Prazo de retenção e eliminação">
        <p>
          Os dados são mantidos pelo tempo estritamente necessário à finalidade que motivou seu
          tratamento:
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong>Conta e perfil:</strong> enquanto a conta estiver ativa. Após solicitação de
            exclusão, os dados são anonimizados em até 30 (trinta) dias.
          </li>
          <li>
            <strong>Coordenadas GPS:</strong> agregadas em até 24 horas; coordenadas brutas são
            descartadas após esse período.
          </li>
          <li>
            <strong>Logs de acesso:</strong> seis meses (art. 15 do Marco Civil).
          </li>
          <li>
            <strong>Registros de pagamento:</strong> cinco anos a contar do término do exercício
            fiscal, conforme art. 174 do Código Tributário Nacional.
          </li>
          <li>
            <strong>Backups criptografados:</strong> sobrescritos em ciclo máximo de 90 dias.
          </li>
        </ul>
      </Section>

      <Section id="direitos" title="8. Direitos do titular">
        <p>
          A LGPD garante a você, a qualquer momento e mediante requisição gratuita, os seguintes
          direitos (art. 18):
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>confirmação da existência de tratamento;</li>
          <li>acesso aos dados;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>
            anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em
            desconformidade;
          </li>
          <li>
            portabilidade dos dados a outro fornecedor de serviço, observados os segredos comercial
            e industrial;
          </li>
          <li>
            eliminação dos dados pessoais tratados com consentimento, ressalvadas hipóteses do art.
            16;
          </li>
          <li>
            informação sobre entidades públicas e privadas com as quais o Controlador compartilhou
            dados;
          </li>
          <li>
            informação sobre a possibilidade de não fornecer consentimento e suas consequências;
          </li>
          <li>revogação do consentimento, nos termos do art. 8º, § 5º;</li>
          <li>
            oposição a tratamento realizado com fundamento em hipóteses de dispensa de
            consentimento, em caso de descumprimento da Lei.
          </li>
        </ul>
        <p>
          Para exercer qualquer desses direitos, utilize o{' '}
          <a
            href="https://forms.gle/5e9MHq9pp1p8T5Px5"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-primary underline-offset-2 hover:underline"
          >
            canal de contato
          </a>{' '}
          ou a opção <em>Solicitar exclusão de conta</em> disponível na página de perfil.
        </p>
      </Section>

      <Section id="seguranca" title="9. Medidas de segurança">
        <p>
          Adotamos medidas técnicas e administrativas razoáveis e proporcionais ao risco, em
          conformidade com o art. 46 da LGPD, incluindo:
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>criptografia em trânsito (TLS 1.2+) e em repouso para dados sensíveis;</li>
          <li>
            tokens JWT de curta duração mantidos em memória; refresh tokens em cookies HttpOnly,
            Secure, SameSite=Strict;
          </li>
          <li>pseudonimização das contribuições GPS por HMAC-SHA-256 com sal semanal;</li>
          <li>
            controle de acesso administrativo por Cloudflare Access e autenticação multifator;
          </li>
          <li>redação automática de campos sensíveis em logs (Pino redact);</li>
          <li>
            varreduras periódicas de dependências e revisão de segurança a cada alteração relevante.
          </li>
        </ul>
        <p>
          Em caso de incidente de segurança que represente risco ou dano relevante aos titulares,
          comunicaremos a ANPD e os afetados em prazo razoável, nos termos do art. 48 da LGPD.
        </p>
      </Section>

      <Section id="cookies" title="10. Cookies e tecnologias semelhantes">
        <p>O Interno Rotas utiliza cookies e armazenamentos locais estritamente necessários:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong>Cookie de sessão (HttpOnly, Secure, SameSite=Strict):</strong> autenticação e
            manutenção da sessão do usuário;
          </li>
          <li>
            <strong>localStorage / IndexedDB:</strong> cache de dados de linhas e paradas para
            funcionamento offline e armazenamento de preferências não sensíveis (tema, idioma);
          </li>
          <li>
            <strong>Service Worker:</strong> cache controlado para Progressive Web App;
          </li>
          <li>
            <strong>Google Analytics 4 (opcional):</strong> métricas agregadas com IP anonimizado e
            sem identificação cross-site. Pode ser desativado nas configurações do navegador ou via
            extensões de bloqueio.
          </li>
        </ul>
      </Section>

      <Section id="criancas" title="11. Crianças e adolescentes">
        <p>
          O Interno Rotas é destinado a maiores de 18 anos. Não direcionamos o serviço a crianças ou
          adolescentes. Quando identificado o tratamento de dados de menor sem o devido
          consentimento de pelo menos um dos pais ou responsáveis legais, o registro será excluído
          imediatamente, conforme art. 14 da LGPD.
        </p>
      </Section>

      <Section id="anpd" title="12. Reclamações à ANPD">
        <p>
          Caso entenda que seus direitos não foram adequadamente atendidos pelo Controlador, você
          pode apresentar reclamação junto à Autoridade Nacional de Proteção de Dados (ANPD) pelo
          endereço{' '}
          <a
            href="https://www.gov.br/anpd/pt-br/canais_atendimento/cidadao/peticao-de-titular"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-primary underline-offset-2 hover:underline"
          >
            gov.br/anpd
          </a>
          .
        </p>
      </Section>

      <Section id="alteracoes" title="13. Alterações desta Política">
        <p>
          Esta Política pode ser revisada para refletir mudanças legais, regulatórias ou
          operacionais. Alterações materiais serão comunicadas no aplicativo com antecedência mínima
          de 15 dias antes de produzirem efeitos. A versão vigente estará sempre disponível em{' '}
          <code className="rounded bg-background-secondary px-1">/privacidade</code>.
        </p>
      </Section>

      <Section id="legislacao" title="14. Legislação aplicável e foro">
        <p>
          Esta Política é regida pelas leis da República Federativa do Brasil, em especial pela Lei
          nº 13.709/2018 (LGPD), pela Lei nº 12.965/2014 (Marco Civil da Internet) e pelo Código de
          Defesa do Consumidor (Lei nº 8.078/1990), quando aplicável. Fica eleito o foro da comarca
          de {tenantConfig.cityName} para dirimir quaisquer controvérsias decorrentes deste
          documento, com renúncia a qualquer outro, por mais privilegiado que seja.
        </p>
      </Section>
    </article>
  );
}

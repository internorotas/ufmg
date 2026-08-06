import { ArrowUpRight, Bus, HandCoins, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/app/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAnalytics } from '@/hooks/useAnalytics';
import { tenantConfig } from '@/tenants/tenantConfig';

function AboutLink({
  href,
  label,
  description,
  onClick,
}: {
  href: string;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="flex min-h-11 items-center justify-between surface-card-interactive bg-background px-3 py-3 text-left"
    >
      <div>
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="mt-1 text-xs text-text-secondary">{description}</p>
      </div>
      <ArrowUpRight size={16} aria-hidden="true" className="text-text-tertiary" />
    </a>
  );
}

export function AboutPage() {
  const { trackEvent, trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('/sobre');
  }, [trackPageView]);

  const handleExternalClick = (label: string) => {
    trackEvent({
      category: 'navigation',
      action: 'click_outbound_link',
      label,
    });
  };

  return (
    <AppShell title="Sobre" description="Transparência e funcionamento do projeto">
      <div className="flex flex-col gap-5">
        <header className="surface-card-lg bg-card px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">Sobre o projeto</Badge>
            <Badge variant="success">sem anúncios intrusivos</Badge>
            <Badge variant="info">sem tracking de terceiros</Badge>
          </div>

          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Transparência do Interno Rotas</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-text-secondary">
            O Interno Rotas existe para facilitar a consulta das linhas universitárias de{' '}
            {tenantConfig.institutionName} com foco em utilidade pública, GPS colaborativo e clareza
            sobre como o projeto se sustenta.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/ranking"
              className="inline-flex min-h-11 items-center justify-center surface-card-interactive px-4 text-sm font-semibold text-text-primary"
            >
              Ver ranking público
            </Link>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bus size={18} aria-hidden="true" />O que o app entrega
              </CardTitle>
              <CardDescription>
                Consulta de linhas, paradas, mapa, ETA e colaboração comunitária sem bloquear o uso
                principal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-text-secondary">
              <p>
                O foco do produto continua sendo mobilidade universitária: descobrir rotas,
                acompanhar contexto operacional e aproveitar dados colaborativos sem transformar a
                experiência em espaço publicitário genérico.
              </p>
              <p>
                O projeto prioriza clareza operacional, acessibilidade e uma interface direta para
                uso rápido no campus e nos deslocamentos diários.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HandCoins size={18} aria-hidden="true" />
                Como o projeto se sustenta
              </CardTitle>
              <CardDescription>
                O projeto é sustentado por apoio comunitário voluntário e um único espaço reservado
                a parceiros.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-text-secondary">
              <div className="surface-card-sm bg-background px-3 py-3">
                <p className="font-semibold text-text-primary">Apoio pontual</p>
                <p className="mt-1">
                  Uma contribuição única, processada pelo Mercado Pago, para ajudar custos de
                  operação e manutenção.
                </p>
              </div>
              <div className="surface-card-sm bg-background px-3 py-3">
                <p className="font-semibold text-text-primary">Apoio mensal</p>
                <p className="mt-1">
                  Cobrança mensal automática processada pelo Mercado Pago, com cancelamento a
                  qualquer momento e sem desbloquear funcionalidades essenciais.
                </p>
              </div>
              <div className="surface-card-sm bg-background px-3 py-3">
                <p className="font-semibold text-text-primary">Parceiro institucional</p>
                <p className="mt-1">
                  Um espaço público rotulado como Parceiro, controlado pelo admin, sem scripts,
                  pixels, iframes ou rotação publicitária agressiva.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck size={18} aria-hidden="true" />
                Privacidade e limites do apoio financeiro
              </CardTitle>
              <CardDescription>
                Transparência explícita sobre o que o app faz e o que ele não faz nesta fase.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-text-secondary">
              <div className="surface-card-sm bg-background px-3 py-3">
                <p className="font-semibold text-text-primary">sem anúncios intrusivos</p>
                <p className="mt-1">
                  Não usamos takeover de tela, autoplay, intersticial nem formatos que atrapalhem a
                  consulta de transporte.
                </p>
              </div>
              <div className="surface-card-sm bg-background px-3 py-3">
                <p className="font-semibold text-text-primary">sem tracking de terceiros</p>
                <p className="mt-1">
                  O espaço de Parceiro não injeta SDK externo, script, pixel ou iframe. O app só
                  registra analytics internos mínimos no clique.
                </p>
              </div>
              <div className="surface-card-sm bg-background px-3 py-3">
                <p className="font-semibold text-text-primary">
                  Funcionalidades essenciais gratuitas
                </p>
                <p className="mt-1">
                  Mapa, ETA, linhas, paradas e GPS colaborativo continuam disponíveis sem depender
                  de apoio financeiro.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles size={18} aria-hidden="true" />
                Links relevantes
              </CardTitle>
              <CardDescription>
                Referências oficiais do projeto, contato e código-fonte público.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tenantConfig.publicRepositoryUrl ? (
                <AboutLink
                  href={tenantConfig.publicRepositoryUrl}
                  label="Repositório público"
                  description="Código do frontend, histórico e documentação pública do app."
                  onClick={() => handleExternalClick('Repositório público')}
                />
              ) : null}
              <AboutLink
                href="https://forms.gle/5e9MHq9pp1p8T5Px5"
                label="Contato e feedback"
                description="Canal para relato de problema, dúvida e retorno sobre o projeto."
                onClick={() => handleExternalClick('Contato e feedback')}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

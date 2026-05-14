import { ArrowUpRight, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';

export interface PartnerSpotlight {
  slug: string;
  nome: string;
  descricaoCurta: string;
  logoUrl: string | null;
  urlDestino: string;
  badgeSlug: string | null;
}

interface PartnerSpotlightCardProps {
  partner: PartnerSpotlight;
  onClick?: () => void;
}

export function PartnerSpotlightCard({ partner, onClick }: PartnerSpotlightCardProps) {
  return (
    <section data-slot="partner-spotlight" className="mb-3">
      <Card>
        <CardContent className="space-y-3 p-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="primary" size="xs">
              Parceiro
            </Badge>
            <span className="text-[11px] font-medium text-text-tertiary">Apoio institucional</span>
          </div>

          <a
            href={partner.urlDestino}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
            className="block rounded-lg border border-card-border bg-background px-3 py-3 transition-colors hover:bg-card-hover"
          >
            <div className="flex items-start gap-3">
              {partner.logoUrl ? (
                <img
                  src={partner.logoUrl}
                  alt={`Logo de ${partner.nome}`}
                  className="size-12 rounded-lg border border-card-border bg-card object-cover"
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-lg border border-card-border bg-card text-brand-primary">
                  <Building2 size={18} aria-hidden="true" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">{partner.nome}</p>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  {partner.descricaoCurta}
                </p>
              </div>

              <ArrowUpRight
                className="mt-0.5 size-4 shrink-0 text-text-tertiary"
                aria-hidden="true"
              />
            </div>
          </a>
        </CardContent>
      </Card>
    </section>
  );
}

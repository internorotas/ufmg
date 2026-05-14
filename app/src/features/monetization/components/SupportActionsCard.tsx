import { ArrowUpRight, HeartHandshake, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  createDonationCheckout,
  createSubscriptionCheckout,
} from '@/features/monetization/api/paymentsClient';
import type {
  UserMonetizationSummary,
  UserMonetizationTransaction,
} from '@/features/profile/api/profileClient';
import { useAnalytics } from '@/hooks/useAnalytics';

interface SupportActionsCardProps {
  monetization: UserMonetizationSummary;
}

interface SupportFeedbackState {
  type: 'error';
  message: string;
}

function formatCurrency(valueInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInCents / 100);
}

function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTransactionKind(kind: UserMonetizationTransaction['kind']): string {
  return kind === 'subscription' ? 'Assinatura Premium' : 'Doação via PIX';
}

function formatTransactionStatus(status: UserMonetizationTransaction['status']): string {
  switch (status) {
    case 'active':
      return 'ativa';
    case 'paid':
      return 'pago';
    case 'cancelled':
      return 'cancelado';
    case 'refunded':
      return 'reembolsado';
    case 'disputed':
      return 'contestada';
    case 'expired':
      return 'expirada';
    default:
      return 'pendente';
  }
}

function getStatusBadgeVariant(status: UserMonetizationTransaction['status']) {
  switch (status) {
    case 'active':
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'disputed':
    case 'cancelled':
    case 'expired':
    case 'refunded':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function SupportActionsCard({ monetization }: SupportActionsCardProps) {
  const { trackEvent } = useAnalytics();
  const [pendingAction, setPendingAction] = useState<'donation' | 'subscription' | null>(null);
  const [feedback, setFeedback] = useState<SupportFeedbackState | null>(null);

  const handleCheckout = async (kind: 'donation' | 'subscription') => {
    if (pendingAction) {
      return;
    }

    setPendingAction(kind);
    setFeedback(null);

    try {
      const checkout =
        kind === 'donation' ? await createDonationCheckout() : await createSubscriptionCheckout();

      trackEvent({
        category: 'engagement',
        action: kind === 'donation' ? 'start_pix_support' : 'start_premium_support',
        label: checkout.provider,
      });

      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao iniciar checkout hospedado.';
      setFeedback({ type: 'error', message });
      setPendingAction(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HeartHandshake size={18} aria-hidden="true" />
          Apoio ao projeto
        </CardTitle>
        <CardDescription>
          Checkout hospedado pela AbacatePay, com transparência sobre apoio pontual, Premium e
          histórico recente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={monetization.isPremium ? 'success' : 'neutral'}>
            {monetization.isPremium ? 'Premium ativo' : 'Premium opcional'}
          </Badge>
          <Badge variant={monetization.supporterBadgeUnlocked ? 'primary' : 'outline'}>
            {monetization.supporterBadgeUnlocked ? 'Apoiador' : 'Apoio comunitário'}
          </Badge>
        </div>

        {feedback ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-lg border border-warning-border bg-warning-bg px-3 py-2 text-sm text-warning-text"
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-card-border bg-background px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Última doação
            </p>
            <p className="mt-2 text-sm font-semibold text-text-primary">
              {formatDate(monetization.lastDonationAt)}
            </p>
          </div>

          <div className="rounded-lg border border-card-border bg-background px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Próximo pagamento
            </p>
            <p className="mt-2 text-sm font-semibold text-text-primary">
              {formatDate(monetization.nextPaymentAt)}
            </p>
          </div>

          <div className="rounded-lg border border-card-border bg-background px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Recorrência atual
            </p>
            <p className="mt-2 text-sm font-semibold text-text-primary">
              {monetization.activeSubscription
                ? `${formatCurrency(monetization.activeSubscription.amountCents)} por mês`
                : 'Sem assinatura ativa'}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-card-border bg-background px-3 py-3 text-sm text-text-secondary">
          <p className="font-medium text-text-primary">Sem paywall funcional no MVP</p>
          <p className="mt-1">
            Apoiar o projeto não desbloqueia funcionalidades core como mapa, ETA, linhas, paradas ou
            GPS colaborativo nesta fase.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            className="min-h-11"
            loading={pendingAction === 'donation'}
            onClick={() => void handleCheckout('donation')}
            leftIcon={<HeartHandshake size={16} aria-hidden="true" />}
          >
            Fazer doação via PIX
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            loading={pendingAction === 'subscription'}
            onClick={() => void handleCheckout('subscription')}
            leftIcon={<Sparkles size={16} aria-hidden="true" />}
          >
            Assinar Premium
          </Button>
        </div>

        <div className="space-y-3 rounded-lg border border-card-border bg-background px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-text-primary">Histórico recente</h3>
            <Link
              to="/sobre"
              className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
            >
              Ver transparência
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {monetization.recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {monetization.recentTransactions.map((transaction) => (
                <div
                  key={`${transaction.kind}-${transaction.createdAt}-${transaction.amountCents}`}
                  className="rounded-lg border border-card-border bg-card px-3 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {formatTransactionKind(transaction.kind)}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">
                        {formatTransactionStatus(transaction.status)} em{' '}
                        {formatDate(transaction.paidAt ?? transaction.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Badge
                        variant={transaction.kind === 'subscription' ? 'info' : 'primary'}
                        size="xs"
                      >
                        {transaction.kind === 'subscription' ? 'Premium' : 'PIX'}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(transaction.status)} size="xs">
                        {formatTransactionStatus(transaction.status)}
                      </Badge>
                      <span className="text-xs font-semibold text-text-primary">
                        {formatCurrency(transaction.amountCents)}
                      </span>
                      {transaction.receiptUrl ? (
                        <a
                          href={transaction.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-brand-primary hover:underline"
                        >
                          Recibo
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              Nenhuma transação recente ainda. Quando houver apoio via PIX ou Premium, ele aparece
              aqui de forma resumida.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

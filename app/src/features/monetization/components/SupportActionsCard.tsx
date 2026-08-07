import { ArrowUpRight, Check, HeartHandshake, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { FeedbackBanner } from '@/components/ui/FeedbackBanner';
import { Input } from '@/components/ui/Input';
import {
  cancelRecurringSupport,
  createRecurringSupportCheckout,
  createSupportCheckout,
  getSupportOverview,
  type PaymentsOverview,
  type SupportPaymentHistoryItem,
} from '@/features/monetization/api/paymentsClient';
import type {
  UserMonetizationSummary,
  UserMonetizationTransaction,
} from '@/features/profile/api/profileClient';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatDatePtBr } from '@/lib/formatters';

export interface SupportActionsCardProps {
  monetization: UserMonetizationSummary;
}

type SupportMode = 'point' | 'monthly';
type FeedbackState = { type: 'error' | 'success'; message: string };

const AMOUNT_PRESETS = [500, 1000, 2000, 5000] as const;

function formatCurrency(valueInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInCents / 100);
}

function formatStatus(status: SupportPaymentHistoryItem['status'] | 'active' | 'expired') {
  switch (status) {
    case 'paid':
      return 'confirmado';
    case 'active':
      return 'ativo';
    case 'cancelled':
      return 'cancelado';
    case 'refunded':
      return 'reembolsado';
    case 'disputed':
      return 'em contestação';
    case 'expired':
      return 'encerrado';
    default:
      return 'pendente';
  }
}

function statusVariant(status: SupportPaymentHistoryItem['status']) {
  switch (status) {
    case 'paid':
      return 'success' as const;
    case 'pending':
      return 'warning' as const;
    default:
      return 'neutral' as const;
  }
}

function fallbackSupportHistory(
  transactions: UserMonetizationTransaction[],
): SupportPaymentHistoryItem[] {
  return transactions.map((transaction, index) => ({
    id: index,
    kind: transaction.kind,
    status:
      transaction.status === 'active' || transaction.status === 'expired'
        ? 'pending'
        : transaction.status,
    valorCents: transaction.amountCents,
    receiptUrl: transaction.receiptUrl,
    paidAt: transaction.paidAt,
    cancelledAt: null,
    createdAt: transaction.createdAt,
    updatedAt: transaction.createdAt,
  }));
}

function getFeedbackError(error: unknown): FeedbackState {
  return {
    type: 'error',
    message:
      error instanceof Error ? error.message : 'Não foi possível iniciar o apoio. Tente novamente.',
  };
}

export function SupportActionsCard({ monetization }: SupportActionsCardProps) {
  const { trackEvent } = useAnalytics();
  const [mode, setMode] = useState<SupportMode>('point');
  const [amountCents, setAmountCents] = useState<number>(1000);
  const [customAmountCents, setCustomAmountCents] = useState<number | null>(null);
  const [usingCustomAmount, setUsingCustomAmount] = useState(false);
  const [billingEmail, setBillingEmail] = useState('');
  const [pendingAction, setPendingAction] = useState<'checkout' | 'cancel' | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [overview, setOverview] = useState<PaymentsOverview | null>(null);
  const idempotencyRef = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => {
    let active = true;
    void getSupportOverview()
      .then((data) => {
        if (active) setOverview(data);
      })
      .catch(() => {
        // O card continua útil com o resumo do perfil; o detalhe é atualizado
        // novamente após uma operação de apoio.
      });

    return () => {
      active = false;
    };
  }, []);

  const effectiveAmountCents = usingCustomAmount ? customAmountCents : amountCents;
  const customAmountInvalid = usingCustomAmount && customAmountCents === null;
  const history = overview?.supports ?? fallbackSupportHistory(monetization.recentTransactions);
  const recurringSupport = overview?.recurringSupport ?? null;
  const recurringIsActive = overview?.recurringSupportActive === true;

  const refreshOverview = async () => {
    try {
      setOverview(await getSupportOverview());
    } catch {
      setFeedback({
        type: 'error',
        message: 'O apoio foi processado, mas não foi possível atualizar o estado agora.',
      });
    }
  };

  const handleCheckout = async () => {
    if (pendingAction || effectiveAmountCents === null) {
      return;
    }

    if (mode === 'monthly' && !billingEmail.trim()) {
      setFeedback({ type: 'error', message: 'Informe um email de cobrança válido.' });
      return;
    }

    setPendingAction('checkout');
    setFeedback(null);

    try {
      const fingerprint = JSON.stringify({
        mode,
        amountCents: effectiveAmountCents,
        billingEmail: mode === 'monthly' ? billingEmail.trim().toLowerCase() : null,
      });
      if (idempotencyRef.current?.fingerprint !== fingerprint) {
        idempotencyRef.current = { fingerprint, key: crypto.randomUUID() };
      }
      const idempotencyKey = idempotencyRef.current.key;
      const checkout =
        mode === 'point'
          ? await createSupportCheckout(effectiveAmountCents, idempotencyKey)
          : await createRecurringSupportCheckout(
              effectiveAmountCents,
              billingEmail.trim(),
              idempotencyKey,
            );

      trackEvent({
        category: 'engagement',
        action: mode === 'point' ? 'start_support_point' : 'start_support_monthly',
        label: checkout.provider,
      });
      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      setFeedback(getFeedbackError(error));
      setPendingAction(null);
    }
  };

  const handleCancel = async () => {
    if (pendingAction) return;

    setPendingAction('cancel');
    setFeedback(null);
    try {
      await cancelRecurringSupport();
      setFeedback({ type: 'success', message: 'O apoio mensal foi cancelado.' });
      await refreshOverview();
    } catch (error) {
      setFeedback(getFeedbackError(error));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <HeartHandshake size={18} aria-hidden="true" />
              Apoie o Interno Rotas
            </CardTitle>
            <CardDescription>
              Seu apoio ajuda a manter o servidor, o domínio e o desenvolvimento do projeto. Escolha
              um valor e conclua pelo Mercado Pago.
            </CardDescription>
          </div>
          {monetization.supporterBadgeUnlocked ? (
            <Badge variant="primary" leftIcon={<Check size={12} aria-hidden="true" />}>
              Apoiador
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {feedback ? <FeedbackBanner message={feedback.message} type={feedback.type} /> : null}

        <p className="text-xs leading-5 text-text-secondary">
          Apoiar é opcional. Mapa, horários, previsões e GPS colaborativo continuam disponíveis para
          todos.
        </p>

        <div className="grid gap-2 sm:grid-cols-2" role="tablist" aria-label="Modalidade de apoio">
          {(
            [
              ['point', 'Apoiar uma vez', 'Uma contribuição única'],
              ['monthly', 'Apoiar todo mês', 'Cobrança automática todo mês'],
            ] as const
          ).map(([value, title, description]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => {
                setMode(value);
                setFeedback(null);
              }}
              className={`rounded-(--shape-sm) border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                mode === value
                  ? 'border-focus bg-brand-primary/10 text-text-primary'
                  : 'border-card-border bg-background text-text-secondary hover:bg-card-hover'
              }`}
            >
              <span className="block text-sm font-semibold">{title}</span>
              <span className="mt-1 block text-xs">{description}</span>
            </button>
          ))}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-text-primary">
            Quanto você quer apoiar?
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AMOUNT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={!usingCustomAmount && amountCents === preset}
                onClick={() => {
                  setAmountCents(preset);
                  setUsingCustomAmount(false);
                  setCustomAmountCents(null);
                }}
                className={`min-h-10 rounded-(--shape-sm) border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                  !usingCustomAmount && amountCents === preset
                    ? 'border-focus bg-brand-primary text-text-inverse'
                    : 'border-card-border bg-background text-text-primary hover:bg-card-hover'
                }`}
              >
                {formatCurrency(preset)}
              </button>
            ))}
          </div>
          <label
            className="block text-xs font-medium text-text-secondary"
            htmlFor="support-custom-amount"
          >
            Outro valor
          </label>
          <CurrencyInput
            id="support-custom-amount"
            valueCents={usingCustomAmount ? customAmountCents : null}
            onValueCentsChange={(cents) => {
              setUsingCustomAmount(true);
              setCustomAmountCents(cents);
            }}
            placeholder="Digite um valor"
            error={customAmountInvalid}
            aria-describedby={customAmountInvalid ? 'support-amount-error' : undefined}
          />
          {customAmountInvalid ? (
            <p id="support-amount-error" role="alert" className="text-xs text-danger-text">
              Informe um valor válido maior que zero.
            </p>
          ) : null}
        </fieldset>

        {mode === 'monthly' ? (
          <div className="space-y-3 rounded-(--shape-sm) border border-card-border bg-background px-4 py-4">
            <div>
              <label
                className="text-sm font-semibold text-text-primary"
                htmlFor="support-billing-email"
              >
                Email de cobrança
              </label>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                Usado somente para criar a cobrança mensal no Mercado Pago. Não altera sua conta no
                Interno Rotas.
              </p>
            </div>
            <Input
              id="support-billing-email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              value={billingEmail}
              onChange={(event) => setBillingEmail(event.target.value)}
              required
            />
            <p className="text-xs leading-5 text-text-tertiary">
              O valor será cobrado todo mês pelo Mercado Pago. Você pode cancelar quando quiser.
            </p>
          </div>
        ) : null}

        <div className="rounded-(--shape-sm) border border-card-border bg-background px-4 py-3 text-sm text-text-secondary">
          <p className="font-semibold text-text-primary">Reconhecimento simbólico</p>
          <p className="mt-1 leading-5">
            Um primeiro pagamento aprovado libera o emblema Apoiador. Apoiar não libera recursos
            essenciais: mapa, linhas, paradas, ETA e colaboração seguem disponíveis gratuitamente.
          </p>
        </div>

        <Button
          type="button"
          className="min-h-11 w-full"
          loading={pendingAction === 'checkout'}
          disabled={effectiveAmountCents === null || effectiveAmountCents <= 0}
          onClick={() => void handleCheckout()}
          leftIcon={
            mode === 'monthly' ? (
              <RefreshCw size={16} aria-hidden="true" />
            ) : (
              <HeartHandshake size={16} aria-hidden="true" />
            )
          }
        >
          {mode === 'monthly' ? 'Criar apoio mensal' : 'Apoiar uma vez'}
        </Button>

        <div className="rounded-(--shape-sm) border border-card-border bg-background px-4 py-3 text-xs leading-5 text-text-secondary">
          <p>Pagamentos processados pelo Mercado Pago.</p>
          <p>
            Projeto independente da UFMG. O apoio é voluntário e não altera seus dados de login.
          </p>
        </div>

        {overview ? (
          <section
            className="space-y-3 rounded-(--shape-sm) border border-card-border bg-background px-4 py-4"
            aria-labelledby="support-management-title"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id="support-management-title" className="text-sm font-semibold text-text-primary">
                Seu apoio mensal
              </h3>
              {recurringSupport ? (
                <Badge variant={recurringIsActive ? 'success' : 'neutral'}>
                  {formatStatus(recurringSupport.status)}
                </Badge>
              ) : null}
            </div>
            {recurringSupport ? (
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-text-tertiary">Valor mensal</p>
                  <p className="mt-1 font-semibold text-text-primary">
                    {formatCurrency(recurringSupport.amountCents)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Próxima cobrança</p>
                  <p className="mt-1 font-semibold text-text-primary">
                    {formatDatePtBr(recurringSupport.nextPaymentAt)}
                  </p>
                </div>
                <div className="flex items-end justify-start sm:justify-end">
                  {recurringIsActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={pendingAction === 'cancel'}
                      onClick={() => void handleCancel()}
                    >
                      Cancelar apoio mensal
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">
                Nenhum apoio mensal ativo. Você pode iniciar um a qualquer momento.
              </p>
            )}
          </section>
        ) : null}

        <section
          className="space-y-3 rounded-(--shape-sm) border border-card-border bg-background px-4 py-4"
          aria-labelledby="support-history-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="support-history-title" className="text-sm font-semibold text-text-primary">
              Histórico de apoios
            </h3>
            <Link
              to="/sobre"
              className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-brand-primary hover:underline dark:text-brand-accent"
            >
              Como o projeto usa os apoios
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={`${item.id}-${item.createdAt}`}
                  className="rounded-(--shape-sm) border border-card-border bg-card px-3 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {item.kind === 'monthly' ? 'Apoio mensal' : 'Apoio pontual'}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">
                        {formatStatus(item.status)} em{' '}
                        {formatDatePtBr(item.paidAt ?? item.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(item.status)} size="xs">
                        {formatStatus(item.status)}
                      </Badge>
                      <span className="text-xs font-semibold text-text-primary">
                        {formatCurrency(item.valorCents)}
                      </span>
                      {item.receiptUrl ? (
                        <a
                          href={item.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-brand-primary hover:underline dark:text-brand-accent"
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
              Nenhum apoio registrado ainda. Sua contribuição voluntária ajuda a manter o projeto.
            </p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

import { CheckCircle2, Clock3, HeartHandshake, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGpsSession } from '@/features/gps/context/GpsSessionContext';
import {
  getSupportOverview,
  type PaymentsOverview,
} from '@/features/monetization/api/paymentsClient';

export type ReturnState =
  | 'loading'
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'unconfirmed'
  | 'error';

export function resolveReturnState(overview: PaymentsOverview): ReturnState {
  const latestSupport = [...overview.supports].sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  )[0];

  if (latestSupport?.status === 'paid') return 'confirmed';
  if (latestSupport?.status === 'pending') return 'pending';
  if (latestSupport?.status === 'cancelled' || latestSupport?.status === 'refunded') {
    return 'cancelled';
  }
  if (overview.recurringSupport?.status === 'active') return 'confirmed';
  if (overview.recurringSupport?.status === 'pending') return 'pending';
  if (
    overview.recurringSupport?.status === 'cancelled' ||
    overview.recurringSupport?.status === 'expired'
  ) {
    return 'cancelled';
  }
  return 'unconfirmed';
}

export function SupportReturnPage() {
  const { isActive: gpsTrackingActive } = useGpsSession();
  const [state, setState] = useState<ReturnState>('loading');

  useEffect(() => {
    let active = true;
    void getSupportOverview()
      .then((overview) => {
        if (active) setState(resolveReturnState(overview));
      })
      .catch(() => {
        if (active) setState('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const content = {
    loading: {
      icon: <Clock3 size={24} aria-hidden="true" />,
      title: 'Conferindo seu apoio',
      message: 'Estamos consultando o estado confirmado pelo servidor.',
    },
    confirmed: {
      icon: <CheckCircle2 size={24} aria-hidden="true" />,
      title: 'Apoio confirmado',
      message: 'Obrigado por ajudar a manter o Interno Rotas disponível.',
    },
    pending: {
      icon: <Clock3 size={24} aria-hidden="true" />,
      title: 'Apoio aguardando confirmação',
      message: 'O pagamento ainda está sendo confirmado. Você pode voltar ao perfil depois.',
    },
    unconfirmed: {
      icon: <XCircle size={24} aria-hidden="true" />,
      title: 'Apoio não confirmado',
      message:
        'Não encontramos uma confirmação para esta tentativa. Nenhuma cobrança foi presumida.',
    },
    cancelled: {
      icon: <XCircle size={24} aria-hidden="true" />,
      title: 'Apoio cancelado',
      message: 'Esta tentativa foi cancelada ou reembolsada. Nenhuma cobrança ativa foi presumida.',
    },
    error: {
      icon: <XCircle size={24} aria-hidden="true" />,
      title: 'Não foi possível consultar agora',
      message: 'Volte ao perfil e tente consultar seus apoios novamente em instantes.',
    },
  }[state];

  return (
    <main className="flex min-h-full items-center justify-center bg-background px-4 py-10">
      <section
        aria-live="polite"
        className="w-full max-w-md rounded-2xl border border-card-border bg-card p-6 text-center shadow-lg"
      >
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary dark:text-brand-accent">
          {state === 'loading' ? <HeartHandshake size={24} aria-hidden="true" /> : content.icon}
        </div>
        <h1 className="text-lg font-bold text-text-primary">{content.title}</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{content.message}</p>
        {gpsTrackingActive ? (
          <p className="mt-4 rounded-lg border border-warning-border bg-warning-bg px-3 py-2 text-left text-xs leading-5 text-warning-text">
            O rastreio GPS continua ativo. Ao trocar de aplicativo, o navegador pode pausar as
            atualizações; ao voltar ao Interno Rotas, a sessão será retomada e o envio pendente será
            sincronizado.
          </p>
        ) : null}
        <Link
          to="/perfil"
          className="mt-6 inline-flex min-h-10 items-center justify-center rounded-(--shape-sm) bg-brand-primary px-4 text-sm font-semibold text-text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Voltar ao perfil
        </Link>
      </section>
    </main>
  );
}

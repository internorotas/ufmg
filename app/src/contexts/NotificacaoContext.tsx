/**
 * NotificacaoContext — estado global de alarmes de aproximação
 *
 * Centraliza o useNotificacao para que qualquer componente
 * (LinhaDetalhesModal, PopupCustomizado, etc.) compartilhe o mesmo
 * conjunto de alarmes e o fluxo de permissão seja executado uma única vez.
 */

import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { LgpdConsentDialog } from '@/components/auth/LgpdConsentDialog';
import { useConsentGate } from '@/features/auth/hooks/useConsentGate';
import { PointDeltaToast } from '@/features/gamification/components/PointDeltaToast';
import type { RecentPointEvent } from '@/features/profile/api/profileClient';
import { syncPushSubscription } from '@/services/push/pushSubscriptionService';
import { IosInstallModal } from '../components/IosInstallModal';
import { NotificacaoPermissionModal } from '../components/NotificacaoPermissionModal';
import { useAnalytics } from '../hooks/useAnalytics';
import { useNotificacao } from '../hooks/useNotificacao';
import type { Linha, Parada } from '../types/data.types';

type CollaborativeEvent = {
  type:
    | 'trip_auto_finished'
    | 'post_trip_feedback'
    | 'service_alert_approved'
    | 'streak_risk'
    | 'achievement_unlocked'
    | 'ranking_promoted';
  message: string;
  points?: number;
};

interface NotificacaoContextValue {
  /** Se a Web Notifications API é suportada neste browser */
  suportado: boolean;
  /** Verifica se há alarme ativo para o par linha+parada */
  isAlarmado: (linhaId: string, paradaId: string) => boolean;
  /**
   * Agenda ou cancela um alarme (comportamento de toggle).
   * Se não houver permissão, abre o modal amigável e guarda o alarme
   * pendente para ativá-lo automaticamente após a concessão.
   */
  toggleNotificacao: (
    linha: Linha,
    parada: Parada,
    minutosFaltantes: number,
    horarioChegada: string,
  ) => void;
  collaborativeFeedback: string | null;
  publishCollaborativeEvent: (event: CollaborativeEvent) => void;
  publishPointEvent: (event: RecentPointEvent | null) => void;
}

const NotificacaoContext = createContext<NotificacaoContextValue | null>(null);

const FALLBACK_NOTIFICACAO_CONTEXT: NotificacaoContextValue = {
  suportado: false,
  isAlarmado: () => false,
  toggleNotificacao: () => {},
  collaborativeFeedback: null,
  publishCollaborativeEvent: () => {},
  publishPointEvent: () => {},
};

export function NotificacaoProvider({ children }: { children: ReactNode }) {
  const { trackEvent } = useAnalytics();
  const {
    suportado,
    isIOS,
    isPwaInstalled,
    podeNotificar,
    mostrarModalPermissao,
    iniciarSolicitacaoPermissao,
    confirmarPermissao,
    fecharModalPermissao,
    agendarNotificacao,
    cancelarNotificacao,
    isAlarmado,
  } = useNotificacao();

  // Alarme que aguardou a concessão de permissão pelo usuário
  const pendingRef = useRef<{
    linha: Linha;
    parada: Parada;
    minutos: number;
    horarioChegada: string;
  } | null>(null);

  const [mostrarModalIos, setMostrarModalIos] = useState(false);
  const [collaborativeFeedback, setCollaborativeFeedback] = useState<string | null>(null);
  const [pointEvent, setPointEvent] = useState<RecentPointEvent | null>(null);
  const { dialogOpen, executeProtectedAction, acceptAndContinue, refuseConsent, closeDialog } =
    useConsentGate();

  const publishCollaborativeEvent = useCallback(
    (event: CollaborativeEvent) => {
      setCollaborativeFeedback(event.message);
      window.setTimeout(() => setCollaborativeFeedback(null), 4200);
      trackEvent({
        event: event.type,
        category: 'engagement',
        action: event.type,
        label: event.message,
      });
    },
    [trackEvent],
  );

  const publishPointEvent = useCallback((event: RecentPointEvent | null) => {
    setPointEvent(event);
    if (event) {
      window.setTimeout(() => setPointEvent(null), 4200);
    }
  }, []);

  const toggleNotificacao = useCallback(
    (linha: Linha, parada: Parada, minutosFaltantes: number, horarioChegada: string) => {
      // Interceptador Apple: iOS não-PWA não tem acesso à API Notification.
      // Mostramos o modal educativo em vez de tentar pedir permissão.
      if (isIOS && !isPwaInstalled) {
        setMostrarModalIos(true);
        return;
      }

      // Toggle off
      if (isAlarmado(linha.idRota, parada.idParada)) {
        cancelarNotificacao(linha.idRota, parada.idParada);
        trackEvent({
          event: 'alarm_cancelled',
          category: 'engagement',
          action: 'alarm_cancelled',
          label: `${linha.idRota}:${parada.idParada}`,
        });
        return;
      }
      void executeProtectedAction(async () => {
        // Sem permissão: guarda pendência e abre modal educativo
        if (!podeNotificar) {
          pendingRef.current = { linha, parada, minutos: minutosFaltantes, horarioChegada };
          iniciarSolicitacaoPermissao();
          return;
        }

        agendarNotificacao(linha, parada, minutosFaltantes, horarioChegada);
        void syncPushSubscription({
          linhaId: linha.idRota,
          paradaId: parada.idParada,
        });
        trackEvent({
          event: 'alarm_set',
          category: 'engagement',
          action: 'alarm_set',
          label: `${linha.idRota}:${parada.idParada}`,
          value: minutosFaltantes,
        });
      });
    },
    [
      agendarNotificacao,
      cancelarNotificacao,
      iniciarSolicitacaoPermissao,
      isAlarmado,
      isIOS,
      isPwaInstalled,
      podeNotificar,
      trackEvent,
      executeProtectedAction,
    ],
  );

  const handleConfirmar = useCallback(async () => {
    await confirmarPermissao();
    if (pendingRef.current && Notification.permission === 'granted') {
      const { linha, parada, minutos, horarioChegada } = pendingRef.current;
      pendingRef.current = null;
      agendarNotificacao(linha, parada, minutos, horarioChegada);
      void syncPushSubscription({
        linhaId: linha.idRota,
        paradaId: parada.idParada,
      });
      trackEvent({
        event: 'alarm_set',
        category: 'engagement',
        action: 'alarm_set',
        label: `${linha.idRota}:${parada.idParada}`,
        value: minutos,
      });
      trackEvent({
        event: 'notification_permission_granted',
        category: 'preferences',
        action: 'notification_permission_granted',
      });
    } else {
      pendingRef.current = null;
      if (Notification.permission === 'denied') {
        trackEvent({
          event: 'notification_permission_denied',
          category: 'preferences',
          action: 'notification_permission_denied',
        });
      }
    }
  }, [confirmarPermissao, agendarNotificacao, trackEvent]);

  const handleFechar = useCallback(() => {
    pendingRef.current = null;
    fecharModalPermissao();
  }, [fecharModalPermissao]);

  return (
    <NotificacaoContext.Provider
      value={{
        suportado,
        isAlarmado,
        toggleNotificacao,
        collaborativeFeedback,
        publishCollaborativeEvent,
        publishPointEvent,
      }}
    >
      {children}
      <NotificacaoPermissionModal
        isOpen={mostrarModalPermissao}
        onClose={handleFechar}
        onConfirmar={handleConfirmar}
      />
      <IosInstallModal isOpen={mostrarModalIos} onClose={() => setMostrarModalIos(false)} />
      <LgpdConsentDialog
        isOpen={dialogOpen}
        onClose={closeDialog}
        onAccept={acceptAndContinue}
        onRefuse={refuseConsent}
      />
      {collaborativeFeedback ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed right-4 bottom-24 z-[1500] max-w-80 rounded-lg border border-info-border bg-card px-3 py-2 text-xs text-text-primary shadow-lg"
        >
          {collaborativeFeedback}
        </div>
      ) : null}
      <PointDeltaToast event={pointEvent} />
    </NotificacaoContext.Provider>
  );
}

export function useNotificacaoContext(): NotificacaoContextValue {
  const ctx = useContext(NotificacaoContext);
  if (!ctx) {
    if (import.meta.env.DEV) {
      // biome-ignore lint/suspicious/noConsole: aviso útil para depuração local sem derrubar a árvore React durante HMR
      console.warn('useNotificacaoContext fora de <NotificacaoProvider>; usando fallback seguro.');
    }
    return FALLBACK_NOTIFICACAO_CONTEXT;
  }
  return ctx;
}

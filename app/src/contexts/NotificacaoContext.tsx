/**
 * NotificacaoContext — estado global de alarmes de aproximação
 *
 * Centraliza o useNotificacao para que qualquer componente
 * (LinhaDetalhesModal, PopupCustomizado, etc.) compartilhe o mesmo
 * conjunto de alarmes e o fluxo de permissão seja executado uma única vez.
 */

import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { IosInstallModal } from '../components/IosInstallModal';
import { NotificacaoPermissionModal } from '../components/NotificacaoPermissionModal';
import { useAnalytics } from '../hooks/useAnalytics';
import { useNotificacao } from '../hooks/useNotificacao';
import type { Linha, Parada } from '../types/data.types';

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
}

const NotificacaoContext = createContext<NotificacaoContextValue | null>(null);

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
      // Sem permissão: guarda pendência e abre modal educativo
      if (!podeNotificar) {
        pendingRef.current = { linha, parada, minutos: minutosFaltantes, horarioChegada };
        iniciarSolicitacaoPermissao();
        return;
      }
      agendarNotificacao(linha, parada, minutosFaltantes, horarioChegada);
      trackEvent({
        event: 'alarm_set',
        category: 'engagement',
        action: 'alarm_set',
        label: `${linha.idRota}:${parada.idParada}`,
        value: minutosFaltantes,
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
    ],
  );

  const handleConfirmar = useCallback(async () => {
    await confirmarPermissao();
    if (pendingRef.current && Notification.permission === 'granted') {
      const { linha, parada, minutos, horarioChegada } = pendingRef.current;
      pendingRef.current = null;
      agendarNotificacao(linha, parada, minutos, horarioChegada);
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
    <NotificacaoContext.Provider value={{ suportado, isAlarmado, toggleNotificacao }}>
      {children}
      <NotificacaoPermissionModal
        isOpen={mostrarModalPermissao}
        onClose={handleFechar}
        onConfirmar={handleConfirmar}
      />
      <IosInstallModal isOpen={mostrarModalIos} onClose={() => setMostrarModalIos(false)} />
    </NotificacaoContext.Provider>
  );
}

export function useNotificacaoContext(): NotificacaoContextValue {
  const ctx = useContext(NotificacaoContext);
  if (!ctx) {
    throw new Error('useNotificacaoContext deve ser usado dentro de <NotificacaoProvider>');
  }
  return ctx;
}

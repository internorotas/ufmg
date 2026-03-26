/**
 * NotificacaoContext — estado global de alarmes de aproximação
 *
 * Centraliza o useNotificacao para que qualquer componente
 * (LinhaDetalhesModal, PopupCustomizado, etc.) compartilhe o mesmo
 * conjunto de alarmes e o fluxo de permissão seja executado uma única vez.
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from 'react';
import { NotificacaoPermissionModal } from '../components/NotificacaoPermissionModal';
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
  toggleNotificacao: (linha: Linha, parada: Parada, minutosFaltantes: number) => void;
}

const NotificacaoContext = createContext<NotificacaoContextValue | null>(null);

export function NotificacaoProvider({ children }: { children: ReactNode }) {
  const {
    suportado,
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
  const pendingRef = useRef<{ linha: Linha; parada: Parada; minutos: number } | null>(null);

  const toggleNotificacao = useCallback(
    (linha: Linha, parada: Parada, minutosFaltantes: number) => {
      // Toggle off
      if (isAlarmado(linha.idRota, parada.idParada)) {
        cancelarNotificacao(linha.idRota, parada.idParada);
        return;
      }
      // Sem permissão: guarda pendência e abre modal educativo
      if (!podeNotificar) {
        pendingRef.current = { linha, parada, minutos: minutosFaltantes };
        iniciarSolicitacaoPermissao();
        return;
      }
      agendarNotificacao(linha, parada, minutosFaltantes);
    },
    [
      agendarNotificacao,
      cancelarNotificacao,
      iniciarSolicitacaoPermissao,
      isAlarmado,
      podeNotificar,
    ],
  );

  const handleConfirmar = useCallback(async () => {
    await confirmarPermissao();
    if (pendingRef.current && Notification.permission === 'granted') {
      const { linha, parada, minutos } = pendingRef.current;
      pendingRef.current = null;
      agendarNotificacao(linha, parada, minutos);
    } else {
      pendingRef.current = null;
    }
  }, [confirmarPermissao, agendarNotificacao]);

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

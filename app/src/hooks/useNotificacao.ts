/**
 * useNotificacao - Hook de gerenciamento de alarmes de aproximação
 *
 * Responsabilidades:
 * - Gerenciar o estado de permissão (granted/denied/default) da Notifications API
 * - Expor fluxo UX amigável: modal informativo → prompt nativo (nunca chama prompt direto)
 * - Agendar alarmes por par linha+parada, com timer inteligente (setInterval + visibilitychange)
 * - Disparar notificações via ServiceWorkerRegistration.showNotification (funciona em background)
 * - Limpar corretamente os timers ao cancelar alarme ou ao desmontar (evita memory leaks)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Linha, Parada } from '../types/data.types';

/** Limiar em minutos para disparar a notificação antes da chegada */
const LIMIAR_MINUTOS = 5;
/** Intervalo de polling para verificar o tempo restante */
const POLL_MS = 30_000;
/** Ícone usado na notificação (Android Chrome 192px, declarado no webmanifest) */
const ICON_URL = '/ufmg/android-chrome-192x192.png';
/**
 * Timeout para aguardar o Service Worker antes de cair no fallback.
 * Em dev o SW não é registrado, então navigator.serviceWorker.ready
 * nunca resolve — sem timeout o fallback new Notification() nunca seria alcançado.
 */
const SW_READY_TIMEOUT_MS = 2000;

/** Gera a chave única para o par linha+parada */
export function makeAlarmKey(linhaId: string, paradaId: string): string {
  return `${linhaId}:${paradaId}`;
}

async function dispararNotificacaoSistema(linhaNome: string, paradaNome: string): Promise<void> {
  const titulo = 'Ônibus chegando em breve!';
  const corpo = `A linha ${linhaNome} chega à parada ${paradaNome} em breve! (Margem de erro: ±5 min)`;
  const opcoes: NotificationOptions = {
    body: corpo,
    icon: ICON_URL,
    badge: ICON_URL,
    tag: `alarme-${linhaNome.replace(/\s+/g, '-')}-${paradaNome.replace(/\s+/g, '-')}`,
  };

  // Prefere ServiceWorkerRegistration.showNotification — funciona mesmo com o app em background
  if ('serviceWorker' in navigator) {
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('sw-timeout')), SW_READY_TIMEOUT_MS),
        ),
      ]);
      await reg.showNotification(titulo, opcoes);
      return;
    } catch {
      // SW não disponível ou demorou demais — cai no fallback abaixo
    }
  }

  // Fallback: new Notification() — pode não funcionar quando o app está em background no mobile
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(titulo, opcoes);
  }
}

interface AlarmEntry {
  linhaId: string;
  linhaNome: string;
  paradaId: string;
  paradaNome: string;
  /** Timestamp Unix (ms) em que a notificação deve ser disparada */
  targetTimestamp: number;
  intervalId: ReturnType<typeof setInterval> | null;
  fired: boolean;
}

export type PermissaoNotificacao = NotificationPermission;

export interface UseNotificacaoReturn {
  /** Estado atual de permissão da Notifications API */
  permissao: PermissaoNotificacao;
  /** Se a API de Notificações é suportada neste navegador */
  suportado: boolean;
  /** Shorthand: suportado && permissao === 'granted' */
  podeNotificar: boolean;
  /** Set com as chaves `${linhaId}:${paradaId}` de alarmes ativos */
  alarmes: Set<string>;
  /** Controla visibilidade do modal amigável de permissão */
  mostrarModalPermissao: boolean;
  /**
   * Ponto de entrada amigável: exibe o modal explicativo.
   * Se a permissão já é 'granted', apenas atualiza o estado local.
   * NUNCA chama o prompt nativo do navegador diretamente.
   */
  iniciarSolicitacaoPermissao: () => void;
  /** Chama Notification.requestPermission() — deve ser invocada pelo botão "Permitir" do modal */
  confirmarPermissao: () => Promise<void>;
  /** Fecha o modal sem solicitar permissão */
  fecharModalPermissao: () => void;
  /**
   * Agenda uma notificação para ser disparada quando o ônibus estiver a ~5 min.
   * Se já existir um alarme para o mesmo par, cancela (comportamento de toggle).
   */
  agendarNotificacao: (linha: Linha, parada: Parada, minutosFaltantes: number) => void;
  /** Cancela o alarme ativo para o par linha+parada e limpa o timer */
  cancelarNotificacao: (linhaId: string, paradaId: string) => void;
  /** Helper para checar se um alarme está ativo */
  isAlarmado: (linhaId: string, paradaId: string) => boolean;
}

export function useNotificacao(): UseNotificacaoReturn {
  const suportado = typeof window !== 'undefined' && 'Notification' in window;

  const [permissao, setPermissao] = useState<PermissaoNotificacao>(() =>
    suportado ? Notification.permission : 'denied',
  );
  const [alarmes, setAlarmes] = useState<Set<string>>(new Set());
  const [mostrarModalPermissao, setMostrarModalPermissao] = useState(false);

  const alarmesRef = useRef<Map<string, AlarmEntry>>(new Map());

  const podeNotificar = suportado && permissao === 'granted';

  const isAlarmado = useCallback(
    (linhaId: string, paradaId: string) => alarmes.has(makeAlarmKey(linhaId, paradaId)),
    [alarmes],
  );

  /** Remove a entrada do mapa e atualiza o Set de estado */
  const limparEntradaAlarme = useCallback((key: string, entry: AlarmEntry) => {
    if (entry.intervalId !== null) {
      clearInterval(entry.intervalId);
    }
    alarmesRef.current.delete(key);
    setAlarmes((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  /** Dispara a notificação e depois limpa a entrada */
  const dispararELimpar = useCallback(
    async (key: string, entry: AlarmEntry) => {
      entry.fired = true;
      limparEntradaAlarme(key, entry);
      await dispararNotificacaoSistema(entry.linhaNome, entry.paradaNome);
    },
    [limparEntradaAlarme],
  );

  const cancelarNotificacao = useCallback(
    (linhaId: string, paradaId: string) => {
      const key = makeAlarmKey(linhaId, paradaId);
      const entry = alarmesRef.current.get(key);
      if (entry) {
        limparEntradaAlarme(key, entry);
      }
    },
    [limparEntradaAlarme],
  );

  const agendarNotificacao = useCallback(
    (linha: Linha, parada: Parada, minutosFaltantes: number) => {
      const key = makeAlarmKey(linha.idRota, parada.idParada);

      // Comportamento de toggle: se já existe alarme, cancela
      if (alarmesRef.current.has(key)) {
        cancelarNotificacao(linha.idRota, parada.idParada);
        return;
      }

      const delayMs = Math.max(0, (minutosFaltantes - LIMIAR_MINUTOS) * 60_000);
      const targetTimestamp = Date.now() + delayMs;

      const entry: AlarmEntry = {
        linhaId: linha.idRota,
        linhaNome: linha.nome,
        paradaId: parada.idParada,
        paradaNome: parada.nome,
        targetTimestamp,
        intervalId: null,
        fired: false,
      };

      alarmesRef.current.set(key, entry);
      setAlarmes((prev) => new Set([...prev, key]));

      // Quando já está dentro do limiar: dispara a notificação imediatamente,
      // mas MANTÉM o alarme armado para dar feedback visual ao usuário.
      // O usuário pode clicar novamente para desativar manualmente.
      if (delayMs === 0) {
        void dispararNotificacaoSistema(entry.linhaNome, entry.paradaNome);
        return;
      }

      // Polling a cada 30s para verificar se o momento chegou
      const intervalId = setInterval(async () => {
        const current = alarmesRef.current.get(key);
        if (!current || current.fired) return;
        if (Date.now() >= current.targetTimestamp) {
          await dispararELimpar(key, current);
        }
      }, POLL_MS);

      entry.intervalId = intervalId;
    },
    [cancelarNotificacao, dispararELimpar],
  );

  /**
   * Verifica alarmes pendentes quando o app volta ao primeiro plano.
   * Garante que notificações sejam disparadas mesmo após o app ser minimizado,
   * pois browsers mobiles podem throttlear setInterval em background.
   */
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      for (const [key, entry] of alarmesRef.current) {
        if (!entry.fired && now >= entry.targetTimestamp) {
          await dispararELimpar(key, entry);
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [dispararELimpar]);

  // Limpa todos os intervalos ao desmontar o hook
  useEffect(() => {
    const ref = alarmesRef.current;
    return () => {
      for (const entry of ref.values()) {
        if (entry.intervalId !== null) clearInterval(entry.intervalId);
      }
      ref.clear();
    };
  }, []);

  const iniciarSolicitacaoPermissao = useCallback(() => {
    if (!suportado) return;
    if (Notification.permission === 'granted') {
      setPermissao('granted');
      return;
    }
    setMostrarModalPermissao(true);
  }, [suportado]);

  const confirmarPermissao = useCallback(async () => {
    if (!suportado) return;
    setMostrarModalPermissao(false);
    const result = await Notification.requestPermission();
    setPermissao(result);
  }, [suportado]);

  const fecharModalPermissao = useCallback(() => setMostrarModalPermissao(false), []);

  return {
    permissao,
    suportado,
    podeNotificar,
    alarmes,
    mostrarModalPermissao,
    iniciarSolicitacaoPermissao,
    confirmarPermissao,
    fecharModalPermissao,
    agendarNotificacao,
    cancelarNotificacao,
    isAlarmado,
  };
}

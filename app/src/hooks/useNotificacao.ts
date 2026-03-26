/**
 * useNotificacao - Hook de gerenciamento de alarmes de aproximação
 *
 * Estratégia de alertas múltiplos:
 *  1. ~5 min antes da chegada prevista  → "Prepare-se, o ônibus chegará em breve!"
 *  2. A cada 5 min subsequentes         → contagem regressiva (4 min, 3 min…)
 *  3. No momento da chegada (0 min)     → "O ônibus está chegando agora!"
 *
 * Compatibilidade:
 *  - Desktop Chrome/Edge/Firefox       → ServiceWorkerRegistration.showNotification
 *  - Desktop Safari / iOS PWA (≥16.4) → new Notification() como fallback
 *  - iOS < 16.4 / não-PWA             → Web Notifications não suportadas; `suportado = false`
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Linha, Parada } from '../types/data.types';

/** Intervalo de polling (ms) — verifica se algum alarme deve disparar */
const POLL_MS = 20_000;

/** Ícone da notificação (Android Chrome 192px, declarado no webmanifest) */
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

// ─── Helpers de notificação ───────────────────────────────────────────────────

type TipoAviso = 'aviso_5min' | 'contagem' | 'chegando';

interface OpcaoAviso {
  tipo: TipoAviso;
  linhaNome: string;
  paradaNome: string;
  /** Minutos restantes até a chegada (0 = está chegando agora) */
  minRestantes: number;
}

function buildNotificationPayload(opts: OpcaoAviso): {
  titulo: string;
  corpo: string;
  tag: string;
} {
  const base = `alarme-${opts.linhaNome.replace(/\s+/g, '-')}-${opts.paradaNome.replace(/\s+/g, '-')}`;

  if (opts.tipo === 'chegando') {
    return {
      titulo: '🚌 Ônibus chegando agora!',
      corpo: `A linha ${opts.linhaNome} está chegando à parada "${opts.paradaNome}" agora! (±5 min de margem)`,
      tag: `${base}-chegando`,
    };
  }

  if (opts.tipo === 'aviso_5min') {
    return {
      titulo: '⏰ Prepare-se! Ônibus em ~5 min',
      corpo: `A linha ${opts.linhaNome} chegará à parada "${opts.paradaNome}" em aproximadamente 5 minutos. (±5 min de margem)`,
      tag: `${base}-5min`,
    };
  }

  // contagem regressiva
  return {
    titulo: `🚌 Ônibus em ~${opts.minRestantes} min`,
    corpo: `Linha ${opts.linhaNome} → "${opts.paradaNome}" em ~${opts.minRestantes} minutos.`,
    tag: `${base}-${opts.minRestantes}min`,
  };
}

async function dispararNotificacaoSistema(opts: OpcaoAviso): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const { titulo, corpo, tag } = buildNotificationPayload(opts);

  const opcoes: NotificationOptions = {
    body: corpo,
    icon: ICON_URL,
    badge: ICON_URL,
    tag,
    // silent: false é o padrão, mas tornamos explícito para indicar intenção
    silent: false,
  };

  // Prefere ServiceWorkerRegistration.showNotification:
  //  - Funciona com o app em background (desktop + Android PWA)
  //  - Necessário no Android para vibrar e aparecer na shade
  if ('serviceWorker' in navigator) {
    try {
      const reg = await Promise.race<ServiceWorkerRegistration>([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('sw-timeout')), SW_READY_TIMEOUT_MS),
        ),
      ]);
      await reg.showNotification(titulo, opcoes);
      return;
    } catch {
      // SW não disponível ou timeout → cai no fallback
    }
  }

  // Fallback: new Notification()
  //  - Desktop Safari, iOS PWA (≥16.4 instalado), Firefox sem SW
  //  - Não funciona em background no mobile; no desktop funciona bem
  new Notification(titulo, opcoes);
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface AlarmEntry {
  linhaId: string;
  linhaNome: string;
  paradaId: string;
  paradaNome: string;
  /**
   * Timestamps Unix (ms) de cada alerta que ainda deve ser disparado.
   * Ordenados cronologicamente. Removidos à medida que são disparados.
   */
  pendingTimestamps: number[];
  intervalId: ReturnType<typeof setInterval> | null;
}

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type PermissaoNotificacao = NotificationPermission;

export interface UseNotificacaoReturn {
  permissao: PermissaoNotificacao;
  suportado: boolean;
  podeNotificar: boolean;
  alarmes: Set<string>;
  mostrarModalPermissao: boolean;
  iniciarSolicitacaoPermissao: () => void;
  confirmarPermissao: () => Promise<void>;
  fecharModalPermissao: () => void;
  agendarNotificacao: (linha: Linha, parada: Parada, minutosFaltantes: number) => void;
  cancelarNotificacao: (linhaId: string, paradaId: string) => void;
  isAlarmado: (linhaId: string, paradaId: string) => boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

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

  const limparEntradaAlarme = useCallback((key: string, entry: AlarmEntry) => {
    if (entry.intervalId !== null) clearInterval(entry.intervalId);
    alarmesRef.current.delete(key);
    setAlarmes((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const cancelarNotificacao = useCallback(
    (linhaId: string, paradaId: string) => {
      const key = makeAlarmKey(linhaId, paradaId);
      const entry = alarmesRef.current.get(key);
      if (entry) limparEntradaAlarme(key, entry);
    },
    [limparEntradaAlarme],
  );

  /**
   * Percorre os timestamps pendentes do alarme e dispara todos que já venceram.
   * Retorna true se ainda há timestamps futuros, false se o alarme deve ser encerrado.
   */
  const processarAlarme = useCallback(
    async (key: string, entry: AlarmEntry): Promise<boolean> => {
      const now = Date.now();
      const totalAlertas = entry.pendingTimestamps.length;

      // Filtra timestamps que já chegaram
      const vencidos = entry.pendingTimestamps.filter((ts) => now >= ts);
      entry.pendingTimestamps = entry.pendingTimestamps.filter((ts) => now < ts);

      for (const ts of vencidos) {
        // Descobre qual "slot" este timestamp representa pelo índice original
        const idxOriginal =
          totalAlertas - (entry.pendingTimestamps.length + vencidos.indexOf(ts) + 1);
        const totalSlots = totalAlertas;

        let tipo: TipoAviso;
        if (idxOriginal === totalSlots - 1) {
          // Último slot = chegada
          tipo = 'chegando';
        } else if (idxOriginal === 0) {
          // Primeiro slot = aviso de 5 min
          tipo = 'aviso_5min';
        } else {
          tipo = 'contagem';
        }

        // Minutos restantes aproximados no momento do disparo
        const proximoTs = entry.pendingTimestamps[0];
        const minRestantes = proximoTs ? Math.round((proximoTs - now) / 60_000) : 0;

        await dispararNotificacaoSistema({
          tipo,
          linhaNome: entry.linhaNome,
          paradaNome: entry.paradaNome,
          minRestantes,
        });
      }

      // Sem mais timestamps: encerra o alarme automaticamente
      if (entry.pendingTimestamps.length === 0) {
        limparEntradaAlarme(key, entry);
        return false;
      }
      return true;
    },
    [limparEntradaAlarme],
  );

  const agendarNotificacao = useCallback(
    (linha: Linha, parada: Parada, minutosFaltantes: number) => {
      const key = makeAlarmKey(linha.idRota, parada.idParada);

      // Toggle off — cancela se já existe
      if (alarmesRef.current.has(key)) {
        cancelarNotificacao(linha.idRota, parada.idParada);
        return;
      }

      const now = Date.now();

      /**
       * Monta a lista de timestamps de alerta:
       *  - A cada 5 min a partir de agora até a chegada (contagem regressiva)
       *  - O último timestamp é o da chegada (minutosFaltantes)
       *
       * Exemplo com minutosFaltantes = 22:
       *   now+17min (aviso_5min), now+22min (chegando)
       *
       * Exemplo com minutosFaltantes = 8:
       *   now+3min (aviso_5min), now+8min (chegando)
       *
       * Exemplo com minutosFaltantes ≤ 5:
       *   now+0ms (aviso_5min imediato), now+minutosFaltantes (chegando)
       */
      const chegadaTs = now + minutosFaltantes * 60_000;
      const timestamps: number[] = [];

      // Slots de 5 em 5 min a partir de agora, até antes da chegada
      let cursor = now;
      while (cursor + 5 * 60_000 < chegadaTs) {
        cursor += 5 * 60_000;
        timestamps.push(cursor);
      }

      // Sempre inclui o timestamp final de chegada
      timestamps.push(chegadaTs);

      const entry: AlarmEntry = {
        linhaId: linha.idRota,
        linhaNome: linha.nome,
        paradaId: parada.idParada,
        paradaNome: parada.nome,
        pendingTimestamps: timestamps,
        intervalId: null,
      };

      alarmesRef.current.set(key, entry);
      setAlarmes((prev) => new Set([...prev, key]));

      // Processa imediatamente (cobre o caso delayMs ≈ 0)
      void processarAlarme(key, entry).then((continua) => {
        if (!continua) return;
        // Inicia polling periódico
        const intervalId = setInterval(async () => {
          const current = alarmesRef.current.get(key);
          if (!current) return;
          await processarAlarme(key, current);
        }, POLL_MS);
        entry.intervalId = intervalId;
      });
    },
    [cancelarNotificacao, processarAlarme],
  );

  /**
   * Verifica alarmes atrasados quando o app volta ao primeiro plano.
   * Browsers mobile podem throttlear setInterval em background.
   */
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      for (const [key, entry] of alarmesRef.current) {
        await processarAlarme(key, entry);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [processarAlarme]);

  // Limpa todos os intervalos ao desmontar
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

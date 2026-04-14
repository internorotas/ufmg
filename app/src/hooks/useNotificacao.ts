/**
 * useNotificacao - Hook de gerenciamento de alarmes de aproximação
 *
 * Estratégia de alertas múltiplos:
 *  1. A cada 5 min antes da chegada prevista (contagem regressiva)
 *     ex: chegada em 22 min → alertas em t-20min, t-15min, t-10min, t-5min
 *  2. No momento da chegada (0 min) → "O ônibus está chegando agora!"
 *
 * Os timestamps são calculados a partir do horário exato de chegada na parada
 * (string "HH:MM" do motor de ETA), não a partir de minutosFaltantes — eliminando
 * o erro de arredondamento de até 59 segundos que causava notificações atrasadas.
 *
 * Compatibilidade:
 *  - Desktop Chrome/Edge/Firefox       → ServiceWorkerRegistration.showNotification
 *  - Desktop Safari / iOS PWA (≥16.4) → new Notification() como fallback
 *  - iOS < 16.4 / não-PWA             → Web Notifications não suportadas; `suportado = false`
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toSaoPauloDate } from '../lib/time';
import { converterHoraParaMinutos } from '../lib/utils';
import type { Linha, Parada } from '../types/data.types';

/** Intervalo de polling (ms) — verifica se algum alarme deve disparar */
const POLL_MS = 5_000;

/**
 * Ícone da notificação (Android Chrome 192px, declarado no webmanifest).
 * Usa BASE_URL para funcionar tanto em /ufmg/ (produção) quanto em / (dev).
 */
const ICON_URL = `${import.meta.env.BASE_URL}android-chrome-192x192.png`;

/**
 * Timeout para aguardar o Service Worker antes de cair no fallback.
 * Em dev o SW não é registrado, então navigator.serviceWorker.ready
 * nunca resolve — sem timeout o fallback new Notification() nunca seria alcançado.
 */
const SW_READY_TIMEOUT_MS = 2000;

/** Intervalo de alerta antes da chegada (ms) */
const ALERTA_INTERVALO_MS = 5 * 60_000;

/** Gera a chave única para o par linha+parada */
export function makeAlarmKey(linhaId: string, paradaId: string): string {
  return `${linhaId}:${paradaId}`;
}

// ─── Helpers de notificação ───────────────────────────────────────────────────

type TipoAviso = 'contagem' | 'chegando';

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
      corpo: `A ${opts.linhaNome} está chegando à parada "${opts.paradaNome}" agora! (±5 min de margem)`,
      tag: `${base}-chegando`,
    };
  }

  // contagem regressiva — minRestantes é o tempo real calculado no momento do disparo
  return {
    titulo: `🚌 Ônibus em ~${opts.minRestantes} min`,
    corpo: `A ${opts.linhaNome} chegará à parada "${opts.paradaNome}" em ~${opts.minRestantes} minutos.`,
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
  try {
    new Notification(titulo, opcoes); // eslint-disable-line no-new
  } catch {
    // Navegadores que não suportam new Notification() diretamente (ex: alguns iOS)
    if (import.meta.env.DEV) {
      console.warn('[useNotificacao] new Notification() falhou:', titulo);
    }
  }
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface AlarmEntry {
  linhaId: string;
  linhaNome: string;
  paradaId: string;
  paradaNome: string;
  /**
   * Timestamp Unix (ms) exato da chegada do ônibus na parada.
   * Calculado a partir do horarioChegada "HH:MM" — não de minutosFaltantes.
   */
  chegadaTs: number;
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
  /** Verdadeiro se o dispositivo é iPhone/iPad/iPod */
  isIOS: boolean;
  /** Verdadeiro se o PWA está instalado na Tela de Início */
  isPwaInstalled: boolean;
  podeNotificar: boolean;
  alarmes: Set<string>;
  mostrarModalPermissao: boolean;
  iniciarSolicitacaoPermissao: () => void;
  confirmarPermissao: () => Promise<void>;
  fecharModalPermissao: () => void;
  agendarNotificacao: (
    linha: Linha,
    parada: Parada,
    minutosFaltantes: number,
    horarioChegada: string,
  ) => void;
  cancelarNotificacao: (linhaId: string, paradaId: string) => void;
  isAlarmado: (linhaId: string, paradaId: string) => boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotificacao(): UseNotificacaoReturn {
  // useState initializers: executados apenas uma vez na montagem, não em cada render
  const [isIOS] = useState<boolean>(
    () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent),
  );
  const [isPwaInstalled] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true),
  );

  // Suportado se a API nativa existir (Android/Desktop/iOS-PWA)
  // OU se for iOS (mostramos o sino para exibir o modal educativo).
  const suportado = (typeof window !== 'undefined' && 'Notification' in window) || isIOS;

  const [permissao, setPermissao] = useState<PermissaoNotificacao>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  });
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

      // Filtra timestamps que já chegaram
      const vencidos = entry.pendingTimestamps.filter((ts) => now >= ts);
      entry.pendingTimestamps = entry.pendingTimestamps.filter((ts) => now < ts);

      for (const ts of vencidos) {
        // Determina o tipo baseado em se é o último timestamp (chegada)
        const isChegada = ts >= entry.chegadaTs - 1000; // margem de 1s para imprecisão do setInterval
        const tipo: TipoAviso = isChegada ? 'chegando' : 'contagem';

        // Minutos restantes reais no momento do disparo
        const minRestantes = isChegada
          ? 0
          : Math.max(1, Math.round((entry.chegadaTs - now) / 60_000));

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
    (linha: Linha, parada: Parada, minutosFaltantes: number, horarioChegada: string) => {
      const key = makeAlarmKey(linha.idRota, parada.idParada);

      // Toggle off — cancela se já existe
      if (alarmesRef.current.has(key)) {
        cancelarNotificacao(linha.idRota, parada.idParada);
        return;
      }

      const now = Date.now();

      /**
       * Calcula o timestamp exato de chegada a partir do horário "HH:MM".
       *
       * Usa toSaoPauloDate para obter o "início do dia" em São Paulo e depois
       * adiciona os minutos do horário de chegada — eliminando o erro de
       * arredondamento de até 59 segundos que ocorria ao usar:
       *   chegadaTs = now + minutosFaltantes * 60_000
       *
       * Tratamento de virada de meia-noite: se horarioChegada é muito menor que
       * o horário atual (ex: agora=23:55, chegada=00:10), assume dia seguinte.
       */
      const chegadaMinutos = converterHoraParaMinutos(horarioChegada);
      let chegadaTs: number;

      if (Number.isFinite(chegadaMinutos)) {
        const spNow = toSaoPauloDate(new Date(now));
        const inicioDiaMs = new Date(
          spNow.getFullYear(),
          spNow.getMonth(),
          spNow.getDate(),
          0,
          0,
          0,
          0,
        ).getTime();
        chegadaTs = inicioDiaMs + chegadaMinutos * 60_000;

        // Se chegada já passou (virada de meia-noite), avança um dia
        if (chegadaTs < now - 60_000) {
          chegadaTs += 24 * 60 * 60_000;
        }
      } else {
        // Fallback: usar minutosFaltantes quando horarioChegada é inválido
        chegadaTs = now + minutosFaltantes * 60_000;
      }

      /**
       * Gera timestamps de trás para frente a partir da chegada, de 5 em 5 min.
       * Exemplo com chegada em 22 min:
       *   chegadaTs-20min (contagem ~20min)
       *   chegadaTs-15min (contagem ~15min)
       *   chegadaTs-10min (contagem ~10min)
       *   chegadaTs-5min  (contagem ~5min)
       *   chegadaTs       (chegando)
       *
       * Apenas timestamps no futuro (> now) são incluídos.
       */
      const timestamps: number[] = [];

      // Slots de 5 em 5 min antes da chegada, do mais distante ao mais próximo
      let cursor = chegadaTs - ALERTA_INTERVALO_MS;
      while (cursor > now) {
        timestamps.unshift(cursor); // insere na frente para manter ordem crescente
        cursor -= ALERTA_INTERVALO_MS;
      }

      // Sempre inclui o timestamp final de chegada
      timestamps.push(chegadaTs);

      const entry: AlarmEntry = {
        linhaId: linha.idRota,
        linhaNome: linha.nome,
        paradaId: parada.idParada,
        paradaNome: parada.nome,
        chegadaTs,
        pendingTimestamps: timestamps,
        intervalId: null,
      };

      alarmesRef.current.set(key, entry);
      setAlarmes((prev) => new Set([...prev, key]));

      // Processa imediatamente (cobre o caso delayMs ≈ 0)
      void processarAlarme(key, entry)
        .then((continua) => {
          if (!continua) return;
          // Inicia polling periódico
          const intervalId = setInterval(() => {
            const current = alarmesRef.current.get(key);
            if (!current) return;
            void processarAlarme(key, current).catch((err) => {
              if (import.meta.env.DEV) {
                console.warn('[useNotificacao] erro em processarAlarme:', err);
              }
            });
          }, POLL_MS);
          entry.intervalId = intervalId;
        })
        .catch((err) => {
          if (import.meta.env.DEV) {
            console.warn('[useNotificacao] erro ao agendar notificação:', err);
          }
        });
    },
    [cancelarNotificacao, processarAlarme],
  );

  /**
   * Verifica alarmes atrasados quando o app volta ao primeiro plano.
   * Browsers mobile podem throttlear setInterval em background.
   */
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      for (const [key, entry] of alarmesRef.current) {
        void processarAlarme(key, entry).catch((err) => {
          if (import.meta.env.DEV) {
            console.warn('[useNotificacao] erro em visibilitychange processarAlarme:', err);
          }
        });
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
    if (!suportado || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      setPermissao('granted');
      return;
    }
    setMostrarModalPermissao(true);
  }, [suportado]);

  const confirmarPermissao = useCallback(async () => {
    if (!suportado || !('Notification' in window)) return;
    setMostrarModalPermissao(false);
    const result = await Notification.requestPermission();
    setPermissao(result);
  }, [suportado]);

  const fecharModalPermissao = useCallback(() => setMostrarModalPermissao(false), []);

  return {
    permissao,
    suportado,
    isIOS,
    isPwaInstalled,
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

/**
 * Stories: UI Feedback Components
 *
 * Covers: Skeleton, FeedbackBanner, EmptyState, Switch, SwitchRow, ToggleRow, Tooltip, InfoRow
 */

import type { Story } from '@ladle/react';
import React, { useState } from 'react';
import {
  EmptyState,
  ErrorEmptyState,
  LinesEmptyState,
  MapEmptyState,
  NotFoundEmptyState,
  SearchEmptyState,
} from '../components/ui/EmptyState';
import { FeedbackBanner } from '../components/ui/FeedbackBanner';
import { InfoRow } from '../components/ui/InfoRow';
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonLineCard,
  SkeletonLineList,
  SkeletonMap,
  SkeletonSidebar,
  SkeletonText,
} from '../components/ui/Skeleton';
import { Switch } from '../components/ui/Switch';
import { SwitchRow } from '../components/ui/SwitchRow';
import { ToggleRow } from '../components/ui/ToggleRow';
import { Tooltip } from '../components/ui/Tooltip';

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────

export const SkeletonDefault: Story = () => (
  <div className="p-6 space-y-4 max-w-sm">
    <Skeleton width={200} height={20} />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-8 w-3/4" />
  </div>
);

export const SkeletonVariantDefault: Story = () => (
  <div className="p-6 space-y-3 max-w-xs">
    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">variant: default</p>
    <Skeleton variant="default" height={20} width={240} />
  </div>
);

export const SkeletonVariantDarker: Story = () => (
  <div className="p-6 space-y-3 max-w-xs">
    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">variant: darker</p>
    <Skeleton variant="darker" height={20} width={240} />
  </div>
);

export const SkeletonVariantLighter: Story = () => (
  <div className="p-6 space-y-3 max-w-xs">
    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">variant: lighter</p>
    <Skeleton variant="lighter" height={20} width={240} />
  </div>
);

export const SkeletonAllVariants: Story = () => (
  <div className="p-6 space-y-3 max-w-xs">
    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-4">
      Todas as variantes
    </p>
    {(['default', 'darker', 'lighter'] as const).map((v) => (
      <div key={v} className="space-y-1">
        <p className="text-xs text-gray-400">{v}</p>
        <Skeleton variant={v} height={20} width="100%" />
      </div>
    ))}
  </div>
);

export const SkeletonRoundedNone: Story = () => (
  <div className="p-6 space-y-2 max-w-xs">
    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">rounded: none</p>
    <Skeleton rounded="none" height={32} width="100%" />
  </div>
);

export const SkeletonRoundedSm: Story = () => (
  <div className="p-6 space-y-2 max-w-xs">
    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">rounded: sm</p>
    <Skeleton rounded="sm" height={32} width="100%" />
  </div>
);

export const SkeletonRoundedMd: Story = () => (
  <div className="p-6 space-y-2 max-w-xs">
    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">rounded: md</p>
    <Skeleton rounded="md" height={32} width="100%" />
  </div>
);

export const SkeletonRoundedLg: Story = () => (
  <div className="p-6 space-y-2 max-w-xs">
    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">rounded: lg</p>
    <Skeleton rounded="lg" height={32} width="100%" />
  </div>
);

export const SkeletonRoundedXl: Story = () => (
  <div className="p-6 space-y-2 max-w-xs">
    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">rounded: xl</p>
    <Skeleton rounded="xl" height={32} width="100%" />
  </div>
);

export const SkeletonRoundedFull: Story = () => (
  <div className="p-6 space-y-2 max-w-xs">
    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
      rounded: full (pill)
    </p>
    <Skeleton rounded="full" height={32} width="100%" />
  </div>
);

export const SkeletonAllRounded: Story = () => (
  <div className="p-6 space-y-3 max-w-xs">
    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-4">
      Todos os arredondamentos
    </p>
    {(['none', 'sm', 'md', 'lg', 'xl', 'full'] as const).map((r) => (
      <div key={r} className="space-y-1">
        <p className="text-xs text-gray-400">{r}</p>
        <Skeleton rounded={r} height={28} width="100%" />
      </div>
    ))}
  </div>
);

export const SkeletonWithWidthHeight: Story = () => (
  <div className="p-6 space-y-4">
    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
      Largura e altura numéricas
    </p>
    <Skeleton width={120} height={120} rounded="lg" />
    <Skeleton width={300} height={16} />
    <Skeleton width="50%" height={40} rounded="full" />
  </div>
);

// ─── SkeletonText ───

export const SkeletonTextDefault: Story = () => (
  <div className="p-6 max-w-sm">
    <SkeletonText />
  </div>
);

export const SkeletonTextOneLine: Story = () => (
  <div className="p-6 max-w-sm">
    <p className="text-xs text-gray-500 mb-2">1 linha</p>
    <SkeletonText lines={1} />
  </div>
);

export const SkeletonTextTwoLines: Story = () => (
  <div className="p-6 max-w-sm">
    <p className="text-xs text-gray-500 mb-2">2 linhas</p>
    <SkeletonText lines={2} />
  </div>
);

export const SkeletonTextFiveLines: Story = () => (
  <div className="p-6 max-w-sm">
    <p className="text-xs text-gray-500 mb-2">5 linhas</p>
    <SkeletonText lines={5} />
  </div>
);

export const SkeletonTextLastLineWidth: Story = () => (
  <div className="p-6 max-w-sm">
    <p className="text-xs text-gray-500 mb-2">Última linha: 40%</p>
    <SkeletonText lines={4} lastLineWidth="40%" />
  </div>
);

export const SkeletonTextDarker: Story = () => (
  <div className="p-6 max-w-sm">
    <p className="text-xs text-gray-500 mb-2">Variant: darker</p>
    <SkeletonText lines={3} variant="darker" />
  </div>
);

// ─── SkeletonAvatar ───

export const SkeletonAvatarSm: Story = () => (
  <div className="p-6 flex items-center gap-4">
    <div className="text-center space-y-1">
      <SkeletonAvatar size="sm" />
      <p className="text-xs text-gray-400">sm</p>
    </div>
  </div>
);

export const SkeletonAvatarMd: Story = () => (
  <div className="p-6 flex items-center gap-4">
    <div className="text-center space-y-1">
      <SkeletonAvatar size="md" />
      <p className="text-xs text-gray-400">md</p>
    </div>
  </div>
);

export const SkeletonAvatarLg: Story = () => (
  <div className="p-6 flex items-center gap-4">
    <div className="text-center space-y-1">
      <SkeletonAvatar size="lg" />
      <p className="text-xs text-gray-400">lg</p>
    </div>
  </div>
);

export const SkeletonAvatarXl: Story = () => (
  <div className="p-6 flex items-center gap-4">
    <div className="text-center space-y-1">
      <SkeletonAvatar size="xl" />
      <p className="text-xs text-gray-400">xl</p>
    </div>
  </div>
);

export const SkeletonAvatarAllSizes: Story = () => (
  <div className="p-6 flex items-end gap-4">
    {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
      <div key={s} className="text-center space-y-2">
        <SkeletonAvatar size={s} />
        <p className="text-xs text-gray-400">{s}</p>
      </div>
    ))}
  </div>
);

// ─── SkeletonLineCard ───

export const SkeletonLineCardSingle: Story = () => (
  <div className="p-6 max-w-sm">
    <SkeletonLineCard />
  </div>
);

// ─── SkeletonLineList ───

export const SkeletonLineListDefault: Story = () => (
  <div className="p-6 max-w-sm">
    <SkeletonLineList />
  </div>
);

export const SkeletonLineListThreeCards: Story = () => (
  <div className="p-6 max-w-sm">
    <SkeletonLineList count={3} />
  </div>
);

export const SkeletonLineListOneCard: Story = () => (
  <div className="p-6 max-w-sm">
    <SkeletonLineList count={1} />
  </div>
);

// ─── SkeletonMap ───

export const SkeletonMapDefault: Story = () => (
  <div className="p-6" style={{ height: 400 }}>
    <SkeletonMap className="rounded-xl" />
  </div>
);

// ─── SkeletonSidebar ───

export const SkeletonSidebarDefault: Story = () => (
  <div style={{ height: 600, width: 320 }} className="border rounded-xl overflow-hidden">
    <SkeletonSidebar />
  </div>
);

// ─────────────────────────────────────────────
// FEEDBACK BANNER
// ─────────────────────────────────────────────

export const FeedbackBannerError: Story = () => (
  <div className="p-6 max-w-md space-y-4">
    <FeedbackBanner
      message="Ocorreu um erro ao processar sua solicitação. Tente novamente."
      type="error"
    />
  </div>
);

export const FeedbackBannerSuccess: Story = () => (
  <div className="p-6 max-w-md space-y-4">
    <FeedbackBanner message="Preferências salvas com sucesso!" type="success" />
  </div>
);

export const FeedbackBannerDefaultType: Story = () => (
  <div className="p-6 max-w-md">
    <p className="text-xs text-gray-500 mb-2">Sem type (padrão: error)</p>
    <FeedbackBanner message="Algo deu errado. Tente novamente mais tarde." />
  </div>
);

export const FeedbackBannerLivePolite: Story = () => (
  <div className="p-6 max-w-md">
    <p className="text-xs text-gray-500 mb-2">live: polite (padrão)</p>
    <FeedbackBanner message="Linha 5002 adicionada aos favoritos." type="success" live="polite" />
  </div>
);

export const FeedbackBannerLiveAssertive: Story = () => (
  <div className="p-6 max-w-md">
    <p className="text-xs text-gray-500 mb-2">live: assertive</p>
    <FeedbackBanner
      message="Sessão expirada. Faça login novamente."
      type="error"
      live="assertive"
    />
  </div>
);

export const FeedbackBannerAllStates: Story = () => (
  <div className="p-6 max-w-md space-y-3">
    <FeedbackBanner message="Erro: não foi possível conectar ao servidor." type="error" />
    <FeedbackBanner message="Linha 3401 - Pampulha salva nos favoritos." type="success" />
  </div>
);

export const FeedbackBannerLongMessage: Story = () => (
  <div className="p-6 max-w-md">
    <FeedbackBanner
      message="Não foi possível carregar as informações da linha no momento. Verifique sua conexão com a internet e tente novamente. Caso o problema persista, entre em contato com o suporte."
      type="error"
    />
  </div>
);

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────

import { AlertCircle, Bus, FileQuestion, MapPin, Search, Star } from 'lucide-react';

export const EmptyStateGenericSm: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <EmptyState
      size="sm"
      icon={<Search size={24} />}
      title="Nenhum resultado"
      description="Ajuste os filtros para ver mais opções."
    />
  </div>
);

export const EmptyStateGenericMd: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <EmptyState
      size="md"
      icon={<Bus size={32} />}
      title="Nenhuma linha disponível"
      description="Não há linhas cadastradas para esta categoria."
    />
  </div>
);

export const EmptyStateGenericLg: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <EmptyState
      size="lg"
      icon={<MapPin size={40} />}
      title="Selecione uma linha"
      description="Clique em uma linha no menu para ver seu trajeto no mapa."
    />
  </div>
);

export const EmptyStateWithAction: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <EmptyState
      size="md"
      icon={<Search size={32} />}
      title="Nenhum resultado encontrado"
      description='Não encontramos linhas para "Barreiro"'
      action={{ label: 'Limpar busca', onClick: () => alert('Busca limpa') }}
    />
  </div>
);

export const EmptyStateWithSecondaryAction: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <EmptyState
      size="md"
      icon={<AlertCircle size={32} />}
      title="Algo deu errado"
      description="Não foi possível carregar os dados da linha."
      action={{ label: 'Tentar novamente', onClick: () => alert('Retry') }}
      secondaryAction={{ label: 'Cancelar', onClick: () => alert('Cancelado') }}
    />
  </div>
);

export const EmptyStateWithBothActions: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <EmptyState
      size="md"
      icon={<Star size={32} />}
      title="Sem favoritos"
      description="Você ainda não favoritou nenhuma linha de ônibus."
      action={{ label: 'Explorar linhas', onClick: () => alert('Explorar') }}
      secondaryAction={{ label: 'Saiba mais', onClick: () => alert('Mais info') }}
    />
  </div>
);

export const EmptyStateNoIcon: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <EmptyState size="md" title="Lista vazia" description="Adicione itens para vê-los aqui." />
  </div>
);

export const EmptyStateNoDescription: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <EmptyState size="md" icon={<FileQuestion size={32} />} title="Conteúdo não encontrado" />
  </div>
);

export const EmptyStateAllSizes: Story = () => (
  <div className="p-6 space-y-4">
    {(['sm', 'md', 'lg'] as const).map((s) => (
      <div key={s} className="border rounded-xl">
        <p className="text-xs text-gray-500 px-4 pt-2 font-semibold uppercase tracking-wide">
          size: {s}
        </p>
        <EmptyState
          size={s}
          icon={<Bus size={s === 'sm' ? 24 : s === 'md' ? 32 : 40} />}
          title="Nenhuma linha disponível"
          description="Selecione outra categoria."
        />
      </div>
    ))}
  </div>
);

// ─── Preset Empty States ───

export const EmptyStateSearchNoTerm: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <SearchEmptyState />
  </div>
);

export const EmptyStateSearchWithTerm: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <SearchEmptyState searchTerm="Contagem Centro" onClear={() => alert('Limpar')} />
  </div>
);

export const EmptyStateSearchWithClear: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <SearchEmptyState searchTerm="5720B" onClear={() => alert('Busca limpa')} size="lg" />
  </div>
);

export const EmptyStateSearchSm: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <SearchEmptyState size="sm" searchTerm="Venda Nova" onClear={() => alert('Limpar')} />
  </div>
);

export const EmptyStateLinesDefault: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <LinesEmptyState />
  </div>
);

export const EmptyStateLinesWithCategory: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <LinesEmptyState category="Linhas Noturnas" />
  </div>
);

export const EmptyStateLinesLg: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <LinesEmptyState size="lg" category="Linhas Universitárias" />
  </div>
);

export const EmptyStateMapDefault: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <MapEmptyState />
  </div>
);

export const EmptyStateMapSm: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <MapEmptyState size="sm" />
  </div>
);

export const EmptyStateErrorDefault: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <ErrorEmptyState />
  </div>
);

export const EmptyStateErrorWithMessage: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <ErrorEmptyState
      message="Servidor indisponível. Tente mais tarde."
      onRetry={() => alert('Retry')}
    />
  </div>
);

export const EmptyStateErrorWithRetry: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <ErrorEmptyState onRetry={() => alert('Tentando novamente...')} size="lg" />
  </div>
);

export const EmptyStateNotFoundDefault: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <NotFoundEmptyState />
  </div>
);

export const EmptyStateNotFoundCustom: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <NotFoundEmptyState
      title="Linha não encontrada"
      description="A linha 9901 não existe ou foi desativada."
    />
  </div>
);

export const EmptyStateNotFoundSm: Story = () => (
  <div className="p-6 border rounded-xl max-w-sm">
    <NotFoundEmptyState size="sm" title="Rota inexistente" />
  </div>
);

// ─────────────────────────────────────────────
// SWITCH
// ─────────────────────────────────────────────

export const SwitchChecked: Story = () => (
  <div className="p-6 flex items-center gap-6">
    <div className="text-center space-y-2">
      <Switch checked={true} />
      <p className="text-xs text-gray-500">checked</p>
    </div>
  </div>
);

export const SwitchUnchecked: Story = () => (
  <div className="p-6 flex items-center gap-6">
    <div className="text-center space-y-2">
      <Switch checked={false} />
      <p className="text-xs text-gray-500">unchecked</p>
    </div>
  </div>
);

export const SwitchDisabledChecked: Story = () => (
  <div className="p-6 flex items-center gap-6">
    <div className="text-center space-y-2">
      <Switch checked={true} disabled />
      <p className="text-xs text-gray-500">disabled + checked</p>
    </div>
  </div>
);

export const SwitchDisabledUnchecked: Story = () => (
  <div className="p-6 flex items-center gap-6">
    <div className="text-center space-y-2">
      <Switch checked={false} disabled />
      <p className="text-xs text-gray-500">disabled + unchecked</p>
    </div>
  </div>
);

export const SwitchAllStates: Story = () => (
  <div className="p-6 flex items-end gap-8">
    {[
      { checked: false, disabled: false, label: 'unchecked' },
      { checked: true, disabled: false, label: 'checked' },
      { checked: false, disabled: true, label: 'disabled off' },
      { checked: true, disabled: true, label: 'disabled on' },
    ].map(({ checked, disabled, label }) => (
      <div key={label} className="text-center space-y-2">
        <Switch checked={checked} disabled={disabled} />
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    ))}
  </div>
);

export const SwitchInteractive: Story = () => {
  const [checked, setChecked] = useState(false);
  return (
    <div className="p-6 flex items-center gap-4">
      <button
        type="button"
        onClick={() => setChecked((v) => !v)}
        className="text-sm underline text-blue-600"
      >
        Toggle
      </button>
      <Switch checked={checked} />
      <p className="text-sm text-gray-600">{checked ? 'Ativo' : 'Inativo'}</p>
    </div>
  );
};

// ─────────────────────────────────────────────
// SWITCH ROW
// ─────────────────────────────────────────────

export const SwitchRowChecked: Story = () => {
  const [checked, setChecked] = useState(true);
  return (
    <div className="p-6 max-w-sm">
      <SwitchRow
        label="Notificações de chegada"
        checked={checked}
        onClick={() => setChecked((v) => !v)}
      />
    </div>
  );
};

export const SwitchRowUnchecked: Story = () => {
  const [checked, setChecked] = useState(false);
  return (
    <div className="p-6 max-w-sm">
      <SwitchRow label="Modo escuro" checked={checked} onClick={() => setChecked((v) => !v)} />
    </div>
  );
};

export const SwitchRowDisabledOn: Story = () => (
  <div className="p-6 max-w-sm">
    <SwitchRow label="GPS sempre ativo (desabilitado)" checked={true} onClick={() => {}} disabled />
  </div>
);

export const SwitchRowDisabledOff: Story = () => (
  <div className="p-6 max-w-sm">
    <SwitchRow
      label="Sincronização automática (desabilitado)"
      checked={false}
      onClick={() => {}}
      disabled
    />
  </div>
);

export const SwitchRowWithReactNodeLabel: Story = () => {
  const [checked, setChecked] = useState(false);
  return (
    <div className="p-6 max-w-sm">
      <SwitchRow
        label={
          <span>
            Mostrar linhas noturnas{' '}
            <span className="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
              Beta
            </span>
          </span>
        }
        checked={checked}
        onClick={() => setChecked((v) => !v)}
      />
    </div>
  );
};

export const SwitchRowGroup: Story = () => {
  const [states, setStates] = useState({
    notif: true,
    escuro: false,
    gps: true,
    sincronizar: false,
  });
  const toggle = (key: keyof typeof states) => setStates((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="p-6 max-w-sm border rounded-xl divide-y">
      <SwitchRow
        label="Notificações de chegada"
        checked={states.notif}
        onClick={() => toggle('notif')}
      />
      <SwitchRow label="Modo escuro" checked={states.escuro} onClick={() => toggle('escuro')} />
      <SwitchRow
        label="Localização em segundo plano"
        checked={states.gps}
        onClick={() => toggle('gps')}
      />
      <SwitchRow
        label="Sincronização automática"
        checked={states.sincronizar}
        onClick={() => toggle('sincronizar')}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// TOGGLE ROW
// ─────────────────────────────────────────────

export const ToggleRowBasic: Story = () => {
  const [mode, setMode] = useState<'Ida' | 'Volta'>('Ida');
  return (
    <div className="p-6 max-w-sm">
      <ToggleRow
        label="Direção"
        trailing={
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
            {mode}
          </span>
        }
        onClick={() => setMode((m) => (m === 'Ida' ? 'Volta' : 'Ida'))}
      />
    </div>
  );
};

export const ToggleRowWithIcon: Story = () => {
  const speeds = ['Lento', 'Normal', 'Rápido'] as const;
  const [idx, setIdx] = useState(1);
  return (
    <div className="p-6 max-w-sm">
      <ToggleRow
        label="Velocidade de atualização"
        trailing={<span className="text-sm text-gray-700 font-medium">{speeds[idx]}</span>}
        onClick={() => setIdx((i) => (i + 1) % speeds.length)}
      />
    </div>
  );
};

export const ToggleRowDisabled: Story = () => (
  <div className="p-6 max-w-sm">
    <ToggleRow
      label="Modo de exibição (desabilitado)"
      trailing={<span className="text-sm text-gray-400">Mapa</span>}
      onClick={() => {}}
      disabled
    />
  </div>
);

export const ToggleRowWithReactNodeTrailing: Story = () => {
  const [active, setActive] = useState(false);
  return (
    <div className="p-6 max-w-sm">
      <ToggleRow
        label="Acessibilidade"
        trailing={
          <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300'}`} />
        }
        onClick={() => setActive((v) => !v)}
      />
    </div>
  );
};

export const ToggleRowGroup: Story = () => {
  const [tema, setTema] = useState<'Claro' | 'Escuro' | 'Sistema'>('Sistema');
  const [idioma, setIdioma] = useState<'PT' | 'EN'>('PT');

  const temasArr = ['Claro', 'Escuro', 'Sistema'] as const;
  const idiomasArr = ['PT', 'EN'] as const;

  return (
    <div className="p-6 max-w-sm border rounded-xl divide-y">
      <ToggleRow
        label="Tema"
        trailing={<span className="text-sm text-gray-700">{tema}</span>}
        onClick={() => setTema((t) => temasArr[(temasArr.indexOf(t) + 1) % temasArr.length])}
      />
      <ToggleRow
        label="Idioma"
        trailing={<span className="text-sm text-gray-700">{idioma}</span>}
        onClick={() => setIdioma((l) => (l === 'PT' ? 'EN' : 'PT'))}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// TOOLTIP
// ─────────────────────────────────────────────

export const TooltipTop: Story = () => (
  <div className="flex items-center justify-center p-24">
    <Tooltip content="Linha circular que passa pelo campus" position="top">
      <button type="button" className="rounded border px-4 py-2 text-sm bg-white hover:bg-gray-50">
        Hover para ver tooltip (top)
      </button>
    </Tooltip>
  </div>
);

export const TooltipBottom: Story = () => (
  <div className="flex items-center justify-center p-24">
    <Tooltip content="Linha que conecta Pampulha ao Centro" position="bottom">
      <button type="button" className="rounded border px-4 py-2 text-sm bg-white hover:bg-gray-50">
        Hover para ver tooltip (bottom)
      </button>
    </Tooltip>
  </div>
);

export const TooltipLeft: Story = () => (
  <div className="flex items-center justify-center p-24">
    <Tooltip content="Serviço de linha rápida sem paradas intermediárias" position="left">
      <button type="button" className="rounded border px-4 py-2 text-sm bg-white hover:bg-gray-50">
        Hover para ver tooltip (left)
      </button>
    </Tooltip>
  </div>
);

export const TooltipRight: Story = () => (
  <div className="flex items-center justify-center p-24">
    <Tooltip content="Ônibus com ar-condicionado e Wi-Fi gratuito" position="right">
      <button type="button" className="rounded border px-4 py-2 text-sm bg-white hover:bg-gray-50">
        Hover para ver tooltip (right)
      </button>
    </Tooltip>
  </div>
);

export const TooltipAllPositions: Story = () => (
  <div className="flex items-center justify-center gap-16 p-24 flex-wrap">
    {(['top', 'bottom', 'left', 'right'] as const).map((pos) => (
      <Tooltip key={pos} content={`Tooltip posição: ${pos}`} position={pos}>
        <button
          type="button"
          className="rounded border px-3 py-1.5 text-xs bg-white hover:bg-gray-50"
        >
          {pos}
        </button>
      </Tooltip>
    ))}
  </div>
);

export const TooltipLongContent: Story = () => (
  <div className="flex items-center justify-center p-24">
    <Tooltip
      content="Esta linha atende os bairros Floresta, Santa Efigênia, Lagoinha, Bonfim e Centro. Opera nos horários de pico das 6h às 22h."
      position="top"
    >
      <button type="button" className="rounded border px-4 py-2 text-sm bg-white hover:bg-gray-50">
        Hover — texto longo
      </button>
    </Tooltip>
  </div>
);

export const TooltipOnIcon: Story = () => (
  <div className="flex items-center justify-center p-24 gap-4">
    <span className="text-sm text-gray-600">Linha 5002</span>
    <Tooltip content="Esta linha possui integração com o metrô" position="right">
      <AlertCircle size={16} className="text-blue-500 cursor-help" />
    </Tooltip>
  </div>
);

export const TooltipOnLink: Story = () => (
  <div className="flex items-center justify-center p-24">
    <Tooltip content="Abre o horário completo em nova aba" position="bottom">
      {/* biome-ignore lint/a11y/useValidAnchor: story demo */}
      <a href="#" className="text-sm text-blue-600 underline">
        Ver horários
      </a>
    </Tooltip>
  </div>
);

// ─────────────────────────────────────────────
// INFO ROW
// ─────────────────────────────────────────────

export const InfoRowBasic: Story = () => (
  <div className="p-6 max-w-sm">
    <InfoRow label="Linha" value="5002 - Pampulha / Centro" />
  </div>
);

export const InfoRowWithReactNodeValue: Story = () => (
  <div className="p-6 max-w-sm">
    <InfoRow
      label="Status"
      value={
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-green-500" />
          <span>Em operação</span>
        </span>
      }
    />
  </div>
);

export const InfoRowGroup: Story = () => (
  <div className="p-6 max-w-sm space-y-2">
    <InfoRow label="Empresa" value="BHTrans" />
    <InfoRow label="Linha" value="5002 - Pampulha / Estação Central" />
    <InfoRow label="Tarifa" value="R$ 4,05" />
    <InfoRow label="Primeiro horário" value="05:40" />
    <InfoRow label="Último horário" value="23:15" />
    <InfoRow label="Intervalo médio" value="12 minutos" />
  </div>
);

export const InfoRowLongValue: Story = () => (
  <div className="p-6 max-w-sm">
    <InfoRow
      label="Itinerário"
      value="Terminal Barreiro → Av. Afonso Vaz de Melo → Av. Amazonas → Praça da Estação → Centro"
    />
  </div>
);

export const InfoRowCustomClassName: Story = () => (
  <div className="p-6 max-w-sm">
    <InfoRow
      label="Destaque"
      value="Linha mais utilizada no campus"
      className="border border-blue-200 bg-blue-50"
    />
  </div>
);

// ─────────────────────────────────────────────
// COMBINED COMPOSITIONS
// ─────────────────────────────────────────────

export const CompositionLineCardLoading: Story = () => (
  <div className="p-6 max-w-sm space-y-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
      Carregando linhas...
    </p>
    <SkeletonLineList count={3} />
  </div>
);

export const CompositionSearchResults: Story = () => (
  <div className="p-6 max-w-sm space-y-3">
    <FeedbackBanner message='3 resultados para "Pampulha"' type="success" />
    <InfoRow label="Linha" value="5002 - Pampulha / Centro" />
    <InfoRow label="Linha" value="5004 - Pampulha / Barreiro" />
    <InfoRow label="Linha" value="5010 - Pampulha / Venda Nova" />
  </div>
);

export const CompositionSearchError: Story = () => (
  <div className="p-6 max-w-sm space-y-3">
    <FeedbackBanner message="Falha na busca. Verifique sua conexão." type="error" />
    <ErrorEmptyState
      message="Não foi possível conectar ao servidor de rotas."
      onRetry={() => alert('Tentando novamente...')}
    />
  </div>
);

export const CompositionSettingsPanel: Story = () => {
  const [notif, setNotif] = useState(true);
  const [dark, setDark] = useState(false);
  const [tema, setTema] = useState<'Claro' | 'Escuro' | 'Sistema'>('Sistema');
  const temasArr = ['Claro', 'Escuro', 'Sistema'] as const;

  return (
    <div className="p-6 max-w-sm space-y-1 border rounded-xl">
      <p className="text-sm font-semibold text-gray-700 px-3 pb-2">Preferências</p>
      <div className="divide-y">
        <SwitchRow label="Notificações" checked={notif} onClick={() => setNotif((v) => !v)} />
        <SwitchRow label="Modo escuro" checked={dark} onClick={() => setDark((v) => !v)} disabled />
        <ToggleRow
          label="Tema"
          trailing={<span className="text-sm text-gray-700">{tema}</span>}
          onClick={() => setTema((t) => temasArr[(temasArr.indexOf(t) + 1) % temasArr.length])}
        />
      </div>
    </div>
  );
};

export const CompositionMapLoadingState: Story = () => (
  <div className="grid grid-cols-2 gap-0" style={{ height: 480, width: 640 }}>
    <SkeletonSidebar className="border-r" />
    <SkeletonMap />
  </div>
);

// ─────────────────────────────────────────────
// Named exports order


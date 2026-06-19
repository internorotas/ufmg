/**
 * Stories para UI Primitives - Badge, Button, Card
 * Design System - Interno Rotas UFMG
 */

import type { Story } from '@ladle/react';
import React from 'react';
import { Badge, CountBadge, DayCategoryBadge, LineStatusBadge } from '../components/ui/Badge';
import { Button, ButtonGroup } from '../components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { CategoriaDia } from '../types/data.types';

// ---------------------------------------------------------------------------
// BADGE STORIES
// ---------------------------------------------------------------------------

export const BadgeNeutral: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="neutral" size="xs">
      Neutro XS
    </Badge>
    <Badge variant="neutral" size="sm">
      Neutro SM
    </Badge>
    <Badge variant="neutral" size="md">
      Neutro MD
    </Badge>
    <Badge variant="neutral" size="lg">
      Neutro LG
    </Badge>
  </div>
);

export const BadgeSuccess: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="success" size="xs">
      Sucesso XS
    </Badge>
    <Badge variant="success" size="sm">
      Sucesso SM
    </Badge>
    <Badge variant="success" size="md">
      Sucesso MD
    </Badge>
    <Badge variant="success" size="lg">
      Sucesso LG
    </Badge>
  </div>
);

export const BadgeInfo: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="info" size="xs">
      Info XS
    </Badge>
    <Badge variant="info" size="sm">
      Info SM
    </Badge>
    <Badge variant="info" size="md">
      Info MD
    </Badge>
    <Badge variant="info" size="lg">
      Info LG
    </Badge>
  </div>
);

export const BadgeWarning: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="warning" size="xs">
      Aviso XS
    </Badge>
    <Badge variant="warning" size="sm">
      Aviso SM
    </Badge>
    <Badge variant="warning" size="md">
      Aviso MD
    </Badge>
    <Badge variant="warning" size="lg">
      Aviso LG
    </Badge>
  </div>
);

export const BadgeDanger: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="danger" size="xs">
      Perigo XS
    </Badge>
    <Badge variant="danger" size="sm">
      Perigo SM
    </Badge>
    <Badge variant="danger" size="md">
      Perigo MD
    </Badge>
    <Badge variant="danger" size="lg">
      Perigo LG
    </Badge>
  </div>
);

export const BadgePrimary: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="primary" size="xs">
      Primário XS
    </Badge>
    <Badge variant="primary" size="sm">
      Primário SM
    </Badge>
    <Badge variant="primary" size="md">
      Primário MD
    </Badge>
    <Badge variant="primary" size="lg">
      Primário LG
    </Badge>
  </div>
);

export const BadgeSecondary: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="secondary" size="xs">
      Secundário XS
    </Badge>
    <Badge variant="secondary" size="sm">
      Secundário SM
    </Badge>
    <Badge variant="secondary" size="md">
      Secundário MD
    </Badge>
    <Badge variant="secondary" size="lg">
      Secundário LG
    </Badge>
  </div>
);

export const BadgeOutline: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="outline" size="xs">
      Outline XS
    </Badge>
    <Badge variant="outline" size="sm">
      Outline SM
    </Badge>
    <Badge variant="outline" size="md">
      Outline MD
    </Badge>
    <Badge variant="outline" size="lg">
      Outline LG
    </Badge>
  </div>
);

export const BadgeGhost: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="ghost" size="xs">
      Ghost XS
    </Badge>
    <Badge variant="ghost" size="sm">
      Ghost SM
    </Badge>
    <Badge variant="ghost" size="md">
      Ghost MD
    </Badge>
    <Badge variant="ghost" size="lg">
      Ghost LG
    </Badge>
  </div>
);

export const BadgeGamificationTiers: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="bronze">Bronze</Badge>
    <Badge variant="prata">Prata</Badge>
    <Badge variant="ouro">Ouro</Badge>
    <Badge variant="platina">Platina</Badge>
  </div>
);

export const BadgeGamificationRarity: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="comum">Comum</Badge>
    <Badge variant="raro">Raro</Badge>
    <Badge variant="epico">Épico</Badge>
    <Badge variant="lendario">Lendário</Badge>
  </div>
);

export const BadgeGamificationGps: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="gps_ativo">GPS Ativo</Badge>
    <Badge variant="gps_inativo">GPS Inativo</Badge>
    <Badge variant="gps_incerto">GPS Incerto</Badge>
  </div>
);

export const BadgeWithLeftIcon: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="success" leftIcon={<span>✓</span>}>
      Circulando
    </Badge>
    <Badge variant="danger" leftIcon={<span>✗</span>}>
      Não circula
    </Badge>
    <Badge variant="info" leftIcon={<span>●</span>}>
      Em breve
    </Badge>
    <Badge variant="neutral" leftIcon={<span>○</span>}>
      Encerrado
    </Badge>
  </div>
);

export const BadgeWithRightIcon: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="primary" rightIcon={<span>→</span>}>
      Dias Úteis
    </Badge>
    <Badge variant="secondary" rightIcon={<span>→</span>}>
      Sábado
    </Badge>
    <Badge variant="warning" rightIcon={<span>→</span>}>
      Férias
    </Badge>
  </div>
);

export const BadgeWithBothIcons: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="info" leftIcon={<span>★</span>} rightIcon={<span>×</span>}>
      Tag removível
    </Badge>
    <Badge variant="success" leftIcon={<span>✓</span>} rightIcon={<span>✓</span>}>
      Confirmado
    </Badge>
  </div>
);

export const BadgeClickable: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Badge variant="primary" clickable onClick={() => alert('Clicou em Dias Úteis')}>
      Dias Úteis
    </Badge>
    <Badge variant="secondary" clickable onClick={() => alert('Clicou em Sábado')}>
      Sábado
    </Badge>
    <Badge variant="neutral" clickable onClick={() => alert('Clicou em Neutro')}>
      Neutro
    </Badge>
    <Badge variant="success" clickable onClick={() => alert('Clicou em Sucesso')}>
      Sucesso
    </Badge>
    <Badge variant="danger" clickable onClick={() => alert('Clicou em Perigo')}>
      Perigo
    </Badge>
  </div>
);

export const BadgeClickableAllVariants: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    {(
      [
        'success',
        'info',
        'warning',
        'danger',
        'neutral',
        'primary',
        'secondary',
        'outline',
        'ghost',
      ] as const
    ).map((variant) => (
      <Badge key={variant} variant={variant} clickable>
        {variant}
      </Badge>
    ))}
  </div>
);

export const BadgeAllVariantsOverview: Story = () => (
  <div className="flex flex-col gap-4 p-4">
    <div>
      <p className="text-sm font-semibold mb-2 text-gray-500">Status</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">Sucesso</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="warning">Aviso</Badge>
        <Badge variant="danger">Perigo</Badge>
        <Badge variant="neutral">Neutro</Badge>
      </div>
    </div>
    <div>
      <p className="text-sm font-semibold mb-2 text-gray-500">Marca</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="primary">Primário</Badge>
        <Badge variant="secondary">Secundário</Badge>
      </div>
    </div>
    <div>
      <p className="text-sm font-semibold mb-2 text-gray-500">Minimal</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Outline</Badge>
        <Badge variant="ghost">Ghost</Badge>
      </div>
    </div>
    <div>
      <p className="text-sm font-semibold mb-2 text-gray-500">Gamificação - Tier</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="bronze">Bronze</Badge>
        <Badge variant="prata">Prata</Badge>
        <Badge variant="ouro">Ouro</Badge>
        <Badge variant="platina">Platina</Badge>
      </div>
    </div>
    <div>
      <p className="text-sm font-semibold mb-2 text-gray-500">Gamificação - Raridade</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="comum">Comum</Badge>
        <Badge variant="raro">Raro</Badge>
        <Badge variant="epico">Épico</Badge>
        <Badge variant="lendario">Lendário</Badge>
      </div>
    </div>
    <div>
      <p className="text-sm font-semibold mb-2 text-gray-500">GPS</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="gps_ativo">GPS Ativo</Badge>
        <Badge variant="gps_inativo">GPS Inativo</Badge>
        <Badge variant="gps_incerto">GPS Incerto</Badge>
      </div>
    </div>
  </div>
);

// Preset Badges

export const BadgePresetLineStatusRunning: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <LineStatusBadge status="running" size="xs" />
    <LineStatusBadge status="running" size="sm" />
    <LineStatusBadge status="running" size="md" />
    <LineStatusBadge status="running" size="lg" />
  </div>
);

export const BadgePresetLineStatusUpcoming: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <LineStatusBadge status="upcoming" size="xs" />
    <LineStatusBadge status="upcoming" size="sm" />
    <LineStatusBadge status="upcoming" size="md" />
    <LineStatusBadge status="upcoming" size="lg" />
  </div>
);

export const BadgePresetLineStatusClosed: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <LineStatusBadge status="closed" size="xs" />
    <LineStatusBadge status="closed" size="sm" />
    <LineStatusBadge status="closed" size="md" />
    <LineStatusBadge status="closed" size="lg" />
  </div>
);

export const BadgePresetLineStatusNotRunning: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <LineStatusBadge status="notRunning" size="xs" />
    <LineStatusBadge status="notRunning" size="sm" />
    <LineStatusBadge status="notRunning" size="md" />
    <LineStatusBadge status="notRunning" size="lg" />
  </div>
);

export const BadgePresetLineStatusCustomLabel: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <LineStatusBadge status="running" label="Ônibus circulando agora" />
    <LineStatusBadge status="closed" label="Serviço encerrado às 23h" />
    <LineStatusBadge status="upcoming" label="Começa em 5 min" />
    <LineStatusBadge status="notRunning" label="Linha suspensa" />
  </div>
);

export const BadgePresetLineStatusAllStatuses: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <LineStatusBadge status="running" />
    <LineStatusBadge status="upcoming" />
    <LineStatusBadge status="closed" />
    <LineStatusBadge status="notRunning" />
  </div>
);

export const BadgePresetDayCategoryDiasUteis: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <DayCategoryBadge category={CategoriaDia.DiasUteis} size="xs" />
    <DayCategoryBadge category={CategoriaDia.DiasUteis} size="sm" />
    <DayCategoryBadge category={CategoriaDia.DiasUteis} size="md" />
    <DayCategoryBadge category={CategoriaDia.DiasUteis} size="lg" />
  </div>
);

export const BadgePresetDayCategorySabado: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <DayCategoryBadge category={CategoriaDia.Sabado} size="xs" />
    <DayCategoryBadge category={CategoriaDia.Sabado} size="sm" />
    <DayCategoryBadge category={CategoriaDia.Sabado} size="md" />
    <DayCategoryBadge category={CategoriaDia.Sabado} size="lg" />
  </div>
);

export const BadgePresetDayCategoryFeriasERecessos: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <DayCategoryBadge category={CategoriaDia.FeriasERecessos} size="xs" />
    <DayCategoryBadge category={CategoriaDia.FeriasERecessos} size="sm" />
    <DayCategoryBadge category={CategoriaDia.FeriasERecessos} size="md" />
    <DayCategoryBadge category={CategoriaDia.FeriasERecessos} size="lg" />
  </div>
);

export const BadgePresetDayCategoryAll: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <DayCategoryBadge category={CategoriaDia.DiasUteis} />
    <DayCategoryBadge category={CategoriaDia.Sabado} />
    <DayCategoryBadge category={CategoriaDia.FeriasERecessos} />
  </div>
);

export const BadgePresetCountDefault: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <CountBadge count={0} />
    <CountBadge count={1} />
    <CountBadge count={5} />
    <CountBadge count={12} />
    <CountBadge count={99} />
    <CountBadge count={999} />
  </div>
);

export const BadgePresetCountVariants: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <CountBadge count={7} variant="neutral" />
    <CountBadge count={7} variant="primary" />
    <CountBadge count={7} variant="success" />
    <CountBadge count={7} variant="info" />
    <CountBadge count={7} variant="warning" />
    <CountBadge count={7} variant="danger" />
  </div>
);

export const BadgePresetCountSizes: Story = () => (
  <div className="flex flex-wrap gap-2 items-center p-4">
    <CountBadge count={42} size="xs" />
    <CountBadge count={42} size="sm" />
    <CountBadge count={42} size="md" />
    <CountBadge count={42} size="lg" />
  </div>
);

// ---------------------------------------------------------------------------
// BUTTON STORIES
// ---------------------------------------------------------------------------

export const ButtonPrimary: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Button variant="primary" size="xs">
      Primário XS
    </Button>
    <Button variant="primary" size="sm">
      Primário SM
    </Button>
    <Button variant="primary" size="md">
      Primário MD
    </Button>
    <Button variant="primary" size="lg">
      Primário LG
    </Button>
    <Button variant="primary" size="xl">
      Primário XL
    </Button>
  </div>
);

export const ButtonSecondary: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Button variant="secondary" size="xs">
      Secundário XS
    </Button>
    <Button variant="secondary" size="sm">
      Secundário SM
    </Button>
    <Button variant="secondary" size="md">
      Secundário MD
    </Button>
    <Button variant="secondary" size="lg">
      Secundário LG
    </Button>
    <Button variant="secondary" size="xl">
      Secundário XL
    </Button>
  </div>
);

export const ButtonSuccess: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Button variant="success" size="xs">
      Sucesso XS
    </Button>
    <Button variant="success" size="sm">
      Sucesso SM
    </Button>
    <Button variant="success" size="md">
      Sucesso MD
    </Button>
    <Button variant="success" size="lg">
      Sucesso LG
    </Button>
    <Button variant="success" size="xl">
      Sucesso XL
    </Button>
  </div>
);

export const ButtonDanger: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Button variant="danger" size="xs">
      Perigo XS
    </Button>
    <Button variant="danger" size="sm">
      Perigo SM
    </Button>
    <Button variant="danger" size="md">
      Perigo MD
    </Button>
    <Button variant="danger" size="lg">
      Perigo LG
    </Button>
    <Button variant="danger" size="xl">
      Perigo XL
    </Button>
  </div>
);

export const ButtonGhost: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Button variant="ghost" size="xs">
      Ghost XS
    </Button>
    <Button variant="ghost" size="sm">
      Ghost SM
    </Button>
    <Button variant="ghost" size="md">
      Ghost MD
    </Button>
    <Button variant="ghost" size="lg">
      Ghost LG
    </Button>
    <Button variant="ghost" size="xl">
      Ghost XL
    </Button>
  </div>
);

export const ButtonOutline: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Button variant="outline" size="xs">
      Outline XS
    </Button>
    <Button variant="outline" size="sm">
      Outline SM
    </Button>
    <Button variant="outline" size="md">
      Outline MD
    </Button>
    <Button variant="outline" size="lg">
      Outline LG
    </Button>
    <Button variant="outline" size="xl">
      Outline XL
    </Button>
  </div>
);

export const ButtonLink: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Button variant="link" size="xs">
      Link XS
    </Button>
    <Button variant="link" size="sm">
      Link SM
    </Button>
    <Button variant="link" size="md">
      Link MD
    </Button>
    <Button variant="link" size="lg">
      Link LG
    </Button>
    <Button variant="link" size="xl">
      Link XL
    </Button>
  </div>
);

export const ButtonDisabled: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Button variant="primary" disabled>
      Primário Desabilitado
    </Button>
    <Button variant="secondary" disabled>
      Secundário Desabilitado
    </Button>
    <Button variant="success" disabled>
      Sucesso Desabilitado
    </Button>
    <Button variant="danger" disabled>
      Perigo Desabilitado
    </Button>
    <Button variant="ghost" disabled>
      Ghost Desabilitado
    </Button>
    <Button variant="outline" disabled>
      Outline Desabilitado
    </Button>
    <Button variant="link" disabled>
      Link Desabilitado
    </Button>
  </div>
);

export const ButtonLoading: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Button variant="primary" loading>
      Carregando...
    </Button>
    <Button variant="secondary" loading>
      Salvando...
    </Button>
    <Button variant="success" loading>
      Confirmando...
    </Button>
    <Button variant="danger" loading>
      Excluindo...
    </Button>
    <Button variant="ghost" loading>
      Aguarde...
    </Button>
    <Button variant="outline" loading>
      Processando...
    </Button>
  </div>
);

export const ButtonLoadingSizes: Story = () => (
  <div className="flex flex-wrap gap-2 items-center p-4">
    <Button variant="primary" size="xs" loading>
      XS
    </Button>
    <Button variant="primary" size="sm" loading>
      SM
    </Button>
    <Button variant="primary" size="md" loading>
      MD
    </Button>
    <Button variant="primary" size="lg" loading>
      LG
    </Button>
    <Button variant="primary" size="xl" loading>
      XL
    </Button>
  </div>
);

export const ButtonWithLeftIcon: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Button variant="primary" leftIcon={<span>+</span>}>
      Nova Linha
    </Button>
    <Button variant="secondary" leftIcon={<span>↑</span>}>
      Atualizar
    </Button>
    <Button variant="ghost" leftIcon={<span>✎</span>}>
      Editar
    </Button>
    <Button variant="danger" leftIcon={<span>✕</span>}>
      Excluir
    </Button>
    <Button variant="outline" leftIcon={<span>⬇</span>}>
      Exportar
    </Button>
  </div>
);

export const ButtonWithRightIcon: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Button variant="primary" rightIcon={<span>→</span>}>
      Próximo
    </Button>
    <Button variant="secondary" rightIcon={<span>▼</span>}>
      Ver mais
    </Button>
    <Button variant="ghost" rightIcon={<span>↗</span>}>
      Abrir
    </Button>
    <Button variant="outline" rightIcon={<span>⬡</span>}>
      Opções
    </Button>
  </div>
);

export const ButtonWithBothIcons: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Button variant="primary" leftIcon={<span>🚌</span>} rightIcon={<span>→</span>}>
      Ver rota
    </Button>
    <Button variant="outline" leftIcon={<span>⬇</span>} rightIcon={<span>📄</span>}>
      Baixar PDF
    </Button>
  </div>
);

export const ButtonIcon: Story = () => (
  <div className="flex flex-wrap gap-2 items-center p-4">
    <Button variant="primary" size="icon" aria-label="Adicionar">
      +
    </Button>
    <Button variant="secondary" size="icon" aria-label="Editar">
      ✎
    </Button>
    <Button variant="ghost" size="icon" aria-label="Menu">
      ☰
    </Button>
    <Button variant="outline" size="icon" aria-label="Fechar">
      ✕
    </Button>
    <Button variant="danger" size="icon" aria-label="Excluir">
      🗑
    </Button>
  </div>
);

export const ButtonIconSizes: Story = () => (
  <div className="flex flex-wrap gap-2 items-center p-4">
    <Button variant="primary" size="icon-xs" aria-label="XS">
      +
    </Button>
    <Button variant="primary" size="icon-sm" aria-label="SM">
      +
    </Button>
    <Button variant="primary" size="icon" aria-label="MD">
      +
    </Button>
  </div>
);

export const ButtonFullWidth: Story = () => (
  <div className="flex flex-col gap-2 p-4 max-w-md">
    <Button variant="primary" fullWidth>
      Botão Largura Total - Primário
    </Button>
    <Button variant="secondary" fullWidth>
      Botão Largura Total - Secundário
    </Button>
    <Button variant="outline" fullWidth>
      Botão Largura Total - Outline
    </Button>
    <Button variant="ghost" fullWidth>
      Botão Largura Total - Ghost
    </Button>
    <Button variant="danger" fullWidth>
      Botão Largura Total - Perigo
    </Button>
  </div>
);

export const ButtonAllVariantsOverview: Story = () => (
  <div className="flex flex-wrap gap-2 p-4">
    <Button variant="primary">Primário</Button>
    <Button variant="secondary">Secundário</Button>
    <Button variant="success">Sucesso</Button>
    <Button variant="danger">Perigo</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="link">Link</Button>
  </div>
);

export const ButtonGroupHorizontal: Story = () => (
  <div className="p-4">
    <ButtonGroup orientation="horizontal" gap="md">
      <Button variant="outline">Cancelar</Button>
      <Button variant="primary">Confirmar</Button>
    </ButtonGroup>
  </div>
);

export const ButtonGroupVertical: Story = () => (
  <div className="p-4">
    <ButtonGroup orientation="vertical" gap="sm">
      <Button variant="primary" fullWidth>
        Salvar alterações
      </Button>
      <Button variant="outline" fullWidth>
        Descartar
      </Button>
      <Button variant="danger" fullWidth>
        Excluir linha
      </Button>
    </ButtonGroup>
  </div>
);

export const ButtonGroupGapVariants: Story = () => (
  <div className="flex flex-col gap-6 p-4">
    <div>
      <p className="text-sm text-gray-500 mb-2">Gap SM</p>
      <ButtonGroup gap="sm">
        <Button variant="outline" size="sm">
          Opção A
        </Button>
        <Button variant="outline" size="sm">
          Opção B
        </Button>
        <Button variant="primary" size="sm">
          Confirmar
        </Button>
      </ButtonGroup>
    </div>
    <div>
      <p className="text-sm text-gray-500 mb-2">Gap MD</p>
      <ButtonGroup gap="md">
        <Button variant="outline">Opção A</Button>
        <Button variant="outline">Opção B</Button>
        <Button variant="primary">Confirmar</Button>
      </ButtonGroup>
    </div>
    <div>
      <p className="text-sm text-gray-500 mb-2">Gap LG</p>
      <ButtonGroup gap="lg">
        <Button variant="outline">Opção A</Button>
        <Button variant="outline">Opção B</Button>
        <Button variant="primary">Confirmar</Button>
      </ButtonGroup>
    </div>
  </div>
);

export const ButtonRealWorldConfirmDialog: Story = () => (
  <div className="p-4 max-w-sm border rounded-lg bg-white space-y-4">
    <div>
      <h3 className="font-semibold text-gray-900">Confirmar exclusão</h3>
      <p className="text-sm text-gray-500 mt-1">
        Tem certeza que deseja excluir a linha 001 - Circular Campus? Esta ação não pode ser
        desfeita.
      </p>
    </div>
    <ButtonGroup justify-content="end" gap="sm">
      <Button variant="ghost" size="sm">
        Cancelar
      </Button>
      <Button variant="danger" size="sm">
        Excluir linha
      </Button>
    </ButtonGroup>
  </div>
);

// ---------------------------------------------------------------------------
// CARD STORIES
// ---------------------------------------------------------------------------

export const CardDefault: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="default">
      <CardHeader>
        <CardTitle>Linha 001 - Circular Campus</CardTitle>
        <CardDescription>Horário de funcionamento: 06h00 às 23h00</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Rota que percorre o campus universitário com paradas nos principais blocos.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Ver detalhes</Button>
      </CardFooter>
    </Card>
  </div>
);

export const CardElevated: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Linha 042 - Pampulha Express</CardTitle>
        <CardDescription>Serviço expresso - Dias úteis</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Rota expressa conectando o campus à Lagoa da Pampulha com poucas paradas.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">
          Ver rota
        </Button>
      </CardFooter>
    </Card>
  </div>
);

export const CardOutline: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="outline">
      <CardHeader>
        <CardTitle>Linha 007 - Reitoria</CardTitle>
        <CardDescription>Destino: Reitoria UFMG</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Linha que conecta o campus ao prédio da Reitoria.</p>
      </CardContent>
    </Card>
  </div>
);

export const CardGhost: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="ghost">
      <CardHeader>
        <CardTitle>Linha 015 - ICEx</CardTitle>
        <CardDescription>Instituto de Ciências Exatas</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Linha que atende o Instituto de Ciências Exatas e adjacências.</p>
      </CardContent>
    </Card>
  </div>
);

export const CardInteractive: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="interactive" onClick={() => alert('Card clicado!')}>
      <CardHeader>
        <CardTitle>Linha 022 - Fafich</CardTitle>
        <CardDescription>Clique para ver os horários</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Faculdade de Filosofia e Ciências Humanas - Campus Pampulha.</p>
      </CardContent>
    </Card>
  </div>
);

export const CardSelected: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="default" selected={true}>
      <CardHeader>
        <CardTitle>Linha 033 - Selecionada</CardTitle>
        <CardDescription>Esta linha está selecionada</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Card com estado de seleção ativo.</p>
      </CardContent>
    </Card>
  </div>
);

export const CardNotSelected: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="default" selected={false}>
      <CardHeader>
        <CardTitle>Linha 044 - Não Selecionada</CardTitle>
        <CardDescription>Esta linha não está selecionada</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Card com estado de seleção inativo.</p>
      </CardContent>
    </Card>
  </div>
);

export const CardSelectedComparison: Story = () => (
  <div className="p-4 flex gap-4">
    <Card variant="default" selected={false} className="max-w-xs">
      <CardHeader>
        <CardTitle>Linha 001</CardTitle>
        <CardDescription>Não selecionada</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Circular Campus</p>
      </CardContent>
    </Card>
    <Card variant="default" selected={true} className="max-w-xs">
      <CardHeader>
        <CardTitle>Linha 002</CardTitle>
        <CardDescription>Selecionada</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Pampulha Express</p>
      </CardContent>
    </Card>
  </div>
);

export const CardPaddingNone: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="default" padding="none">
      <div className="p-4">
        <p className="text-sm font-medium">Conteúdo sem padding no card root</p>
        <p className="text-xs text-gray-500">O padding foi definido manualmente.</p>
      </div>
    </Card>
  </div>
);

export const CardPaddingSm: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="default" padding="sm">
      <CardTitle>Título com padding SM</CardTitle>
      <p className="text-sm mt-1">Conteúdo com padding small no card root.</p>
    </Card>
  </div>
);

export const CardPaddingMd: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="default" padding="md">
      <CardTitle>Título com padding MD</CardTitle>
      <p className="text-sm mt-1">Conteúdo com padding medium no card root.</p>
    </Card>
  </div>
);

export const CardPaddingLg: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="default" padding="lg">
      <CardTitle>Título com padding LG</CardTitle>
      <p className="text-sm mt-1">Conteúdo com padding large no card root.</p>
    </Card>
  </div>
);

export const CardHeaderWithBorder: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="default">
      <CardHeader withBorder={true}>
        <CardTitle>Cabeçalho com borda</CardTitle>
        <CardDescription>A borda separa o cabeçalho do conteúdo</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Conteúdo abaixo do cabeçalho com borda.</p>
      </CardContent>
    </Card>
  </div>
);

export const CardHeaderNoBorder: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="default">
      <CardHeader withBorder={false}>
        <CardTitle>Cabeçalho sem borda</CardTitle>
        <CardDescription>Sem separação visual</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Conteúdo fluindo após o cabeçalho.</p>
      </CardContent>
    </Card>
  </div>
);

export const CardTitleSizes: Story = () => (
  <div className="p-4 max-w-sm space-y-4">
    <Card variant="default" padding="md">
      <CardTitle size="sm">Título tamanho SM</CardTitle>
    </Card>
    <Card variant="default" padding="md">
      <CardTitle size="md">Título tamanho MD</CardTitle>
    </Card>
    <Card variant="default" padding="md">
      <CardTitle size="lg">Título tamanho LG</CardTitle>
    </Card>
    <Card variant="default" padding="md">
      <CardTitle size="xl">Título tamanho XL</CardTitle>
    </Card>
  </div>
);

export const CardTitleAsElements: Story = () => (
  <div className="p-4 max-w-sm space-y-4">
    <Card variant="default" padding="md">
      <CardTitle as="h1">Título como H1</CardTitle>
    </Card>
    <Card variant="default" padding="md">
      <CardTitle as="h2">Título como H2</CardTitle>
    </Card>
    <Card variant="default" padding="md">
      <CardTitle as="h3">Título como H3 (padrão)</CardTitle>
    </Card>
    <Card variant="default" padding="md">
      <CardTitle as="span">Título como span</CardTitle>
    </Card>
  </div>
);

export const CardFooterJustifyStart: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="default">
      <CardContent>
        <p className="text-sm">Conteúdo do card.</p>
      </CardContent>
      <CardFooter justify="start" withBorder>
        <Button size="sm" variant="outline">
          Cancelar
        </Button>
        <Button size="sm" className="ml-2">
          Confirmar
        </Button>
      </CardFooter>
    </Card>
  </div>
);

export const CardFooterJustifyCenter: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="default">
      <CardContent>
        <p className="text-sm">Conteúdo do card.</p>
      </CardContent>
      <CardFooter justify="center" withBorder>
        <Button size="sm">Ação Central</Button>
      </CardFooter>
    </Card>
  </div>
);

export const CardFooterJustifyEnd: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="default">
      <CardContent>
        <p className="text-sm">Conteúdo do card.</p>
      </CardContent>
      <CardFooter justify="end" withBorder>
        <Button size="sm" variant="outline">
          Cancelar
        </Button>
        <Button size="sm" className="ml-2">
          Salvar
        </Button>
      </CardFooter>
    </Card>
  </div>
);

export const CardFooterJustifyBetween: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="default">
      <CardContent>
        <p className="text-sm">Conteúdo do card.</p>
      </CardContent>
      <CardFooter justify="between" withBorder>
        <Button size="sm" variant="danger">
          Excluir
        </Button>
        <Button size="sm">Salvar</Button>
      </CardFooter>
    </Card>
  </div>
);

export const CardAsArticle: Story = () => (
  <div className="p-4 max-w-sm">
    <Card as="article" variant="default" padding="md">
      <CardTitle>Artigo semântico</CardTitle>
      <p className="text-sm mt-2">Renderizado como elemento article do HTML.</p>
    </Card>
  </div>
);

export const CardAsSection: Story = () => (
  <div className="p-4 max-w-sm">
    <Card as="section" variant="default" padding="md">
      <CardTitle>Seção semântica</CardTitle>
      <p className="text-sm mt-2">Renderizado como elemento section do HTML.</p>
    </Card>
  </div>
);

export const CardAsDiv: Story = () => (
  <div className="p-4 max-w-sm">
    <Card as="div" variant="default" padding="md">
      <CardTitle>Div genérico</CardTitle>
      <p className="text-sm mt-2">Renderizado como elemento div do HTML.</p>
    </Card>
  </div>
);

export const CardComplexBusLine: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="default">
      <CardHeader withBorder>
        <div className="flex items-center justify-between">
          <CardTitle size="md">Linha 001</CardTitle>
          <LineStatusBadge status="running" size="sm" />
        </div>
        <CardDescription>Circular Campus - Pampulha</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Próxima partida:</span>
            <span className="font-medium">10:45</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Frequência:</span>
            <span className="font-medium">15 min</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Categoria:</span>
            <DayCategoryBadge category={CategoriaDia.DiasUteis} size="xs" />
          </div>
        </div>
      </CardContent>
      <CardFooter withBorder justify="between">
        <CountBadge count={3} variant="info" size="xs" />
        <Button size="sm" variant="outline">
          Ver horários
        </Button>
      </CardFooter>
    </Card>
  </div>
);

export const CardGridLayout: Story = () => (
  <div className="p-4 grid grid-cols-2 gap-4 max-w-2xl">
    {[
      { id: '001', nome: 'Circular Campus', status: 'running' as const, paradas: 8 },
      { id: '042', nome: 'Pampulha Express', status: 'upcoming' as const, paradas: 4 },
      { id: '007', nome: 'Rota Reitoria', status: 'closed' as const, paradas: 6 },
      { id: '015', nome: 'ICEx Direto', status: 'notRunning' as const, paradas: 3 },
    ].map((linha) => (
      <Card key={linha.id} variant="interactive">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle size="sm">Linha {linha.id}</CardTitle>
            <LineStatusBadge status={linha.status} size="xs" />
          </div>
          <CardDescription>{linha.nome}</CardDescription>
        </CardHeader>
        <CardFooter>
          <CountBadge count={linha.paradas} variant="neutral" size="xs" />
          <span className="text-xs text-gray-400 ml-1">paradas</span>
        </CardFooter>
      </Card>
    ))}
  </div>
);

export const CardEmptyState: Story = () => (
  <div className="p-4 max-w-sm">
    <Card variant="outline" padding="lg">
      <div className="text-center space-y-2">
        <div className="text-4xl">🚌</div>
        <CardTitle size="md" className="text-center">
          Nenhuma linha encontrada
        </CardTitle>
        <CardDescription className="text-center">
          Não há linhas de ônibus disponíveis para o filtro selecionado.
        </CardDescription>
        <div className="pt-2">
          <Button variant="outline" size="sm">
            Limpar filtros
          </Button>
        </div>
      </div>
    </Card>
  </div>
);

export const CardHeaderPaddingVariants: Story = () => (
  <div className="p-4 max-w-sm space-y-4">
    <Card variant="default">
      <CardHeader padding="sm">
        <CardTitle size="sm">Header padding SM</CardTitle>
        <CardDescription>Espaçamento pequeno</CardDescription>
      </CardHeader>
    </Card>
    <Card variant="default">
      <CardHeader padding="md">
        <CardTitle size="sm">Header padding MD</CardTitle>
        <CardDescription>Espaçamento médio (padrão)</CardDescription>
      </CardHeader>
    </Card>
    <Card variant="default">
      <CardHeader padding="lg">
        <CardTitle size="sm">Header padding LG</CardTitle>
        <CardDescription>Espaçamento grande</CardDescription>
      </CardHeader>
    </Card>
  </div>
);

export const CardContentPaddingVariants: Story = () => (
  <div className="p-4 max-w-sm space-y-4">
    <Card variant="default">
      <CardContent padding="sm">
        <p className="text-sm">Content padding SM</p>
      </CardContent>
    </Card>
    <Card variant="default">
      <CardContent padding="md">
        <p className="text-sm">Content padding MD (padrão)</p>
      </CardContent>
    </Card>
    <Card variant="default">
      <CardContent padding="lg">
        <p className="text-sm">Content padding LG</p>
      </CardContent>
    </Card>
    <Card variant="default">
      <CardContent padding="none">
        <div className="bg-gray-100 p-4">
          <p className="text-sm">Content padding none - útil para imagens ou mapas</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const CardAllVariantsOverview: Story = () => (
  <div className="p-4 grid grid-cols-1 gap-4 max-w-sm">
    {(['default', 'elevated', 'outline', 'ghost', 'interactive'] as const).map((variant) => (
      <Card key={variant} variant={variant}>
        <CardHeader>
          <CardTitle size="sm">Variante: {variant}</CardTitle>
          <CardDescription>Exemplo do card com esta variante</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Conteúdo de demonstração do card.</p>
        </CardContent>
      </Card>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// EXPORT ORDER

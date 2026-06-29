/**
 * Stories for app-level layout and status components:
 * - AppShell
 * - DataStatusScreen
 * - DataSourceBanner
 * - OfflineToast
 * - SystemBanner
 * - ThemeToggle
 */

import type { Story } from '@ladle/react';
import { AlertTriangle, Bell, CheckCircle, Download, Info } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '@/components/app/AppShell';
import { DataSourceBanner } from '@/components/app/DataSourceBanner';
import { DataStatusScreen } from '@/components/app/DataStatusScreen';
import { OfflineToast } from '@/components/app/OfflineToast';
import { SystemBanner } from '@/components/SystemBanner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemeProvider } from '@/contexts/ThemeContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function WithRouter({ children }: { children: React.ReactNode }) {
  return <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>;
}

function WithTheme({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

// ---------------------------------------------------------------------------
// AppShell
// ---------------------------------------------------------------------------

export const AppShellMinimal: Story = () => (
  <WithRouter>
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppShell title="Perfil">
        <p className="text-text-secondary">Conteúdo da página.</p>
      </AppShell>
    </div>
  </WithRouter>
);

export const AppShellWithDescription: Story = () => (
  <WithRouter>
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppShell title="Ranking" description="Motoristas mais bem avaliados do campus">
        <p className="text-text-secondary">Lista de ranking aqui.</p>
      </AppShell>
    </div>
  </WithRouter>
);

export const AppShellWithActions: Story = () => (
  <WithRouter>
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppShell
        title="Sobre o App"
        description="Versão 2.4.0"
        actions={
          <button
            type="button"
            className="rounded border border-brand-primary px-3 py-1 text-sm text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
          >
            Atualizar
          </button>
        }
      >
        <p className="text-text-secondary">Informações do aplicativo.</p>
      </AppShell>
    </div>
  </WithRouter>
);

export const AppShellWithMultipleActions: Story = () => (
  <WithRouter>
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppShell
        title="Configurações"
        actions={
          <>
            <button
              type="button"
              className="rounded border border-brand-primary px-3 py-1 text-sm text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
            >
              Salvar
            </button>
            <button
              type="button"
              className="rounded border border-danger-border px-3 py-1 text-sm text-danger-text hover:bg-danger-bg transition-colors"
            >
              Descartar
            </button>
          </>
        }
      >
        <p className="text-text-secondary">Formulário de configurações.</p>
      </AppShell>
    </div>
  </WithRouter>
);

export const AppShellCustomBackTo: Story = () => (
  <WithRouter>
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppShell title="Detalhes do Motorista" backTo="/ranking" backLabel="Voltar ao ranking">
        <p className="text-text-secondary">Dados detalhados do motorista selecionado.</p>
      </AppShell>
    </div>
  </WithRouter>
);

export const AppShellWithRichContent: Story = () => (
  <WithRouter>
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppShell
        title="Meu Perfil"
        description="Gerencie suas informações pessoais"
        actions={
          <WithTheme>
            <ThemeToggle />
          </WithTheme>
        }
      >
        <div className="space-y-4">
          <div className="neo-brutal bg-card p-4 rounded">
            <h2 className="font-semibold mb-2">Informações Pessoais</h2>
            <p className="text-text-secondary text-sm">Nome: Ana Paula Ferreira</p>
            <p className="text-text-secondary text-sm">Email: ana.ferreira@ufmg.br</p>
            <p className="text-text-secondary text-sm">Matrícula: 2021024567</p>
          </div>
          <div className="neo-brutal bg-card p-4 rounded">
            <h2 className="font-semibold mb-2">Estatísticas</h2>
            <p className="text-text-secondary text-sm">Viagens realizadas: 42</p>
            <p className="text-text-secondary text-sm">Avaliação média: 4.8 ★</p>
          </div>
          <div className="neo-brutal bg-card p-4 rounded">
            <h2 className="font-semibold mb-2">Preferências</h2>
            <p className="text-text-secondary text-sm">Rota favorita: Campus Pampulha → Centro</p>
          </div>
          {/* Extra content to demonstrate scrolling */}
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: story data has no stable IDs
            <div key={i} className="neo-brutal bg-card p-4 rounded">
              <p className="text-text-secondary text-sm">Seção adicional {i + 1}</p>
            </div>
          ))}
        </div>
      </AppShell>
    </div>
  </WithRouter>
);

export const AppShellLongTitle: Story = () => (
  <WithRouter>
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppShell
        title="Histórico Completo de Viagens e Avaliações do Semestre Letivo 2024/2"
        description="Relatório detalhado com todas as rotas percorridas, tempos e comentários recebidos pelos passageiros"
        actions={
          <button
            type="button"
            className="rounded border border-brand-primary px-3 py-1 text-sm text-brand-primary whitespace-nowrap"
          >
            Exportar
          </button>
        }
      >
        <p className="text-text-secondary">Conteúdo com título longo (deve truncar).</p>
      </AppShell>
    </div>
  </WithRouter>
);

export const AppShellCustomContentClass: Story = () => (
  <WithRouter>
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppShell title="Mapa de Rotas" contentClassName="bg-blue-50 dark:bg-blue-950/20">
        <p className="text-text-secondary">
          Área de conteúdo com classe customizada (fundo levemente azul).
        </p>
      </AppShell>
    </div>
  </WithRouter>
);

// ---------------------------------------------------------------------------
// DataStatusScreen
// ---------------------------------------------------------------------------

export const DataStatusScreenInfo: Story = () => (
  <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
    <DataStatusScreen
      title="Carregando dados..."
      description="Buscando informações das rotas e previsões do campus. Aguarde um momento."
    />
  </div>
);

export const DataStatusScreenWarning: Story = () => (
  <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
    <DataStatusScreen
      variant="warning"
      title="Erro ao carregar dados"
      description="Não foi possível obter as informações de rotas. Verifique sua conexão e tente novamente."
    />
  </div>
);

export const DataStatusScreenInfoWithRichDescription: Story = () => (
  <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
    <DataStatusScreen
      title="Inicializando sistema"
      description={
        <div className="space-y-1">
          <p>Conectando ao servidor da UFMG...</p>
          <p className="text-xs opacity-75">Isso pode levar alguns segundos em redes lentas.</p>
        </div>
      }
    />
  </div>
);

export const DataStatusScreenWarningWithActions: Story = () => (
  <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
    <DataStatusScreen
      variant="warning"
      title="Falha na conexão"
      description={
        <div className="space-y-3">
          <p>Não foi possível conectar ao servidor de rotas.</p>
          <button
            type="button"
            className="mt-2 rounded border border-warning-border bg-warning-bg px-4 py-2 text-sm font-medium text-warning-text hover:opacity-80 transition-opacity"
          >
            Tentar novamente
          </button>
        </div>
      }
    />
  </div>
);

// ---------------------------------------------------------------------------
// DataSourceBanner
// ---------------------------------------------------------------------------

export const DataSourceBannerHidden: Story = () => (
  <div className="relative p-4 bg-background-secondary min-h-32">
    <p className="text-text-secondary text-sm">
      Banner não visível (isVisible=false). Nenhum banner deve aparecer acima deste texto.
    </p>
    <DataSourceBanner isVisible={false} source="source-fallback" />
  </div>
);

export const DataSourceBannerApiSource: Story = () => (
  <div className="relative p-4 bg-background-secondary min-h-32">
    <p className="text-text-secondary text-sm">
      Fonte é 'api' — banner nunca é exibido independente de isVisible.
    </p>
    <DataSourceBanner isVisible={true} source="api" />
  </div>
);

export const DataSourceBannerSourceFallback: Story = () => (
  <div className="relative pt-24 p-4 bg-background-secondary min-h-48">
    <p className="text-text-secondary text-sm">Fonte: fallback local de segurança (sem data).</p>
    <DataSourceBanner isVisible={true} source="source-fallback" />
  </div>
);

export const DataSourceBannerSourceFallbackWithTimestamp: Story = () => (
  <div className="relative pt-24 p-4 bg-background-secondary min-h-48">
    <p className="text-text-secondary text-sm">
      Fonte: fallback local de segurança (com timestamp).
    </p>
    <DataSourceBanner
      isVisible={true}
      source="source-fallback"
      updatedAt="2024-08-15T09:05:00.000Z"
    />
  </div>
);

// ---------------------------------------------------------------------------
// OfflineToast
// ---------------------------------------------------------------------------

export const OfflineToastHidden: Story = () => (
  <div className="relative p-4 bg-background-secondary min-h-32">
    <p className="text-text-secondary text-sm">Toast offline oculto (show=false).</p>
    <OfflineToast show={false} />
  </div>
);

export const OfflineToastVisible: Story = () => (
  <div className="relative pt-20 p-4 bg-background-secondary min-h-48">
    <p className="text-text-secondary text-sm">Toast offline visível (show=true).</p>
    <OfflineToast show={true} />
  </div>
);

export const OfflineToastInteractive: Story = () => {
  const [isOffline, setIsOffline] = useState(false);
  return (
    <div className="relative pt-24 p-4 bg-background-secondary min-h-48 space-y-4">
      <p className="text-text-secondary text-sm">Simule alternar status de conexão:</p>
      <button
        type="button"
        onClick={() => setIsOffline((v) => !v)}
        className="rounded border border-brand-primary px-4 py-2 text-sm font-medium text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
      >
        {isOffline ? 'Simular online' : 'Simular offline'}
      </button>
      <OfflineToast show={isOffline} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// SystemBanner
// ---------------------------------------------------------------------------

export const SystemBannerInfo: Story = () => (
  <div className="p-6 max-w-xl">
    <SystemBanner
      variant="info"
      title="Informação"
      description="Os dados de rotas são atualizados a cada 5 minutos durante o horário de funcionamento do campus."
    />
  </div>
);

export const SystemBannerWarning: Story = () => (
  <div className="p-6 max-w-xl">
    <SystemBanner
      variant="warning"
      title="Atenção"
      description="O servidor de previsões está com instabilidade. As informações podem estar desatualizadas."
    />
  </div>
);

export const SystemBannerSuccess: Story = () => (
  <div className="p-6 max-w-xl">
    <SystemBanner
      variant="success"
      title="Sucesso"
      description="Seus dados foram sincronizados com sucesso. Tudo está atualizado."
    />
  </div>
);

export const SystemBannerNeutral: Story = () => (
  <div className="p-6 max-w-xl">
    <SystemBanner
      variant="neutral"
      title="Novidade"
      description="Uma nova versão do aplicativo está disponível com melhorias de desempenho."
    />
  </div>
);

export const SystemBannerWithIcon: Story = () => (
  <div className="p-6 max-w-xl space-y-3">
    <SystemBanner
      variant="info"
      title="Dica"
      icon={<Info size={16} />}
      description="Toque em qualquer parada no mapa para ver as previsões de chegada em tempo real."
    />
    <SystemBanner
      variant="warning"
      title="Aviso"
      icon={<AlertTriangle size={16} />}
      description="Conexão instável detectada. Operando em modo offline."
    />
    <SystemBanner
      variant="success"
      title="Confirmado"
      icon={<CheckCircle size={16} />}
      description="Rota favorita salva com sucesso."
    />
  </div>
);

export const SystemBannerWithActions: Story = () => (
  <div className="p-6 max-w-xl space-y-3">
    <SystemBanner
      variant="info"
      title="Atualização disponível"
      icon={<Download size={16} />}
      description="A versão 2.5.0 traz melhorias na precisão das previsões e nova interface do mapa."
      actions={
        <>
          <button
            type="button"
            className="rounded border border-info-border px-3 py-1 text-xs font-medium text-info-text hover:opacity-80 transition-opacity"
          >
            Atualizar agora
          </button>
          <button
            type="button"
            className="rounded px-3 py-1 text-xs text-info-text opacity-60 hover:opacity-100 transition-opacity"
          >
            Mais tarde
          </button>
        </>
      }
    />
  </div>
);

export const SystemBannerDismissible: Story = () => {
  const [visible, setVisible] = useState(true);
  return (
    <div className="p-6 max-w-xl">
      {visible ? (
        <SystemBanner
          variant="neutral"
          title="Bem-vindo ao Interno Rotas UFMG"
          icon={<Bell size={16} />}
          description="Acompanhe as rotas do campus em tempo real. Toque no mapa para começar."
          onDismiss={() => setVisible(false)}
          dismissLabel="Fechar aviso de boas-vindas"
        />
      ) : (
        <div className="rounded border border-dashed border-neutral-border p-4 text-center text-sm text-text-secondary">
          Banner dispensado. Recarregue para ver novamente.
        </div>
      )}
    </div>
  );
};

export const SystemBannerNoTitle: Story = () => (
  <div className="p-6 max-w-xl space-y-3">
    <SystemBanner
      variant="info"
      description="Dados atualizados automaticamente a cada 5 minutos."
    />
    <SystemBanner
      variant="warning"
      description="Modo offline ativo. Exibindo última versão conhecida das rotas."
    />
  </div>
);

export const SystemBannerRichDescription: Story = () => (
  <div className="p-6 max-w-xl">
    <SystemBanner
      variant="warning"
      title="Serviço parcialmente indisponível"
      icon={<AlertTriangle size={16} />}
      description={
        <div className="space-y-1">
          <p>As seguintes linhas estão com dados desatualizados:</p>
          <ul className="list-disc list-inside text-xs opacity-90 space-y-0.5">
            <li>Linha 601 — Pampulha / Saúde</li>
            <li>Linha 9308 — Circular Campus</li>
            <li>Linha 510 — Lagoinha / UFMG</li>
          </ul>
          <p className="text-xs opacity-75 mt-1">Previsão de normalização: 15:30.</p>
        </div>
      }
    />
  </div>
);

export const SystemBannerAllVariants: Story = () => (
  <div className="p-6 max-w-xl space-y-3">
    <SystemBanner
      variant="info"
      title="Info"
      icon={<Info size={16} />}
      description="Variante informativa padrão do sistema."
    />
    <SystemBanner
      variant="warning"
      title="Aviso"
      icon={<AlertTriangle size={16} />}
      description="Variante de alerta para situações que requerem atenção."
    />
    <SystemBanner
      variant="success"
      title="Sucesso"
      icon={<CheckCircle size={16} />}
      description="Variante de confirmação para ações bem-sucedidas."
    />
    <SystemBanner
      variant="neutral"
      title="Neutro"
      icon={<Bell size={16} />}
      description="Variante neutra para comunicados gerais sem urgência."
    />
  </div>
);

export const SystemBannerCustomRole: Story = () => (
  <div className="p-6 max-w-xl space-y-3">
    <SystemBanner
      variant="info"
      title="Role=status (padrão para info)"
      description="Este banner tem role='status' implícito por ser variante info."
    />
    <SystemBanner
      variant="info"
      role="note"
      title="Role=note (customizado)"
      description="Role sobrescrito para 'note' mesmo sendo variante info."
    />
    <SystemBanner
      variant="warning"
      title="Role=alert (padrão para warning)"
      description="Este banner tem role='alert' implícito por ser variante warning."
    />
  </div>
);

// ---------------------------------------------------------------------------
// ThemeToggle
// ---------------------------------------------------------------------------

export const ThemeToggleDefault: Story = () => (
  <WithTheme>
    <div className="flex items-center gap-4 p-6">
      <ThemeToggle />
      <span className="text-sm text-text-secondary">Variante padrão, tamanho sm</span>
    </div>
  </WithTheme>
);

export const ThemeToggleGhost: Story = () => (
  <WithTheme>
    <div className="flex items-center gap-4 p-6">
      <ThemeToggle variant="ghost" />
      <span className="text-sm text-text-secondary">Variante ghost</span>
    </div>
  </WithTheme>
);

export const ThemeToggleSizes: Story = () => (
  <WithTheme>
    <div className="flex items-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2">
        <ThemeToggle size="sm" />
        <span className="text-xs text-text-secondary">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ThemeToggle size="md" />
        <span className="text-xs text-text-secondary">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ThemeToggle size="lg" />
        <span className="text-xs text-text-secondary">lg</span>
      </div>
    </div>
  </WithTheme>
);

export const ThemeToggleCustomIconSize: Story = () => (
  <WithTheme>
    <div className="flex items-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2">
        <ThemeToggle size="sm" iconSize={14} />
        <span className="text-xs text-text-secondary">ícone 14px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ThemeToggle size="md" iconSize={20} />
        <span className="text-xs text-text-secondary">ícone 20px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ThemeToggle size="lg" iconSize={28} />
        <span className="text-xs text-text-secondary">ícone 28px</span>
      </div>
    </div>
  </WithTheme>
);

export const ThemeToggleAllVariants: Story = () => (
  <WithTheme>
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <ThemeToggle variant="default" size="sm" />
        <span className="text-sm text-text-secondary">default / sm</span>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle variant="default" size="md" />
        <span className="text-sm text-text-secondary">default / md</span>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle variant="default" size="lg" />
        <span className="text-sm text-text-secondary">default / lg</span>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle variant="ghost" size="sm" />
        <span className="text-sm text-text-secondary">ghost / sm</span>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle variant="ghost" size="md" />
        <span className="text-sm text-text-secondary">ghost / md</span>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle variant="ghost" size="lg" />
        <span className="text-sm text-text-secondary">ghost / lg</span>
      </div>
    </div>
  </WithTheme>
);

export const ThemeToggleInHeader: Story = () => (
  <WithRouter>
    <WithTheme>
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <AppShell
          title="Configurações"
          description="Personalize sua experiência"
          actions={<ThemeToggle variant="ghost" size="md" iconSize={20} />}
        >
          <p className="text-text-secondary">
            O ThemeToggle acima está integrado ao header do AppShell como acao.
          </p>
        </AppShell>
      </div>
    </WithTheme>
  </WithRouter>
);

// ---------------------------------------------------------------------------
// Composed / integration stories
// ---------------------------------------------------------------------------

export const ComposedOfflineScenario: Story = () => (
  <WithRouter>
    <div
      style={{ height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}
    >
      <OfflineToast show={true} />
      <AppShell
        title="Rotas do Campus"
        description="Modo offline ativo"
        actions={
          <WithTheme>
            <ThemeToggle variant="ghost" size="sm" />
          </WithTheme>
        }
      >
        <div className="space-y-3">
          <SystemBanner
            variant="warning"
            title="Conexão perdida"
            icon={<AlertTriangle size={16} />}
            description="Você está offline. Exibindo rotas do cache local. Algumas previsões podem estar desatualizadas."
          />
          <DataSourceBanner
            isVisible={true}
            source="source-fallback"
            updatedAt="2024-08-15T11:45:00.000Z"
          />
          <div className="neo-brutal bg-card p-4 rounded">
            <p className="text-text-secondary text-sm">Conteúdo da página em modo offline.</p>
          </div>
        </div>
      </AppShell>
    </div>
  </WithRouter>
);

export const ComposedLoadingScenario: Story = () => (
  <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
    <DataStatusScreen
      title="Carregando rotas..."
      description={
        <div className="space-y-2">
          <p>Conectando ao servidor de previsões da UFMG.</p>
          <p className="text-xs opacity-60">Campus Pampulha — Sistema de Mobilidade</p>
        </div>
      }
    />
  </div>
);

export const ComposedErrorScenario: Story = () => (
  <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
    <DataStatusScreen
      variant="warning"
      title="Não foi possível carregar"
      description={
        <div className="space-y-3">
          <p>O servidor de rotas não está respondendo no momento.</p>
          <button
            type="button"
            className="rounded border border-warning-border px-4 py-2 text-sm font-medium text-warning-text hover:opacity-80 transition-opacity"
          >
            Tentar novamente
          </button>
        </div>
      }
    />
  </div>
);

// ---------------------------------------------------------------------------
// Export order

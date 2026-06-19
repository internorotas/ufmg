/**
 * Stories: UI Primitives 2
 * Dialog, Input, SearchInput, Tabs, SegmentedControl
 */

import type { Story } from '@ladle/react';
import { Eye, EyeOff, Lock, Mail, Phone, Search, User } from 'lucide-react';
import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input, SearchInput } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { StoryContainer } from './StoryContainer';

// ---------------------------------------------------------------------------
// DIALOG
// ---------------------------------------------------------------------------

export const DialogBasic: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <header className="flex items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Título do Modal</Dialog.Title>
            <Dialog.Close />
          </header>
          <div className="p-4">
            <Dialog.Description>
              Este é um modal básico com título, descrição e botão de fechar.
            </Dialog.Description>
          </div>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

export const DialogSizeXs: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="xs">
          <header className="flex items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Modal XS</Dialog.Title>
            <Dialog.Close />
          </header>
          <div className="p-4">
            <Dialog.Description>
              Tamanho extra pequeno para confirmações rápidas.
            </Dialog.Description>
          </div>
          <footer className="flex justify-end gap-2 border-t border-card-border p-4">
            <button
              type="button"
              className="rounded px-4 py-2 text-sm text-text-secondary hover:bg-card-hover"
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded bg-brand-primary px-4 py-2 text-sm text-white hover:opacity-90"
            >
              Confirmar
            </button>
          </footer>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

export const DialogSizeSm: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="sm">
          <header className="flex items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Modal Pequeno</Dialog.Title>
            <Dialog.Close />
          </header>
          <div className="p-4">
            <Dialog.Description>Tamanho pequeno — ideal para alertas simples.</Dialog.Description>
          </div>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

export const DialogSizeMd: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="md">
          <header className="flex items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Modal Médio</Dialog.Title>
            <Dialog.Close />
          </header>
          <div className="p-4">
            <Dialog.Description>
              Tamanho médio — uso geral para formulários compactos.
            </Dialog.Description>
          </div>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

export const DialogSizeLg: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="lg">
          <header className="flex items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Modal Grande</Dialog.Title>
            <Dialog.Close />
          </header>
          <div className="p-4">
            <Dialog.Description>
              Tamanho grande — para formulários com mais campos.
            </Dialog.Description>
          </div>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

export const DialogSizeXl: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="xl">
          <header className="flex items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Modal Extra Grande</Dialog.Title>
            <Dialog.Close />
          </header>
          <div className="p-4">
            <Dialog.Description>Tamanho XL — para conteúdo mais extenso.</Dialog.Description>
          </div>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

export const DialogSize2xl: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="2xl">
          <header className="flex items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Modal 2XL (padrão)</Dialog.Title>
            <Dialog.Close />
          </header>
          <div className="p-4">
            <Dialog.Description>Tamanho padrão — 2xl.</Dialog.Description>
          </div>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

export const DialogSize3xl: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="3xl">
          <header className="flex items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Modal 3XL</Dialog.Title>
            <Dialog.Close />
          </header>
          <div className="p-4">
            <Dialog.Description>Modal de 3XL para tabelas e listagens.</Dialog.Description>
          </div>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

export const DialogSize4xl: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="4xl">
          <header className="flex items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Modal 4XL</Dialog.Title>
            <Dialog.Close />
          </header>
          <div className="p-4">
            <Dialog.Description>Modal extra largo — 4XL.</Dialog.Description>
          </div>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

export const DialogSizeFull: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="full">
          <header className="flex items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Modal Full Width</Dialog.Title>
            <Dialog.Close />
          </header>
          <div className="p-4">
            <Dialog.Description>Modal com largura máxima de 95vw.</Dialog.Description>
          </div>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

export const DialogWithForm: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="md">
          <header className="flex items-center justify-between border-b border-card-border p-4">
            <div>
              <Dialog.Title>Adicionar passageiro</Dialog.Title>
              <Dialog.Description>Preencha os dados do passageiro abaixo.</Dialog.Description>
            </div>
            <Dialog.Close />
          </header>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="nome" className="text-sm font-medium text-text-primary">
                Nome completo
              </label>
              <Input id="nome" placeholder="Ana Beatriz Silva" leftIcon={<User size={16} />} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-text-primary">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="ana@exemplo.com"
                leftIcon={<Mail size={16} />}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="telefone" className="text-sm font-medium text-text-primary">
                Telefone
              </label>
              <Input
                id="telefone"
                type="tel"
                placeholder="(31) 9 0000-0000"
                leftIcon={<Phone size={16} />}
              />
            </div>
          </div>
          <footer className="flex justify-end gap-2 border-t border-card-border p-4">
            <button
              type="button"
              className="rounded px-4 py-2 text-sm text-text-secondary hover:bg-card-hover"
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded bg-brand-primary px-4 py-2 text-sm text-white hover:opacity-90"
            >
              Salvar
            </button>
          </footer>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

export const DialogConfirmationDanger: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="sm">
          <header className="flex items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Excluir rota?</Dialog.Title>
            <Dialog.Close />
          </header>
          <div className="p-4">
            <Dialog.Description>
              Esta ação não pode ser desfeita. A rota <strong>BH → Contagem (08:30)</strong> e todos
              os seus dados serão removidos permanentemente.
            </Dialog.Description>
          </div>
          <footer className="flex justify-end gap-2 border-t border-card-border p-4">
            <button
              type="button"
              className="rounded px-4 py-2 text-sm text-text-secondary hover:bg-card-hover"
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Excluir rota
            </button>
          </footer>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

export const DialogWithScrollableContent: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="md">
          <header className="flex shrink-0 items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Termos de uso</Dialog.Title>
            <Dialog.Close />
          </header>
          <div className="overflow-y-auto p-4">
            {Array.from({ length: 10 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: stable lorem ipsum list
              <p key={`terms-${i}`} className="mb-4 text-sm text-text-secondary">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, nisl
                vel ultricies lacinia, nisl nisl aliquam nisl, nec aliquam nisl nisl sit amet nisl.
                Pellentesque euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, nec
                aliquam nisl nisl sit amet nisl. Seção {i + 1} dos termos de uso do sistema Interno
                Rotas UFMG.
              </p>
            ))}
          </div>
          <footer className="flex shrink-0 justify-end gap-2 border-t border-card-border p-4">
            <button
              type="button"
              className="rounded bg-brand-primary px-4 py-2 text-sm text-white hover:opacity-90"
            >
              Aceitar
            </button>
          </footer>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

export const DialogInteractive: Story = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-center p-8">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-brand-primary px-4 py-2 text-sm text-white hover:opacity-90"
      >
        Abrir modal
      </button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="md">
          <header className="flex items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Modal interativo</Dialog.Title>
            <Dialog.Close />
          </header>
          <div className="p-4">
            <Dialog.Description>
              Feche pelo botão X, clicando no backdrop ou pressionando ESC.
            </Dialog.Description>
          </div>
        </Dialog.Popup>
      </Dialog.Root>
    </div>
  );
};

export const DialogCustomCloseLabel: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="sm">
          <header className="flex items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Modal com label customizado</Dialog.Title>
            <Dialog.Close aria-label="Dispensar modal" />
          </header>
          <div className="p-4">
            <Dialog.Description>O botão de fechar tem aria-label customizado.</Dialog.Description>
          </div>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

export const DialogCloseWithCustomChildren: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="sm">
          <header className="flex items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Close com texto</Dialog.Title>
            <Dialog.Close aria-label="Fechar">Fechar</Dialog.Close>
          </header>
          <div className="p-4">
            <Dialog.Description>
              O Dialog.Close pode receber children customizados.
            </Dialog.Description>
          </div>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

// ---------------------------------------------------------------------------
// INPUT
// ---------------------------------------------------------------------------

export const InputDefault: Story = () => (
  <div className="flex max-w-sm flex-col gap-4 p-4">
    <Input placeholder="Digite algo..." />
  </div>
);

export const InputSizeSm: Story = () => (
  <div className="flex max-w-sm flex-col gap-4 p-4">
    <Input size="sm" placeholder="Tamanho pequeno" />
  </div>
);

export const InputSizeMd: Story = () => (
  <div className="flex max-w-sm flex-col gap-4 p-4">
    <Input size="md" placeholder="Tamanho médio (padrão)" />
  </div>
);

export const InputSizeLg: Story = () => (
  <div className="flex max-w-sm flex-col gap-4 p-4">
    <Input size="lg" placeholder="Tamanho grande" />
  </div>
);

export const InputAllSizes: Story = () => (
  <div className="flex max-w-sm flex-col gap-4 p-4">
    <Input size="sm" placeholder="sm — 32px" />
    <Input size="md" placeholder="md — 40px (padrão)" />
    <Input size="lg" placeholder="lg — 48px" />
  </div>
);

export const InputWithLeftIcon: Story = () => (
  <div className="flex max-w-sm flex-col gap-4 p-4">
    <Input leftIcon={<Search size={16} />} placeholder="Pesquisar rotas..." />
    <Input leftIcon={<Mail size={16} />} placeholder="E-mail" />
    <Input leftIcon={<User size={16} />} placeholder="Nome de usuário" />
    <Input leftIcon={<Phone size={16} />} placeholder="Telefone" />
  </div>
);

export const InputWithRightIcon: Story = () => (
  <div className="flex max-w-sm flex-col gap-4 p-4">
    <Input rightIcon={<Eye size={16} />} type="password" placeholder="Senha" />
    <Input rightIcon={<Mail size={16} />} placeholder="E-mail com ícone à direita" />
  </div>
);

export const InputWithBothIcons: Story = () => (
  <div className="flex max-w-sm flex-col gap-4 p-4">
    <Input
      leftIcon={<Lock size={16} />}
      rightIcon={<Eye size={16} />}
      type="password"
      placeholder="Senha"
    />
    <Input
      leftIcon={<Search size={16} />}
      rightIcon={<User size={16} />}
      placeholder="Buscar usuário"
    />
  </div>
);

export const InputError: Story = () => (
  <div className="flex max-w-sm flex-col gap-4 p-4">
    <Input error placeholder="Campo com erro" />
    <Input error errorMessage="Este campo é obrigatório." placeholder="Nome completo" />
    <Input
      error
      errorMessage="E-mail inválido. Verifique o formato."
      leftIcon={<Mail size={16} />}
      placeholder="E-mail"
    />
  </div>
);

export const InputDisabled: Story = () => (
  <div className="flex max-w-sm flex-col gap-4 p-4">
    <Input disabled placeholder="Campo desabilitado" />
    <Input disabled value="Valor preenchido" readOnly />
    <Input disabled leftIcon={<Search size={16} />} placeholder="Busca desabilitada" />
  </div>
);

export const InputWithValue: Story = () => (
  <div className="flex max-w-sm flex-col gap-4 p-4">
    <Input defaultValue="Ana Beatriz Silva" />
    <Input defaultValue="ana.beatriz@ufmg.br" leftIcon={<Mail size={16} />} />
  </div>
);

export const InputNotFullWidth: Story = () => (
  <div className="p-4">
    <div className="flex gap-2">
      <Input fullWidth={false} placeholder="Não full width" className="w-40" />
      <Input fullWidth={false} placeholder="Outro campo" className="w-40" />
    </div>
  </div>
);

export const InputTypes: Story = () => (
  <div className="flex max-w-sm flex-col gap-4 p-4">
    <Input type="text" placeholder="Texto" />
    <Input type="email" placeholder="E-mail" leftIcon={<Mail size={16} />} />
    <Input
      type="password"
      placeholder="Senha"
      leftIcon={<Lock size={16} />}
      rightIcon={<EyeOff size={16} />}
    />
    <Input type="number" placeholder="Número" />
    <Input type="tel" placeholder="Telefone" leftIcon={<Phone size={16} />} />
    <Input type="date" />
    <Input type="time" />
  </div>
);

// ---------------------------------------------------------------------------
// SEARCH INPUT
// ---------------------------------------------------------------------------

export const SearchInputDefault: Story = () => {
  const [value, setValue] = useState('');
  return (
    <div className="max-w-sm p-4">
      <SearchInput value={value} onValueChange={setValue} placeholder="Pesquisar rotas..." />
    </div>
  );
};

export const SearchInputWithValue: Story = () => {
  const [value, setValue] = useState('Linha 601');
  return (
    <div className="max-w-sm p-4">
      <SearchInput value={value} onValueChange={setValue} placeholder="Pesquisar linhas..." />
    </div>
  );
};

export const SearchInputWithShortcut: Story = () => {
  const [value, setValue] = useState('');
  return (
    <div className="max-w-sm p-4">
      <SearchInput
        value={value}
        onValueChange={setValue}
        placeholder="Pesquisar... (⌘K)"
        shortcut="⌘K"
      />
    </div>
  );
};

export const SearchInputWithShortcutCtrlK: Story = () => {
  const [value, setValue] = useState('');
  return (
    <div className="max-w-sm p-4">
      <SearchInput
        value={value}
        onValueChange={setValue}
        placeholder="Buscar passageiro..."
        shortcut="Ctrl+K"
      />
    </div>
  );
};

export const SearchInputNoClear: Story = () => {
  const [value, setValue] = useState('Belo Horizonte');
  return (
    <div className="max-w-sm p-4">
      <SearchInput
        value={value}
        onValueChange={setValue}
        placeholder="Pesquisar..."
        showClear={false}
      />
    </div>
  );
};

export const SearchInputEmpty: Story = () => (
  <div className="max-w-sm p-4">
    <SearchInput placeholder="Pesquisar veículos..." />
  </div>
);

export const SearchInputWithClearCallback: Story = () => {
  const [value, setValue] = useState('Contagem');
  const [cleared, setCleared] = useState(false);
  return (
    <div className="max-w-sm flex flex-col gap-2 p-4">
      <SearchInput
        value={value}
        onValueChange={setValue}
        onClear={() => setCleared(true)}
        placeholder="Pesquisar destino..."
      />
      {cleared && <p className="text-xs text-text-secondary">Busca limpa pelo botão X.</p>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// TABS
// ---------------------------------------------------------------------------

export const TabsDefault: Story = () => (
  <div className="max-w-lg p-4">
    <Tabs defaultValue="rotas">
      <TabsList>
        <TabsTrigger value="rotas">Rotas</TabsTrigger>
        <TabsTrigger value="veiculos">Veículos</TabsTrigger>
        <TabsTrigger value="motoristas">Motoristas</TabsTrigger>
      </TabsList>
      <TabsContent value="rotas">
        <p className="p-4 text-sm text-text-secondary">Lista de rotas cadastradas no sistema.</p>
      </TabsContent>
      <TabsContent value="veiculos">
        <p className="p-4 text-sm text-text-secondary">Frota de veículos disponíveis.</p>
      </TabsContent>
      <TabsContent value="motoristas">
        <p className="p-4 text-sm text-text-secondary">Motoristas habilitados e escalados.</p>
      </TabsContent>
    </Tabs>
  </div>
);

export const TabsVariantUnderline: Story = () => (
  <div className="max-w-lg p-4">
    <Tabs defaultValue="hoje">
      <TabsList variant="underline">
        <TabsTrigger value="hoje">Hoje</TabsTrigger>
        <TabsTrigger value="semana">Esta semana</TabsTrigger>
        <TabsTrigger value="mes">Este mês</TabsTrigger>
      </TabsList>
      <TabsContent value="hoje">
        <p className="p-4 text-sm text-text-secondary">Viagens agendadas para hoje.</p>
      </TabsContent>
      <TabsContent value="semana">
        <p className="p-4 text-sm text-text-secondary">Viagens da semana atual.</p>
      </TabsContent>
      <TabsContent value="mes">
        <p className="p-4 text-sm text-text-secondary">Viagens do mês corrente.</p>
      </TabsContent>
    </Tabs>
  </div>
);

export const TabsVariantPills: Story = () => (
  <div className="max-w-lg p-4">
    <Tabs defaultValue="ativas">
      <TabsList variant="pills">
        <TabsTrigger value="ativas">Ativas</TabsTrigger>
        <TabsTrigger value="inativas">Inativas</TabsTrigger>
        <TabsTrigger value="todas">Todas</TabsTrigger>
      </TabsList>
      <TabsContent value="ativas">
        <p className="p-4 text-sm text-text-secondary">Rotas atualmente em operação.</p>
      </TabsContent>
      <TabsContent value="inativas">
        <p className="p-4 text-sm text-text-secondary">Rotas fora de operação.</p>
      </TabsContent>
      <TabsContent value="todas">
        <p className="p-4 text-sm text-text-secondary">Todas as rotas cadastradas.</p>
      </TabsContent>
    </Tabs>
  </div>
);

export const TabsNotFullWidth: Story = () => (
  <div className="max-w-lg p-4">
    <Tabs defaultValue="info">
      <TabsList fullWidth={false}>
        <TabsTrigger value="info" fullWidth={false}>
          Informações
        </TabsTrigger>
        <TabsTrigger value="historico" fullWidth={false}>
          Histórico
        </TabsTrigger>
      </TabsList>
      <TabsContent value="info">
        <p className="p-4 text-sm text-text-secondary">Detalhes da rota selecionada.</p>
      </TabsContent>
      <TabsContent value="historico">
        <p className="p-4 text-sm text-text-secondary">Histórico de viagens da rota.</p>
      </TabsContent>
    </Tabs>
  </div>
);

export const TabsWithDisabledTrigger: Story = () => (
  <div className="max-w-lg p-4">
    <Tabs defaultValue="passageiros">
      <TabsList>
        <TabsTrigger value="passageiros">Passageiros</TabsTrigger>
        <TabsTrigger value="relatorios" disabled>
          Relatórios
        </TabsTrigger>
        <TabsTrigger value="configuracoes" disabled>
          Configurações
        </TabsTrigger>
      </TabsList>
      <TabsContent value="passageiros">
        <p className="p-4 text-sm text-text-secondary">Lista de passageiros da rota.</p>
      </TabsContent>
      <TabsContent value="relatorios">
        <p className="p-4 text-sm text-text-secondary">Relatórios gerenciais.</p>
      </TabsContent>
      <TabsContent value="configuracoes">
        <p className="p-4 text-sm text-text-secondary">Configurações avançadas.</p>
      </TabsContent>
    </Tabs>
  </div>
);

export const TabsControlled: Story = () => {
  const [tab, setTab] = useState('linha');
  return (
    <div className="max-w-lg p-4">
      <p className="mb-2 text-xs text-text-secondary">
        Tab ativa: <strong>{tab}</strong>
      </p>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="linha">Linha</TabsTrigger>
          <TabsTrigger value="ponto">Ponto</TabsTrigger>
          <TabsTrigger value="horario">Horário</TabsTrigger>
        </TabsList>
        <TabsContent value="linha">
          <p className="p-4 text-sm text-text-secondary">Detalhes da linha de ônibus.</p>
        </TabsContent>
        <TabsContent value="ponto">
          <p className="p-4 text-sm text-text-secondary">Informações sobre o ponto de embarque.</p>
        </TabsContent>
        <TabsContent value="horario">
          <p className="p-4 text-sm text-text-secondary">Grade horária da linha.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const TabsWithRichContent: Story = () => (
  <div className="max-w-lg p-4">
    <Tabs defaultValue="resumo">
      <TabsList variant="underline">
        <TabsTrigger value="resumo">Resumo</TabsTrigger>
        <TabsTrigger value="passageiros">Passageiros</TabsTrigger>
        <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
      </TabsList>
      <TabsContent value="resumo">
        <div className="grid grid-cols-2 gap-3 p-4">
          {[
            { label: 'Total de viagens', value: '247' },
            { label: 'Passageiros transportados', value: '3.891' },
            { label: 'Km rodados', value: '12.430' },
            { label: 'Ocorrências', value: '3' },
          ].map((item) => (
            <div key={item.label} className="rounded border border-card-border p-3">
              <p className="text-xs text-text-secondary">{item.label}</p>
              <p className="text-2xl font-bold text-text-primary">{item.value}</p>
            </div>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="passageiros">
        <div className="divide-y divide-card-border p-4">
          {['Ana Beatriz Silva', 'Carlos Drummond', 'Maria das Graças', 'João Guimarães'].map(
            (nome) => (
              <div key={nome} className="flex items-center gap-2 py-2">
                <div className="size-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-brand-primary">{nome[0]}</span>
                </div>
                <span className="text-sm text-text-primary">{nome}</span>
              </div>
            ),
          )}
        </div>
      </TabsContent>
      <TabsContent value="ocorrencias">
        <div className="p-4">
          <p className="text-sm text-text-secondary">
            Nenhuma ocorrência registrada neste período.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  </div>
);

export const TabsTwoItems: Story = () => (
  <div className="max-w-xs p-4">
    <Tabs defaultValue="ida">
      <TabsList>
        <TabsTrigger value="ida">Ida</TabsTrigger>
        <TabsTrigger value="volta">Volta</TabsTrigger>
      </TabsList>
      <TabsContent value="ida">
        <p className="p-4 text-sm text-text-secondary">Sentido ida: UFMG → Centro.</p>
      </TabsContent>
      <TabsContent value="volta">
        <p className="p-4 text-sm text-text-secondary">Sentido volta: Centro → UFMG.</p>
      </TabsContent>
    </Tabs>
  </div>
);

export const TabsManyItems: Story = () => (
  <div className="max-w-2xl p-4">
    <Tabs defaultValue="seg">
      <TabsList>
        {[
          { value: 'seg', label: 'Seg' },
          { value: 'ter', label: 'Ter' },
          { value: 'qua', label: 'Qua' },
          { value: 'qui', label: 'Qui' },
          { value: 'sex', label: 'Sex' },
        ].map((d) => (
          <TabsTrigger key={d.value} value={d.value}>
            {d.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {[
        { value: 'seg', label: 'Segunda-feira' },
        { value: 'ter', label: 'Terça-feira' },
        { value: 'qua', label: 'Quarta-feira' },
        { value: 'qui', label: 'Quinta-feira' },
        { value: 'sex', label: 'Sexta-feira' },
      ].map((d) => (
        <TabsContent key={d.value} value={d.value}>
          <p className="p-4 text-sm text-text-secondary">Grade horária de {d.label}.</p>
        </TabsContent>
      ))}
    </Tabs>
  </div>
);

// ---------------------------------------------------------------------------
// SEGMENTED CONTROL
// ---------------------------------------------------------------------------

export const SegmentedControlDefault: Story = () => {
  const [value, setValue] = useState('normal');
  return (
    <div className="max-w-xs p-4">
      <SegmentedControl
        options={[
          { value: 'minimo', label: 'Mínimo' },
          { value: 'normal', label: 'Normal' },
          { value: 'tudo', label: 'Tudo' },
        ]}
        value={value}
        onChange={setValue}
      />
    </div>
  );
};

export const SegmentedControlTwoOptions: Story = () => {
  const [value, setValue] = useState('ida');
  return (
    <div className="max-w-xs p-4">
      <SegmentedControl
        options={[
          { value: 'ida', label: 'Ida' },
          { value: 'volta', label: 'Volta' },
        ]}
        value={value}
        onChange={setValue}
      />
    </div>
  );
};

export const SegmentedControlFourOptions: Story = () => {
  const [value, setValue] = useState('semana');
  return (
    <div className="max-w-sm p-4">
      <SegmentedControl
        options={[
          { value: 'dia', label: 'Dia' },
          { value: 'semana', label: 'Semana' },
          { value: 'mes', label: 'Mês' },
          { value: 'ano', label: 'Ano' },
        ]}
        value={value}
        onChange={setValue}
      />
    </div>
  );
};

export const SegmentedControlDisabled: Story = () => (
  <div className="max-w-xs p-4">
    <SegmentedControl
      options={[
        { value: 'minimo', label: 'Mínimo' },
        { value: 'normal', label: 'Normal' },
        { value: 'tudo', label: 'Tudo' },
      ]}
      value="normal"
      onChange={() => {}}
      disabled
    />
  </div>
);

export const SegmentedControlFirstSelected: Story = () => {
  const [value, setValue] = useState('manhã');
  return (
    <div className="max-w-xs p-4">
      <SegmentedControl
        options={[
          { value: 'manhã', label: 'Manhã' },
          { value: 'tarde', label: 'Tarde' },
          { value: 'noite', label: 'Noite' },
        ]}
        value={value}
        onChange={setValue}
      />
    </div>
  );
};

export const SegmentedControlLastSelected: Story = () => {
  const [value, setValue] = useState('noite');
  return (
    <div className="max-w-xs p-4">
      <SegmentedControl
        options={[
          { value: 'manhã', label: 'Manhã' },
          { value: 'tarde', label: 'Tarde' },
          { value: 'noite', label: 'Noite' },
        ]}
        value={value}
        onChange={setValue}
      />
    </div>
  );
};

export const SegmentedControlWithIcons: Story = () => {
  const [value, setValue] = useState('lista');
  return (
    <div className="max-w-xs p-4">
      <SegmentedControl
        options={[
          {
            value: 'lista',
            label: (
              <span className="flex items-center gap-1">
                <svg
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                Lista
              </span>
            ),
          },
          {
            value: 'grade',
            label: (
              <span className="flex items-center gap-1">
                <svg
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Grade
              </span>
            ),
          },
        ]}
        value={value}
        onChange={setValue}
      />
    </div>
  );
};

export const SegmentedControlCustomClassName: Story = () => {
  const [value, setValue] = useState('entrada');
  return (
    <div className="max-w-xs p-4">
      <SegmentedControl
        options={[
          { value: 'entrada', label: 'Entrada' },
          { value: 'saida', label: 'Saída' },
        ]}
        value={value}
        onChange={setValue}
        className="max-w-[160px]"
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// COMBINED / COMPOSITION
// ---------------------------------------------------------------------------

export const CompositionFilterBar: Story = () => {
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('semana');
  const [tab, setTab] = useState('todas');

  return (
    <div className="max-w-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Pesquisar rotas..."
            shortcut="⌘K"
          />
        </div>
        <SegmentedControl
          options={[
            { value: 'dia', label: 'Dia' },
            { value: 'semana', label: 'Semana' },
            { value: 'mes', label: 'Mês' },
          ]}
          value={period}
          onChange={setPeriod}
          className="w-auto shrink-0"
        />
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="underline" fullWidth={false}>
          <TabsTrigger value="todas" fullWidth={false}>
            Todas
          </TabsTrigger>
          <TabsTrigger value="ativas" fullWidth={false}>
            Ativas
          </TabsTrigger>
          <TabsTrigger value="inativas" fullWidth={false}>
            Inativas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="todas">
          <p className="p-4 text-sm text-text-secondary">
            {search ? `Resultados para "${search}" — período: ${period}` : 'Todas as rotas.'}
          </p>
        </TabsContent>
        <TabsContent value="ativas">
          <p className="p-4 text-sm text-text-secondary">Rotas ativas.</p>
        </TabsContent>
        <TabsContent value="inativas">
          <p className="p-4 text-sm text-text-secondary">Rotas inativas.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const CompositionDialogWithTabs: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Backdrop />
        <Dialog.Popup size="lg">
          <header className="flex shrink-0 items-center justify-between border-b border-card-border p-4">
            <Dialog.Title>Detalhes da rota 601</Dialog.Title>
            <Dialog.Close />
          </header>
          <div className="p-4">
            <Tabs defaultValue="info">
              <TabsList variant="underline">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="passageiros">Passageiros</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>
              <TabsContent value="info">
                <div className="flex flex-col gap-3 py-4">
                  <div>
                    <p className="text-xs text-text-secondary">Origem</p>
                    <p className="text-sm font-medium text-text-primary">UFMG — Pampulha</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Destino</p>
                    <p className="text-sm font-medium text-text-primary">Centro — Praça Sete</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Horário</p>
                    <p className="text-sm font-medium text-text-primary">07:30 — 08:15</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="passageiros">
                <p className="py-4 text-sm text-text-secondary">32 passageiros cadastrados.</p>
              </TabsContent>
              <TabsContent value="historico">
                <p className="py-4 text-sm text-text-secondary">Nenhuma ocorrência recente.</p>
              </TabsContent>
            </Tabs>
          </div>
        </Dialog.Popup>
      </Dialog.Root>
    )}
  </StoryContainer>
);

// ---------------------------------------------------------------------------
// Named exports order for grouping

# 🚌 Interno Rotas - Melhorias Implementadas

## 📋 Resumo das Melhorias

Este documento descreve as melhorias implementadas no aplicativo de visualização de rotas de ônibus da UFMG, focando em experiência do usuário, responsividade mobile-first e boas práticas de código.

---

## 🎯 Tecnologias Utilizadas

- **React 19** com TypeScript
- **Tailwind CSS 4** para estilização
- **Leaflet.js + React-Leaflet** para mapas interativos
- **Leaflet Ant Path** para animação de rotas
- **React Icons (io5)** para ícones modernos
- **React GA4** para analytics
- **Vite** como build tool

---

## ✨ Funcionalidades Implementadas

### 1. **Sistema de Modais Reutilizáveis**

- Componente `Modal.tsx` base para toda a aplicação
- Suporte para fechamento com `ESC`
- Backdrop com blur
- Animações suaves de entrada/saída
- Bloqueio de scroll do body quando aberto

### 2. **Modal de Horários (HorariosModal)**

✅ **Diferenciação Visual**:

- Horários futuros: destaque em verde com borda
- Horários passados: cinza com opacidade reduzida
- Layout em grid responsivo
- Contador de horários totais e restantes

### 3. **Modal de Itinerário (ItinerarioModal)**

✅ **Interatividade com Mapa**:

- Lista numerada de paradas
- Cada parada é clicável
- Ao clicar: fecha o modal e centraliza o mapa na parada
- Marcador da parada é destacado por 3 segundos
- Ícones e informações detalhadas

### 4. **Card de Linha Aprimorado (LinhaOnibus)**

✅ **Novo Layout**:

- Informação de "Último Partiu" e "Próximo" horário
- Botões com ícones:
  - 🗺️ **Itinerário**: Abre modal com lista de paradas
  - ⏰ **Mais Horários**: Abre modal com todos os horários
- Cores personalizadas por linha
- Animações de hover

### 5. **Menu Lateral com Tabs Dinâmicas**

✅ **Navegação por Categoria**:

- Tabs para "Dias Úteis", "Sábado" e "Férias/Recessos"
- Filtro dinâmico de linhas ao trocar de tab
- Barra de pesquisa funcional
- Destaque visual da tab ativa
- Menu hambúrguer no mobile

### 6. **Popup Customizado para Paradas**

✅ **Informações Detalhadas**:

- Nome e categoria da parada
- Lista de todas as linhas que passam
- Tags com cores para cada linha
- Ícones visuais (localização, ônibus)
- Estilização consistente com o tema

### 7. **Mapa Interativo Aprimorado**

✅ **Funcionalidades**:

- Centralização automática ao selecionar parada
- Marcador destacado com animação pulse
- Zoom automático na rota selecionada
- Popup aberto automaticamente
- Suporte a `forwardRef` para controle externo

### 8. **Sistema de Estado Global**

✅ **Gerenciamento**:

- Estado de linha selecionada
- Estado de parada selecionada
- Comunicação entre componentes via callbacks
- Integração com Google Analytics

---

## 🎨 Melhorias de UX/UI

### Mobile-First

- Menu lateral se transforma em hambúrguer
- Botão flutuante para abrir menu
- Backdrop escuro ao abrir menu
- Touch-friendly (botões grandes)
- Scroll otimizado

### Animações

- Fade in/out para modais
- Slide up para conteúdo
- Pulse para marcadores destacados
- Transições suaves entre tabs
- Hover states em todos os botões

### Acessibilidade

- Aria-labels nos botões
- Fechamento de modais com ESC
- Contraste de cores adequado
- Foco visível em elementos interativos

---

## 📁 Estrutura de Componentes

```
app/src/components/
├── Modal.tsx                 # Modal base reutilizável
├── HorariosModal.tsx        # Modal de horários
├── ItinerarioModal.tsx      # Modal de itinerário
├── LinhaOnibus.tsx          # Card de linha refatorado
├── MenuLateral.tsx          # Menu com tabs dinâmicas
├── PopupCustomizado.tsx     # Popup do mapa
├── Mapa.tsx                 # Mapa com ref e interatividade
└── AntPathComponent.tsx     # Animação de rotas
```

---

## 🔧 Como Usar

### Executar em Desenvolvimento

```bash
cd app
npm install
npm run dev
```

### Build para Produção

```bash
npm run build
```

### Deploy

```bash
npm run deploy
```

---

## 🎯 Boas Práticas Implementadas

1. **Componentização**: Cada funcionalidade em um componente isolado
2. **TypeScript**: Tipagem forte em todos os componentes
3. **React Hooks**: useState, useMemo, useRef, useImperativeHandle
4. **Performance**: Memoização de dados pesados
5. **Código Limpo**: Nomes descritivos, comentários quando necessário
6. **Responsividade**: Mobile-first com breakpoints do Tailwind
7. **Analytics**: Rastreamento de eventos importantes

---

## 📊 Métricas de Sucesso

- ✅ Layout 100% responsivo
- ✅ Todos os modais funcionais
- ✅ Interação mapa-itinerário implementada
- ✅ Filtros dinâmicos por categoria
- ✅ Popup customizado com informações
- ✅ Animações e transições suaves
- ✅ Código limpo e manutenível

---

## 🚀 Próximas Melhorias Sugeridas

1. Adicionar modo escuro/claro
2. Salvar preferências no localStorage
3. Adicionar favoritos de linhas
4. Notificações push para próximos horários
5. Compartilhamento de rotas via link
6. Filtro de acessibilidade (linhas com elevador)
7. Estimativa de tempo de chegada em tempo real

---

## 👨‍💻 Desenvolvido por

Igor Martins

- GitHub: [@igormartins4](https://github.com/igormartins4)

---

## 📝 Notas Técnicas

- O projeto usa Tailwind CSS 4 com o novo sistema de `@theme`
- O warning sobre `@theme` no CSS é esperado e não afeta a funcionalidade
- Os dados são importados de arquivos estáticos (linhas.ts, dadosRotas.ts)
- O Google Analytics é opcional via variável de ambiente

---

**Última atualização**: 13 de Outubro de 2025

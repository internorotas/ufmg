<div align="center">

# 🚌 Interno Rotas - UFMG

![Logo Interno Rotas](.github/README/branding/capa-mapa.png)

### Navegue pelo Campus Pampulha com facilidade

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/github/license/internorotas/ufmg?style=flat-square)](https://github.com/internorotas/ufmg/blob/main/LICENSE)
[![Repo Size](https://img.shields.io/github/repo-size/internorotas/ufmg?style=flat-square)](https://github.com/internorotas/ufmg)

**[🌐 Acessar Aplicação](https://internorotas.github.io/ufmg/)** ·
**[🐛 Reportar Bug](https://forms.gle/5e9MHq9pp1p8T5Px5)** ·
**[💡 Sugerir Feature](https://github.com/internorotas/ufmg/issues)**

</div>

---

## 📖 Sobre o Projeto

O **Interno Rotas** é uma aplicação web moderna e interativa para consulta de horários e rotas dos ônibus internos do Campus Pampulha da UFMG. Desenvolvido com foco em **experiência do usuário**, **acessibilidade** e **performance**, o projeto transforma informações fragmentadas em uma interface intuitiva e visualmente clara.

### 🎯 O Problema

O site oficial da UFMG disponibiliza informações sobre o transporte interno, porém:

- 📍 Utiliza apenas **siglas de localização**, dificultando a orientação de novos usuários
- 🖥️ Interface **pouco intuitiva** e não responsiva
- 🗺️ **Ausência de visualização geográfica** das rotas
- ⏰ Difícil identificar **qual linha pegar** para chegar a um destino específico

### 💡 A Solução

|        Funcionalidade        | Descrição                                                 |
| :--------------------------: | :-------------------------------------------------------- |
|    🗺️ **Mapa Interativo**     | Visualização geográfica completa do campus com zoom e pan |
|     🎨 **Rotas Animadas**     | Cada linha com cor única e animação de trajeto            |
| ⏱️ **Horários em Tempo Real** | Próximo ônibus e último que passou                        |
|    📱 **100% Responsivo**     | Otimizado para mobile, tablet e desktop                   |
|      🌙 **Tema Escuro**       | Suporte a dark mode nativo                                |
|   🔍 **Busca Inteligente**    | Encontre linhas rapidamente                               |

---

## ✨ Funcionalidades

<table>
<tr>
<td width="50%">

### 🗺️ Mapa & Rotas

- ✅ Mapa interativo com OpenStreetMap
- ✅ Rotas animadas com Leaflet Ant Path
- ✅ Marcadores de paradas clicáveis
- ✅ Popup com detalhes de cada parada
- ✅ Centralização automática na rota selecionada

</td>
<td width="50%">

### 📊 Horários & Informações

- ✅ Horários em tempo real
- ✅ Grade completa de horários
- ✅ Categorias: Dias Úteis, Sábados, Férias
- ✅ Indicador de próximo ônibus
- ✅ Aviso de período de férias/recesso

</td>
</tr>
<tr>
<td width="50%">

### 🎨 Interface & UX

- ✅ Design System completo
- ✅ Tema claro/escuro automático
- ✅ Animações suaves e transições
- ✅ Componentes acessíveis (ARIA)
- ✅ Feedback visual em interações

</td>
<td width="50%">

### 📱 Mobile & Performance

- ✅ Layout responsivo mobile-first
- ✅ Menu lateral adaptativo
- ✅ Touch-friendly interactions
- ✅ Performance otimizada
- ✅ Carregamento rápido

</td>
</tr>
</table>

---

## 🎨 Screenshots

### 🖥️ Desktop

<div align="center">

|                            Tela Inicial                            |                            Linha Selecionada                            |                              Grade de Horários                              |
| :----------------------------------------------------------------: | :---------------------------------------------------------------------: | :-------------------------------------------------------------------------: |
| ![Desktop Inicial](.github/README/screenshots/desktop/inicial.png) | ![Desktop Linha](.github/README/screenshots/desktop/escolher-linha.png) | ![Desktop Horários](.github/README/screenshots/desktop/exibir-horarios.png) |

</div>

### 📱 Mobile

<div align="center">

|                           Tela Inicial                           |                             Menu Lateral                             |                             Detalhes da Linha                             |
| :--------------------------------------------------------------: | :------------------------------------------------------------------: | :-----------------------------------------------------------------------: |
| ![Mobile Inicial](.github/README/screenshots/mobile/inicial.png) | ![Mobile Menu](.github/README/screenshots/mobile/escolher-linha.png) | ![Mobile Horários](.github/README/screenshots/mobile/exibir-horarios.png) |

</div>

---

## 🛠️ Stack Tecnológica

### ⚛️ Frontend Core

|                                                   Tecnologia                                                    | Versão | Descrição                                          |
| :-------------------------------------------------------------------------------------------------------------: | :----: | :------------------------------------------------- |
|        ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)         |  19.x  | Framework UI com novos recursos (use, ref as prop) |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) |  5.9   | Tipagem estática e IntelliSense                    |
|          ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)          |  7.3   | Build tool ultrarrápido com HMR                    |

### 🎨 Estilização

|                                                  Tecnologia                                                   | Versão | Descrição                          |
| :-----------------------------------------------------------------------------------------------------------: | :----: | :--------------------------------- |
| ![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) |  4.x   | CSS utility-first com @theme       |
|        ![tailwind-variants](https://img.shields.io/badge/tailwind--variants-purple?style=flat-square)         |  3.x   | Variantes de componentes type-safe |
|                    ![Lucide](https://img.shields.io/badge/Lucide-F56565?style=flat-square)                    | 0.563  | Ícones modernos e consistentes     |

### 🗺️ Mapas & Visualização

|                                                        Tecnologia                                                        | Descrição                              |
| :----------------------------------------------------------------------------------------------------------------------: | :------------------------------------- |
|          ![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white)          | Biblioteca de mapas interativos        |
| ![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-7EBC6F?style=flat-square&logo=openstreetmap&logoColor=white) | Tiles de mapa open source              |
|                                                   **Leaflet Ant Path**                                                   | Animação de rotas com efeito "formiga" |

### 📦 Outras Dependências

- **@base-ui/react** - Componentes headless acessíveis
- **react-ga4** - Google Analytics 4 integration
- **date-fns** - Manipulação de datas
- **use-debounce** - Hooks de debounce

---

## 🏗️ Arquitetura

```bash
app/
├── src/
│   ├── components/          # Componentes React
│   │   ├── ui/              # Design System (Button, Card, Badge, Dialog...)
│   │   └── map/             # Componentes do mapa (MapMarkers, MapRoute...)
│   ├── contexts/            # Context API (RotasContext, ThemeContext)
│   ├── hooks/               # Custom hooks (useAnalytics, useLinhasFilter)
│   ├── services/            # Camada de serviços (RotasService)
│   ├── data/                # Dados estáticos (linhas, paradas)
│   ├── types/               # TypeScript types
│   └── config/              # Configurações (specialPeriods)
├── public/                  # Assets estáticos
└── docs/                    # Documentação técnica
```

### 🎯 Design Patterns Utilizados

- **Compound Components** - Dialog, Tabs, Card
- **Context API** - Estado global sem prop drilling
- **Custom Hooks** - Lógica reutilizável
- **Service Layer** - Abstração de dados
- **Composition** - Componentes flexíveis e extensíveis

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** 18+
- **pnpm** 8+ (recomendado) ou npm/yarn

### Instalação

```bash

# Clone o repositório

git clone https://github.com/internorotas/ufmg.git
cd ufmg/app

# Instale as dependências

pnpm install

# Inicie o servidor de desenvolvimento

pnpm dev

# Acesse http://localhost:5173/ufmg/

```

### Scripts Disponíveis

|     Comando      | Descrição                            |
| :--------------: | :----------------------------------- |
|   \`pnpm dev\`   | Inicia o servidor de desenvolvimento |
|  \`pnpm build\`  | Gera build de produção               |
| \`pnpm preview\` | Preview do build local               |
|  \`pnpm lint\`   | Executa ESLint                       |
| \`pnpm format\`  | Formata código com Prettier          |

---

## 🤝 Contribuindo

Contribuições são **muito bem-vindas**! Este é um projeto open source feito para a comunidade.

### Como Contribuir

1. **Fork** o repositório
2. Crie uma **branch** para sua feature
   \`\`\`bash
   git checkout -b feature/minha-feature
   \`\`\`
3. **Commit** suas mudanças seguindo [Conventional Commits](https://www.conventionalcommits.org/)
   \`\`\`bash
   git commit -m "feat: adiciona nova funcionalidade"
   \`\`\`
4. **Push** para sua branch
   \`\`\`bash
   git push origin feature/minha-feature
   \`\`\`
5. Abra um **Pull Request**

### Tipos de Commit

|     Tipo     | Descrição                          |
| :----------: | :--------------------------------- |
|   \`feat\`   | Nova funcionalidade                |
|   \`fix\`    | Correção de bug                    |
|   \`docs\`   | Documentação                       |
|  \`style\`   | Formatação (sem mudança de lógica) |
| \`refactor\` | Refatoração de código              |
|   \`perf\`   | Melhoria de performance            |
|   \`test\`   | Adição/correção de testes          |
|  \`chore\`   | Tarefas de manutenção              |

### 💡 Ideias para Contribuir

- 🐛 Reportar bugs encontrados
- 💡 Sugerir novas funcionalidades
- 📝 Melhorar documentação
- ♿ Aprimorar acessibilidade
- 🌍 Adicionar internacionalização
- 🎓 Adaptar para outras universidades

---

## 🗺️ Roadmap

- [ ] **PWA** - Modo offline e instalação
- [ ] **Notificações** - Alertas de horários favoritos
- [ ] **Geolocalização** - Parada mais próxima do usuário
- [ ] **API Pública** - Endpoints para desenvolvedores
- [ ] **Calendário Acadêmico** - Integração automática de férias
- [ ] **Outros Campi** - Expansão para unidades fora do Pampulha

---

## 📄 Licença

Distribuído sob a licença **MIT**. Veja [LICENSE](LICENSE) para mais informações.

---

<div align="center">

### 💙 Desenvolvido com carinho por [Igor Martins](https://github.com/igormartins4)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/igormartins44/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/igormartins4)

---

**⭐ Se este projeto foi útil, considere dar uma estrela!**

[![Star History Chart](https://api.star-history.com/svg?repos=internorotas/ufmg&type=Date)](https://star-history.com/#internorotas/ufmg&Date)

</div>

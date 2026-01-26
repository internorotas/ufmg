# 🎨 Guia Completo do Sistema de Temas

## 📍 Onde o Usuário Alterna o Tema

O botão de alternância de tema está localizado no **header da sidebar** (barra lateral), ao lado do logo "Interno Rotas".

### Como Usar

1. Clique no ícone ☀️ (sol) para mudar para o **tema claro**
2. Clique no ícone 🌙 (lua) para mudar para o **tema escuro**
3. A preferência é **automaticamente salva** no navegador e persiste entre sessões

---

## 🎨 Como Personalizar as Cores do Tema

As cores do tema são definidas através de **variáveis CSS** no arquivo:

```
app/src/globals.css
```

### Estrutura das Variáveis

```css
:root {
  /* 🌞 TEMA CLARO */
  --background: #ffffff; /* Cor de fundo principal */
  --background-secondary: #f9fafb; /* Cor de fundo secundária */
  --text-primary: #111827; /* Cor do texto principal */
  --text-secondary: #6b7280; /* Cor do texto secundário */
  --card-background: #ffffff; /* Cor de fundo dos cards */
  --card-border: #e5e7eb; /* Cor da borda dos cards */
  --sidebar-background: #f3f4f6; /* Cor de fundo da sidebar */
  --modal-background: #ffffff; /* Cor de fundo dos modais */
  --input-background: #f9fafb; /* Cor de fundo dos inputs */
}

.dark {
  /* 🌙 TEMA ESCURO */
  --background: #111827; /* Cor de fundo principal */
  --background-secondary: #1f2937; /* Cor de fundo secundária */
  --text-primary: #f9fafb; /* Cor do texto principal */
  --text-secondary: #9ca3af; /* Cor do texto secundário */
  --card-background: #1f2937; /* Cor de fundo dos cards */
  --card-border: #374151; /* Cor da borda dos cards */
  --sidebar-background: #1a1819; /* Cor de fundo da sidebar */
  --modal-background: #1f2937; /* Cor de fundo dos modais */
  --input-background: #374151; /* Cor de fundo dos inputs */
}
```

### 🎯 Como Alterar Uma Cor

#### Exemplo: Mudar a cor de fundo do tema escuro

1. Abra o arquivo `app/src/globals.css`
1. Localize a seção `.dark { ... }`
1. Altere a variável desejada:

```css
.dark {
  --background: #0d1117; /* Novo tom de preto mais escuro */
  /* ... demais variáveis ... */
}
```

4. Salve o arquivo
5. O HMR do Vite atualizará automaticamente a interface! ⚡

---

## 🚀 Como as Cores São Aplicadas nos Componentes

As variáveis CSS são usadas através da função `var()` do CSS ou através do Tailwind:

### Exemplo 1: CSS Puro

```css
.meu-componente {
  background-color: var(--card-background);
  color: var(--text-primary);
  border-color: var(--card-border);
}
```

### Exemplo 2: Tailwind CSS (Configurado)

```jsx
<div className="bg-card text-text-primary border border-card-border">
  Meu conteúdo
</div>
```

---

## 🔧 Cores Fixas da Marca

Algumas cores são **fixas** e não mudam com o tema:

```css
--color-internoRotas-azul-eletrico: #2c0eeb;
--color-internoRotas-bege-areia: #ecdcc4;
--color-internoRotas-laranja-ambar: #ffa400;
--color-internoRotas-preto-carvao: #1a1819;
--color-internoRotas-cinza-grafite: #3a3b3c;
```

Essas cores são usadas para:

- Cores das linhas de ônibus (dinâmicas via `linha.corHex`)
- Botões de ação
- Elementos de destaque

---

## 📁 Arquivos Relacionados ao Sistema de Temas

```
app/
├── src/
│   ├── globals.css                    # ⭐ Variáveis de cores do tema
│   ├── contexts/
│   │   └── ThemeContext.tsx           # Contexto React do tema
│   ├── components/
│   │   ├── ThemeToggle.tsx            # Botão de alternância
│   │   └── MenuLateral.tsx            # Sidebar (contém o ThemeToggle)
│   └── App.tsx                        # ThemeProvider wrapper
└── tailwind.config.ts                 # Configuração do Tailwind
```

---

## 💡 Dicas Avançadas

### 1. Adicionar Nova Variável de Cor

```css
:root {
  --minha-nova-cor: #ff5733;
}

.dark {
  --minha-nova-cor: #c70039;
}
```

### 2. Usar no Tailwind (editar `tailwind.config.ts`)

```ts
export default {
  theme: {
    extend: {
      colors: {
        "minha-cor": "var(--minha-nova-cor)",
      },
    },
  },
};
```

### 3. Usar no Componente

```jsx
<div className="bg-[var(--minha-nova-cor)]">Teste</div>
```

---

## 🐛 Troubleshooting

### Problema: Cores não mudam ao alternar tema

**Solução**: Certifique-se de que o componente está dentro do `ThemeProvider` no `App.tsx`

### Problema: Cor não aparece corretamente

**Solução**: Verifique se a variável CSS está definida em ambos os modos (`:root` e `.dark`)

### Problema: Botão de tema não aparece

**Solução**: Verifique se o `ThemeToggle` está importado e renderizado no `MenuLateral.tsx`

---

## 📊 Fluxo Técnico

```
Usuário clica no ThemeToggle
         ↓
ThemeContext atualiza o estado
         ↓
localStorage.setItem('theme', novoTema)
         ↓
document.documentElement.classList (add/remove 'dark')
         ↓
CSS aplica variáveis do .dark ou :root
         ↓
Interface atualiza automaticamente! ✨
```

---

## ✅ Checklist de Personalização

- [ ] Escolhi as cores para o tema claro em `:root`
- [ ] Escolhi as cores para o tema escuro em `.dark`
- [ ] Testei a alternância entre temas
- [ ] Verifiquei se todos os componentes respondem ao tema
- [ ] Confirmei que a preferência persiste no localStorage
- [ ] Validei a legibilidade das cores (contraste)

---

**Desenvolvido com 💙 para o Interno Rotas UFMG**

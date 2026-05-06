# Frontend Interno Rotas (app)

## Execução local recomendada

Este app roda com base pública `/ufmg/` e consome a API via proxy `/v1` no Vite.

Portas padrão de desenvolvimento:

- Frontend: `5173`
- Backend: `43111`

Da raiz do monorepo:

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\dev-up.ps1
```

Para validar conexão frontend -> backend:

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\dev-check.ps1
```

O checker detecta automaticamente se o frontend/backend estão respondendo em `localhost` ou `127.0.0.1`.

## Variáveis de ambiente

Arquivo: `frontend/app/.env.example`

- `VITE_API_URL=http://localhost:43111`
- `VITE_API_VERSION=v1`

`VITE_API_VERSION` é comparada com o header `X-API-Version` da API.
Se houver incompatibilidade, o app dispara atualização de Service Worker e recarrega automaticamente com guard anti-loop.

## Troubleshooting

### Erro `502 Bad Gateway` em `http://localhost:5173/v1/linhas`

Significa que o proxy do Vite não alcançou o backend.

Checklist rápido:

1. Backend ativo em `43111`.
2. Health-check respondendo `200`:

```bash
Invoke-WebRequest http://127.0.0.1:43111/v1/health -UseBasicParsing
```

3. Proxy do frontend respondendo `200`:

```bash
Invoke-WebRequest http://localhost:5173/v1/linhas -UseBasicParsing
```

Se necessário, reinicie frontend e backend usando `scripts/dev-up.ps1`.

## Conteúdo legal no fluxo principal

Sobre, Privacidade e Termos agora abrem em modal no próprio app, sem navegação para outra página.

- Abertura via botões no rodapé lateral.
- Modal com foco trap + ESC + botão explícito de fechar (ícone `X`).
- Link do onboarding para privacidade também abre modal.

## Ajustes mobile (2026-05-06)

- Footer lateral em mobile ajustado para grid `2x2`, evitando vazamento horizontal.
- Tabs de categoria com labels longas agora quebram linha de forma controlada (sem corte).
- Sidebar com `overflow` horizontal bloqueado para evitar conteúdo fora do container.

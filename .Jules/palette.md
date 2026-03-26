## 2025-02-18 - Acessibilidade em Botões Assíncronos Dinâmicos
**Learning:** Dynamic async buttons (like the GPS locate button in `ControlesUsuarioMapa.tsx`) require `aria-busy` and dynamically updated `aria-label`/`title` attributes to properly inform screen readers and sighted users of their pending loading state.
**Action:** Always ensure buttons that trigger asynchronous actions not only visually show a loading state but also update their accessibility attributes (`aria-busy`, `aria-label`) while processing.

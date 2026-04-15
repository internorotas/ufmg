## 2026-04-15 - Consistent Async Button Feedback
**Learning:** Replacing native buttons that only show text changes (e.g., 'Aguardando...') with standard design system `Button` components that show animated spinners provides a much clearer, more consistent loading state for async operations like requesting notification permissions. This enhances both UX and accessibility by standardizing `aria-busy` behavior.
**Action:** Always prefer using the design system's `Button` with the `loading` prop for any async actions instead of manually manipulating native `<button>` text and `aria-busy` states.

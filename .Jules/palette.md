## 2025-02-18 - ARIA Tab Pattern in React Modals
**Learning:** When implementing ARIA Tab Pattern in simple React components without focus management libraries, sticking to native button focus behavior (Tab key) is safer than manually managing `tabIndex` (-1/0) if you don't implement full arrow key navigation. Setting inactive tabs to `tabIndex={-1}` without arrow key handlers makes them inaccessible to keyboard users.
**Action:** Always verify keyboard navigation after adding ARIA roles; if full roving tabindex is too complex for a micro-fix, rely on standard button navigation and just use ARIA attributes for semantics.
## 2024-05-22 - LineCard Accessibility & Testing
**Learning:** `LineCard` components were interactive via `onClick` but inaccessible to keyboard users. Using `role="button"`, `tabIndex={0}`, and `onKeyDown` on the `article` element restores access. Also, Playwright tests must respect the `base` path defined in `vite.config.ts` (`/ufmg/`) to avoid 404s/connection refused on navigation.
**Action:** Always add keyboard handlers to interactive non-button elements and verify test URLs against Vite config.
## 2024-03-01 - Keyboard Accessibility for Interactive Cards

**Learning:** Interactive UI cards (e.g., `<article>` in `LineCard.tsx` and schedule cards in `HorariosModal.tsx`) that contain nested interactive elements (like buttons) cannot safely use `role="button"` due to invalid HTML nesting rules, yet they are still primary targets for user interaction. Without explicit keyboard support (`tabIndex={0}`, `onKeyDown` handlers for Enter/Space, and visible focus states), keyboard users cannot interact with the main function of the card.
**Action:** Always implement explicit keyboard accessibility (`tabIndex={0}`, `onKeyDown`, `aria-label`, and `focus-visible` styles) on interactive container elements that cannot use standard button roles, ensuring the core interaction path is available to all users.

## 2025-03-05 - Keyboard Accessibility for Schedule Cards
**Learning:** Schedule cards in `LinhaDetalhesModal` and `HorariosModal` were interactive (had `onClick`) but lacked keyboard accessibility. Adding `tabIndex={0}`, `role="button"`, `aria-label`, and `onKeyDown` ensures users navigating via keyboard can select schedules.
**Action:** Always verify interactive elements (e.g. `div`s with `onClick`) have equivalent keyboard event handlers, roles, and focusability to maintain accessibility.

## 2025-03-09 - Remove interactive attributes from informational elements
**Learning:** Adding interactive attributes like `tabIndex={0}`, `role="button"`, or `aria-label` to purely static, informational elements (like schedule cards) creates an accessibility anti-pattern. Screen readers may misinterpret these elements as actionable when they are not.
**Action:** When designing or refactoring UI components, only apply interactive attributes to elements that actually support user interaction (e.g., clickable links, buttons, form inputs). Ensure static read-only data is accessible without artificial interactive wrappers.

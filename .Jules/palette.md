## 2025-02-18 - ARIA Tab Pattern in React Modals
**Learning:** When implementing ARIA Tab Pattern in simple React components without focus management libraries, sticking to native button focus behavior (Tab key) is safer than manually managing `tabIndex` (-1/0) if you don't implement full arrow key navigation. Setting inactive tabs to `tabIndex={-1}` without arrow key handlers makes them inaccessible to keyboard users.
**Action:** Always verify keyboard navigation after adding ARIA roles; if full roving tabindex is too complex for a micro-fix, rely on standard button navigation and just use ARIA attributes for semantics.
## 2024-05-22 - LineCard Accessibility & Testing
**Learning:** `LineCard` components were interactive via `onClick` but inaccessible to keyboard users. Using `role="button"`, `tabIndex={0}`, and `onKeyDown` on the `article` element restores access. Also, Playwright tests must respect the `base` path defined in `vite.config.ts` (`/ufmg/`) to avoid 404s/connection refused on navigation.
**Action:** Always add keyboard handlers to interactive non-button elements and verify test URLs against Vite config.
## 2024-03-01 - Keyboard Accessibility for Interactive Cards

**Learning:** Interactive UI cards (e.g., `<article>` in `LineCard.tsx` and schedule cards in `HorariosModal.tsx`) that contain nested interactive elements (like buttons) cannot safely use `role="button"` due to invalid HTML nesting rules, yet they are still primary targets for user interaction. Without explicit keyboard support (`tabIndex={0}`, `onKeyDown` handlers for Enter/Space, and visible focus states), keyboard users cannot interact with the main function of the card.
**Action:** Always implement explicit keyboard accessibility (`tabIndex={0}`, `onKeyDown`, `aria-label`, and `focus-visible` styles) on interactive container elements that cannot use standard button roles, ensuring the core interaction path is available to all users.

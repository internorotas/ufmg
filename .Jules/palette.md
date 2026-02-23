## 2024-05-22 - LineCard Accessibility & Testing
**Learning:** `LineCard` components were interactive via `onClick` but inaccessible to keyboard users. Using `role="button"`, `tabIndex={0}`, and `onKeyDown` on the `article` element restores access. Also, Playwright tests must respect the `base` path defined in `vite.config.ts` (`/ufmg/`) to avoid 404s/connection refused on navigation.
**Action:** Always add keyboard handlers to interactive non-button elements and verify test URLs against Vite config.

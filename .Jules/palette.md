## 2026-03-24 - Interactive Cards with Nested Buttons
**Learning:** Adding `role="button"` to an entire card component that contains nested interactive elements (like an internal button) creates invalid, inaccessible HTML. However, without it, native keyboard focus (Tab) cannot reach the card's `onKeyDown` handler.
**Action:** Use `tabIndex={0}` on the card container to make it focusable without declaring a conflicting `role`, and suppress lint warnings (e.g., `noNoninteractiveTabindex`) with clear documentation explaining the nested interactive elements constraint.

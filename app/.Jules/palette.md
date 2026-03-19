## 2024-03-01 - UX Initialization

**Learning:** Found the main interface elements and established baseline for palette improvements.
**Action:** Always test components for ARIA labels and keyboard accessibility.

## 2024-03-01 - Interactive Card Keyboard Accessibility

**Learning:** Found that custom `<article>` based clickable cards (`LineCard`) did not support keyboard interactions natively because adding `role="button"` was invalid HTML nesting due to inner buttons ("Ver Detalhes").
**Action:** Implemented `tabIndex={0}`, `aria-label`, and `onKeyDown` handlers on the container instead of `role="button"` to allow Enter/Space interactions while maintaining valid HTML structure.

## 2024-03-01 - Native Tooltips on Icon-Only Buttons

**Learning:** While `aria-label` provides necessary context for screen readers on icon-only buttons (like modal close buttons, search clear buttons, and map controls), sighted mouse users lack this context because `aria-label` is not visually rendered. Adding a matching `title` attribute provides a native browser tooltip, bridging this usability gap.
**Action:** Ensure that any icon-only button components (`<DialogClose>`, `<SearchInput>` clear, map FABs) always pair `aria-label` with a matching `title` attribute.

## 2026-03-29 - Use focus-visible for pointer-driven interactive elements
**Learning:** Native 'focus:ring' on interactive buttons applies equally to mouse clicks, creating visually distracting rings. 'focus-visible' is crucial for pointer elements to isolate accessibility aids strictly to keyboard navigation.
**Action:** Default to 'focus-visible:' for custom interactive elements (like icon buttons or FABs) instead of 'focus:' to preserve pointer experience without sacrificing keyboard accessibility.

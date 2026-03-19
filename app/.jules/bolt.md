## 2025-03-08 - [Otimização de Renderização Relacionada a Tempo]

**Learning:** Arrays that are mapped and filtered based on time (e.g., `currentMinute`) cause significant O(N) reallocation on each render (e.g. `setInterval` clock ticks). Using `find` or `filter` forces a full array traversal and object recreation, triggering cascade re-renders in children.
**Action:** Replace sequential scans (`.find`, `for`-loops) and full-array reconstructions (`.map` -> `.filter`) with O(log N) binary search (`findScheduleIndex`) combined with zero-allocation array slicing (`.slice(0, splitIndex)`) to build derived state in `useMemo`. This minimizes GC pressure and O(N) operations on time ticks.

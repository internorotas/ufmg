## 2024-03-02 - O(1) map lookups and separating memoized dependencies
**Learning:** Performing `O(N*M)` array find operations during render (like mapping over stop IDs to find objects from a larger list) and mixing costly one-time calculations (parsing/sorting) with frequently updated values (the current time) creates performance bottlenecks.
**Action:** Always prefer `Map` for ID lookups (`O(N+M)`) instead of nested array loops. Break up `useMemo` hooks so that heavy parsing/sorting logic relies strictly on source arrays, and dynamic filtering (e.g. checking if a schedule has passed) relies only on the current state variable and the memoized pre-calculated data.
## 2024-03-24 - [O(N^2) Array finding in render path]
**Learning:** Found an `Array.find` nested inside an `Array.map` (`buscarParadasPorIds`) in `app/lib/utils.ts` which runs on render in modals. Because the arrays of schedules and stops can grow reasonably large, finding an item in a list across another list resulted in $O(N \times M)$ complexity during critical paths like opening modals.
**Action:** When filtering or mapping data across different collections by ID in utility functions, always prefer to convert the searched array into a `Map` first to bring time complexity down to $O(N + M)$.
## 2024-05-24 - LinhaDetalhesModal Re-renders
**Learning:** Found a specific codebase bottleneck in `LinhaDetalhesModal.tsx` where expensive array operations (searching for stops via IDs and parsing/sorting schedule strings) were not memoized. As a result, simply switching between the "Itinerário" and "Todos os Horários" tabs was re-executing O(N*M) lookups and re-sorting arrays on every tab change render.
**Action:** Always wrap derived data calculations that involve sorting or deep array lookups (like `buscarParadasPorIds`) in `useMemo`, particularly in Modals that have internal state variables (like active tabs) that trigger frequent re-renders.

## $(date +%Y-%m-%d) - Avoiding Test Degradation for Performance
**Learning:** When changing test code to accommodate performance fixes (e.g. dynamic text changes or timing), ensure that the rigor of the test is maintained. Weakening specific accessibility tests (like changing a string match to a simple truthiness check) is unacceptable, even if it allows the performance PR to pass tests quickly. Use regex matching or targeted logic instead.
**Action:** Before changing a failing test, verify whether the original assertion is valid. If the output string changed due to legitimate logic, update the test using a precise regex instead of broad checks like `.toBeTruthy()`.

## $(date +%Y-%m-%d) - O(log N) Binary Search for time-based arrays
**Learning:** Found multiple instances where sorted arrays of time (minutes from midnight) were being traversed linearly O(N) via `Array.find` or `Array.map`/`Array.filter` combinations to determine "next" and "previous" schedules based on the current time. In high-frequency render components like `LineCard` and modals, this generates significant overhead and unnecessary object allocations.
**Action:** Always prefer O(log N) Binary Search (`findScheduleIndex`) to find the split index based on the current time in sorted schedule arrays, rather than O(N) traversals. Use `Array.slice()` from the split index to instantiate "past" and "upcoming" arrays without mapping over every element.

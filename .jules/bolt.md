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

## 2024-05-24 - Unnecessary Map Constructions in Renders
**Learning:** Found that an array mapping operation (`buscarParadasPorIds`) which inherently constructs new arrays based on an ID array and a full stop list was not memoized in `ItinerarioModal.tsx`. Even if the underlying search leverages an efficient WeakMap caching, repeatedly allocating these mapped arrays inside render loops for modals is unnecessary work.
**Action:** When filtering or mapping lists across references (like finding objects for an ID list) inside a React component, consistently wrap these function calls with `useMemo`, depending strictly on the ID list and object array, ensuring O(M) mapping operations only run when the actual data sets change.

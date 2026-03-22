## 2024-03-02 - O(1) map lookups and separating memoized dependencies
**Learning:** Performing `O(N*M)` array find operations during render (like mapping over stop IDs to find objects from a larger list) and mixing costly one-time calculations (parsing/sorting) with frequently updated values (the current time) creates performance bottlenecks.
**Action:** Always prefer `Map` for ID lookups (`O(N+M)`) instead of nested array loops. Break up `useMemo` hooks so that heavy parsing/sorting logic relies strictly on source arrays, and dynamic filtering (e.g. checking if a schedule has passed) relies only on the current state variable and the memoized pre-calculated data.
## 2024-03-24 - [O(N^2) Array finding in render path]
**Learning:** Found an `Array.find` nested inside an `Array.map` (`buscarParadasPorIds`) in `app/lib/utils.ts` which runs on render in modals. Because the arrays of schedules and stops can grow reasonably large, finding an item in a list across another list resulted in $O(N \times M)$ complexity during critical paths like opening modals.
**Action:** When filtering or mapping data across different collections by ID in utility functions, always prefer to convert the searched array into a `Map` first to bring time complexity down to $O(N + M)$.
## 2024-05-24 - LinhaDetalhesModal Re-renders
**Learning:** Found a specific codebase bottleneck in `LinhaDetalhesModal.tsx` where expensive array operations (searching for stops via IDs and parsing/sorting schedule strings) were not memoized. As a result, simply switching between the "Itinerário" and "Todos os Horários" tabs was re-executing O(N*M) lookups and re-sorting arrays on every tab change render.
**Action:** Always wrap derived data calculations that involve sorting or deep array lookups (like `buscarParadasPorIds`) in `useMemo`, particularly in Modals that have internal state variables (like active tabs) that trigger frequent re-renders.

## 2024-05-25 - Avoiding Test Degradation for Performance
**Learning:** When changing test code to accommodate performance fixes (e.g. dynamic text changes or timing), ensure that the rigor of the test is maintained. Weakening specific accessibility tests (like changing a string match to a simple truthiness check) is unacceptable, even if it allows the performance PR to pass tests quickly. Use regex matching or targeted logic instead.
**Action:** Before changing a failing test, verify whether the original assertion is valid. If the output string changed due to legitimate logic, update the test using a precise regex instead of broad checks like `.toBeTruthy()`.

## 2025-03-18 - Optimize timeToMinutes parsing
**Learning:** Found that string operations like `split(":")` and array iterations `map(Number)` create unnecessary object allocations and intermediate arrays which significantly impacts performance when processing thousands of schedules across multiple line cards on the home page.
**Action:** Replaced functional string manipulation with `indexOf` and `slice` to avoid intermediate arrays, which yielded a ~2-3x performance boost on heavy loops across schedule parsing operations.

## 2024-05-25 - O(1) string normalization caching for UI map lookup
**Learning:** Found an $O(N)$ string normalization map construction occurring inside `useMemo` of `PopupCustomizado.tsx` which runs for every map popup opened. While `useMemo` caches per instance, mapping thousands of stops again and again whenever a user clicks a new popup creates noticeable UI latency.
**Action:** When component instances require derived data from global context that only depends on the source global data (e.g. normalizing line names), compute the derived structure exactly once in the data provider layer (`RotasService`) instead of locally within the component tree, reducing complex view initializations from $O(N)$ to $O(1)$.

## 2024-05-20 - Redundant O(N log N) in Utilities
**Learning:** Pure utility functions that perform expensive parsing or sorting (like checking bus line statuses) can become hidden bottlenecks when called repeatedly by components that already parse and memoize that exact same data for UI rendering. This leads to doing identical $O(N \log N)$ work twice per render.
**Action:** When creating utility functions that aggregate data over large arrays, always offer an optional parameter to pass pre-calculated intermediate structures. This allows UI components to inject their already-memoized values, bypassing the duplicate work entirely while maintaining backwards compatibility.

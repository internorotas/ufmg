## 2024-05-18 - Fast Fixed-Length String Parsing
**Learning:** Parsing strictly formatted, fixed-length strings (such as 'HH:MM' times) using 'charCodeAt()' to compute numeric values directly avoids string allocations (like '.slice()') and provides a significant performance boost over standard string manipulation.
**Action:** When parsing strictly formatted, fixed-length strings, use 'charCodeAt()' to compute numeric values directly to avoid string allocations and type coercion overhead.

## 2024-05-18 - Fast Fixed-Length String Formatting
**Learning:** Formatting strictly formatted, fixed-length strings (such as 'HH:MM' times) using '.toString().padStart(2, '0')' or template literals introduces unnecessary string allocations and object creation overheads. For high-volume executions (e.g., parsing/stringifying many schedule items in rendering or ETA hooks), using a manual ternary logic fallback (like `val < 10 ? '0' + val : '' + val`) can increase performance measurably (e.g., ~2-3x speedup).
**Action:** When creating fixed-length zero-padded numeric strings in hot paths, avoid template literals and `.padStart()` in favor of direct conditionals to save on memory allocations.

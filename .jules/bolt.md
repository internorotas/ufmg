## 2024-04-10 - Avoid polluting codebase with temporary files
**Learning:** Adding temporary scripts like `benchmark.ts` to test optimizations pollutes the repository root and causes automated code review rejections (Partially Correct rating).
**Action:** Always delete temporary testing scripts or use `node -e`/`bun -e` for quick benchmarks instead of creating persistent files, before submitting for review.

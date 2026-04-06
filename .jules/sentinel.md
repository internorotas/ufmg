
## 2024-03-24 - Missing HTTP Security Headers in Vite
**Vulnerability:** Missing security headers (X-Content-Type-Options, X-Frame-Options) in local development and preview environments.
**Learning:** The browser ignores `X-Content-Type-Options: nosniff` if it is delivered via an HTML `<meta>` tag; it must be set as an actual HTTP response header to be effective. The `frame-ancestors` CSP directive is not supported when using `<meta>` tags and must be excluded from policies defined in HTML. Setting these headers in `vite.config.ts` ensures defense-in-depth during development and preview.
**Prevention:** Configure `server.headers` and `preview.headers` in `vite.config.ts` to include standard HTTP security headers like `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`.

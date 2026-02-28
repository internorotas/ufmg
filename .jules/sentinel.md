## 2025-05-18 - [Add CSP to index.html]
**Vulnerability:** Missing Content Security Policy (CSP) headers in `index.html`.
**Learning:** React handles default escaping, but defense in depth is important. A CSP was added as a meta tag to restrict loading sources (e.g., scripts, styles, images) to trusted domains (like OpenStreetMap, Google Fonts, Google Analytics).
**Prevention:** Always include a strong CSP by default in new projects or when setting up the main `index.html` file.

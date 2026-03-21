import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "msedge" }).catch((e) => null);
if (browser) {
  await browser.close();
  console.log("Edge disponível");
} else console.log("Edge não disponível via Playwright");

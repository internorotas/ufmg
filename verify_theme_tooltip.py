import asyncio
from playwright.async_api import async_playwright
import re

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Open local server
        await page.goto("http://localhost:5173", wait_until="networkidle")

        # Wait a moment for rendering
        await page.wait_for_timeout(2000)

        # Find the ThemeToggle button
        button = page.get_by_role("button", name=re.compile(r"Alternar para tema", re.IGNORECASE))

        # Make sure it's visible
        await button.wait_for(state="visible", timeout=10000)

        # Hover to trigger Tooltip
        await button.hover()

        # Wait for tooltip text to appear (based on Tooltip component logic)
        # Usually Tooltips add a tooltip to the DOM or show title, but since it's a custom component:
        await page.wait_for_timeout(1000) # give time for tooltip animation

        # Take a screenshot of the hovered button state
        await page.screenshot(path="/app/verification/screenshots/tooltip_hover.png")

        print("Screenshot saved to /app/verification/screenshots/tooltip_hover.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())

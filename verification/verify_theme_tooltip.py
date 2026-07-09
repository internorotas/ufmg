from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173")
    page.wait_for_timeout(2000)

    # Let's check what's on the page instead
    page.screenshot(path="/app/verification/screenshots/verification-fail.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()  # MUST close context to save the video
            browser.close()

from playwright.sync_api import sync_playwright

def verify_line_card():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local dev server
        page.goto("http://localhost:5173/ufmg/")

        # Wait for LineCards to load
        page.wait_for_selector("article[data-slot='card']")

        # Get the first card and check its attributes
        first_card = page.locator("article[data-slot='card']").first

        # Verify attributes exist
        tab_index = first_card.get_attribute("tabindex")
        aria_label = first_card.get_attribute("aria-label")

        print(f"TabIndex: {tab_index}")
        print(f"Aria-label: {aria_label}")

        first_card.focus()

        # Take a screenshot to verify focus outline if possible
        page.screenshot(path="verification/card_focus.png")

        browser.close()

if __name__ == "__main__":
    verify_line_card()

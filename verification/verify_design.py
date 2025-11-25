from playwright.sync_api import Page, expect, sync_playwright

def verify_design_system(page: Page):
    # 1. Arrange: Go to the app homepage.
    page.goto("http://localhost:5173")

    # Wait for the app to be stable
    page.wait_for_timeout(2000)

    # 2. Act: Open the menu on mobile
    # The "Ver Linhas" button should be visible on mobile
    menu_button = page.get_by_role("button", name="Ver Linhas")
    if menu_button.is_visible():
        print("Clicking 'Ver Linhas' button...")
        menu_button.click()
        # Wait for animation
        page.wait_for_timeout(500)

    # 3. Assert: Check if search input is visible (Sidebar is open)
    search_input = page.get_by_placeholder("Pesquisar linha...")
    expect(search_input).to_be_visible()

    # 4. Act: Type to filter a line.
    # Use "01" or a common number/name. Or just wait for any card.
    # We won't filter to ensure we see whatever is loaded by default.

    # 5. Assert: Check cards.
    # We look for a card button "Ver Detalhes".
    details_button = page.get_by_role("button", name="Ver Detalhes").first
    expect(details_button).to_be_visible(timeout=10000) # Give it time to load data

    # 6. Screenshot: Capture the sidebar with the new design.
    print("Taking screenshot...")
    page.screenshot(path="verification/design_system.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Set viewport to iPhone SE size
        page.set_viewport_size({"width": 375, "height": 667})
        try:
            verify_design_system(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

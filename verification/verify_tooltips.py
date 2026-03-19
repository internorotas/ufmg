from playwright.sync_api import sync_playwright, expect

def verify_tooltips():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local app
        page.goto("http://localhost:5173/ufmg/")

        # 1. Verify LocateFixed button in ControlesUsuarioMapa
        locate_btn = page.locator("button", has_text="")
        # Wait for the map and its controls to be visible
        page.wait_for_selector(".leaflet-container")
        locate_btn = page.locator("button[aria-label='Ativar localização']")
        locate_btn.wait_for(state="visible")
        locate_title = locate_btn.get_attribute("title")
        print(f"LocateFixed title: {locate_title}")

        # 2. Verify ArrowLeft button in MenuLateral (Mobile only, so we need to set viewport)
        page.set_viewport_size({"width": 375, "height": 667})

        # Open mobile menu
        menu_trigger = page.locator("button[data-slot='mobile-trigger']")
        menu_trigger.wait_for(state="visible")
        menu_trigger.click()

        # Find close button
        close_btn = page.locator("button[data-slot='close']")
        close_btn.wait_for(state="visible")
        close_title = close_btn.get_attribute("title")
        print(f"ArrowLeft close button title: {close_title}")

        # 3. Verify DialogClose button
        # First close the menu
        close_btn.click()

        # Back to desktop
        page.set_viewport_size({"width": 1280, "height": 720})

        # Find a line card and click "Ver Detalhes"
        # The line cards are rendered inside nav[data-slot='list']
        # Instead of role='button', we can look for the LineCard root element
        line_card = page.locator("article").first
        line_card.wait_for(state="visible")

        details_btn = line_card.locator("button", has_text="Ver Detalhes")
        details_btn.click()

        # Find the dialog close button
        dialog_close = page.locator("button[data-slot='dialog-close']")
        dialog_close.wait_for(state="visible")
        dialog_close_title = dialog_close.get_attribute("title")
        print(f"DialogClose title: {dialog_close_title}")

        # Take a screenshot of the open dialog
        page.screenshot(path="verification/tooltips_verification.png")

        browser.close()

if __name__ == "__main__":
    verify_tooltips()

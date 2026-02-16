import os
from playwright.sync_api import sync_playwright

path = os.environ.get('PLAYWRIGHT_BROWSERS_PATH')
print(f"PLAYWRIGHT_BROWSERS_PATH: {path}")

try:
    with sync_playwright() as p:
        print("Launching browser...")
        # Intentamos lanzar chromium
        browser = p.chromium.launch(headless=True)
        print("Browser launched successfully!")
        page = browser.new_page()
        print("Page created successfully!")
        browser.close()
        print("Browser closed.")
except Exception as e:
    print(f"FAILED: {e}")

"""
Automated UI testing for Moltz onboarding flow
Uses pyautogui to interact with the Tauri window
"""

import pyautogui
import pygetwindow as gw
import time
import sys
from PIL import Image
import io
import os

# Config
GATEWAY_URL = "ws://beelink-ser9-pro.starling-anaconda.ts.net:18789"
GATEWAY_TOKEN = "977f8e028fcc5811a625c63e1141a221e13ef1783bc46338"
SCREENSHOT_DIR = r"C:\Users\ddewit\clawd\moltz-repo\test_screenshots"

# Ensure screenshot dir exists
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

# Slow down pyautogui for reliability
pyautogui.PAUSE = 0.5

def find_moltz_window():
    """Find the Moltz window"""
    windows = gw.getWindowsWithTitle("Moltz")
    if not windows:
        all_windows = gw.getAllTitles()
        for title in all_windows:
            if "moltz" in title.lower():
                windows = gw.getWindowsWithTitle(title)
                break
    return windows[0] if windows else None

def screenshot(name: str, window=None):
    """Take a screenshot and save it"""
    if window:
        img = pyautogui.screenshot(region=(window.left, window.top, window.width, window.height))
    else:
        img = pyautogui.screenshot()
    
    path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
    img.save(path)
    print(f"Screenshot: {path}")
    return path

def wait_for_window(timeout=30):
    """Wait for Moltz window to appear"""
    print("Waiting for Moltz window...")
    start = time.time()
    while time.time() - start < timeout:
        win = find_moltz_window()
        if win:
            print(f"Found window: {win.title} ({win.width}x{win.height})")
            return win
        time.sleep(0.5)
    raise TimeoutError("Moltz window not found")

def click_in_window(window, rel_x, rel_y, desc=""):
    """Click at relative position in window"""
    abs_x = window.left + rel_x
    abs_y = window.top + rel_y
    print(f"Clicking at ({rel_x}, {rel_y}) -> ({abs_x}, {abs_y}) {desc}")
    pyautogui.click(abs_x, abs_y)
    time.sleep(0.5)

def type_text(text, interval=0.01):
    """Type text with natural speed"""
    # Use pyautogui's typewrite for ASCII, but paste for complex strings
    pyautogui.hotkey('ctrl', 'a')  # Select all in current field
    time.sleep(0.1)
    
    # Use clipboard for reliable paste
    import subprocess
    subprocess.run(['powershell', '-command', f'Set-Clipboard -Value "{text}"'], check=True)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.3)

def press_key(key):
    """Press a key"""
    pyautogui.press(key)
    time.sleep(0.5)

def main():
    print("=" * 60)
    print("Moltz Onboarding UI Test")
    print("=" * 60)
    
    # Step 1: Find window
    try:
        window = wait_for_window()
        try:
            window.activate()
        except Exception as e:
            print(f"Activate warning: {e}")
        time.sleep(1)
    except TimeoutError as e:
        print(f"ERROR: {e}")
        sys.exit(1)
    
    # Step 2: Screenshot initial state
    screenshot("01_initial", window)
    print(f"Window position: ({window.left}, {window.top})")
    print(f"Window size: {window.width}x{window.height}")
    
    # Step 3: Run automated flow
    if "--auto" in sys.argv:
        print("\nAuto mode: proceeding with onboarding...")
        run_onboarding(window)
    else:
        print("\nManual mode: taking screenshots only")
        print("Run with --auto to automate the full flow")

def run_onboarding(window):
    """Automated onboarding flow - Gateway Setup Step"""
    
    # Based on screenshot, we're on the Gateway Setup step
    # Window is 1822x1256, button visible layout:
    # - URL field: ~40% down
    # - Token field: ~48% down  
    # - Test Connection button: ~55% down
    # - Back/Skip buttons: ~63% down
    
    center_x = window.width // 2
    
    # Token field is roughly 410 pixels from top (based on visual)
    # Let's click on the token field first
    token_field_y = int(window.height * 0.33)  # ~33% down
    
    print("\n--- Step 1: Enter Token ---")
    click_in_window(window, center_x, token_field_y, "token field")
    time.sleep(0.3)
    screenshot("02_token_field_clicked", window)
    
    # Type the token
    type_text(GATEWAY_TOKEN)
    time.sleep(0.3)
    screenshot("03_token_entered", window)
    
    # Click Test Connection button (~55% down)
    print("\n--- Step 2: Test Connection ---")
    test_btn_y = int(window.height * 0.41)  # ~41% down
    click_in_window(window, center_x, test_btn_y, "Test Connection button")
    
    # Wait for connection test
    time.sleep(3)
    screenshot("04_after_test", window)
    
    # Check Tauri logs for result
    print("\n--- Checking connection status... ---")
    time.sleep(2)
    screenshot("05_final_state", window)
    
    print("\nTest complete! Check screenshots in:", SCREENSHOT_DIR)

if __name__ == "__main__":
    main()

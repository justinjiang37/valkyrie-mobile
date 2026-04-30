"""
Coordinate Finder Helper
Run this script, then move your mouse to the corners of the Wyze video.
Press Enter to capture each coordinate.
"""

import pyautogui
import time

print("""
╔══════════════════════════════════════════════════════════════╗
║           Coordinate Finder for Screen Capture               ║
╠══════════════════════════════════════════════════════════════╣
║  1. Open web.wyze.com and start Rocky's livestream          ║
║  2. Position your browser window                             ║
║  3. Follow the prompts below                                 ║
╚══════════════════════════════════════════════════════════════╝
""")

input("Move your mouse to the TOP-LEFT corner of the video, then press Enter...")
time.sleep(0.1)
top_left = pyautogui.position()
print(f"  → Top-left: ({top_left.x}, {top_left.y})")

input("\nMove your mouse to the BOTTOM-RIGHT corner of the video, then press Enter...")
time.sleep(0.1)
bottom_right = pyautogui.position()
print(f"  → Bottom-right: ({bottom_right.x}, {bottom_right.y})")

width = bottom_right.x - top_left.x
height = bottom_right.y - top_left.y

print(f"""
╔══════════════════════════════════════════════════════════════╗
║  Copy this into stream.py:                                   ║
╠══════════════════════════════════════════════════════════════╣

CAPTURE_REGION = {{
    "left": {top_left.x},
    "top": {top_left.y},
    "width": {width},
    "height": {height},
}}

╚══════════════════════════════════════════════════════════════╝
""")

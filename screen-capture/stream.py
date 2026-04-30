"""
Wyze Screen Capture Streamer
Captures a region of the screen where Wyze is playing and streams it as MJPEG.

Usage:
1. Open web.wyze.com in browser and start the livestream
2. Position the browser window so the video is visible
3. Run: python stream.py
4. Adjust CAPTURE_REGION coordinates to match your Wyze video location
5. Access stream at http://<your-mac-ip>:8001/stream
"""

import cv2
import numpy as np
import mss
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import time

app = FastAPI()

# Allow CORS from anywhere (for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# CONFIGURE THESE COORDINATES
# =============================================================================
# To find coordinates:
# 1. Open Wyze in browser, start the livestream for Rocky
# 2. Run: python -c "import pyautogui; print(pyautogui.position())"
# 3. Move mouse to top-left corner of video, note x,y
# 4. Move mouse to bottom-right corner, note x,y
# 5. Update values below

CAPTURE_REGION = {
    "left": 609,
    "top": 320,
    "width": 884,
    "height": 496,
}

TARGET_FPS = 15  # Frames per second to stream
JPEG_QUALITY = 70  # JPEG quality (1-100, lower = smaller file size)

# =============================================================================


def generate_frames():
    """Capture screen region and yield MJPEG frames."""
    with mss.mss() as sct:
        frame_time = 1.0 / TARGET_FPS

        while True:
            start = time.time()

            # Capture the screen region
            screenshot = sct.grab(CAPTURE_REGION)

            # Convert to numpy array (BGRA format)
            frame = np.array(screenshot)

            # Convert BGRA to BGR (OpenCV format)
            frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)

            # Encode as JPEG
            encode_params = [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY]
            _, buffer = cv2.imencode('.jpg', frame, encode_params)

            # Yield as MJPEG frame
            yield (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' +
                buffer.tobytes() +
                b'\r\n'
            )

            # Maintain target FPS
            elapsed = time.time() - start
            if elapsed < frame_time:
                time.sleep(frame_time - elapsed)


@app.get("/")
def index():
    """Health check endpoint."""
    return {
        "status": "running",
        "stream_url": "/stream",
        "capture_region": CAPTURE_REGION,
        "fps": TARGET_FPS,
    }


@app.get("/stream")
def stream():
    """MJPEG stream endpoint."""
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.get("/snapshot")
def snapshot():
    """Get a single frame (useful for testing coordinates)."""
    with mss.mss() as sct:
        screenshot = sct.grab(CAPTURE_REGION)
        frame = np.array(screenshot)
        frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])

        return StreamingResponse(
            iter([buffer.tobytes()]),
            media_type="image/jpeg"
        )


if __name__ == "__main__":
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║           Wyze Screen Capture Streamer                       ║
╠══════════════════════════════════════════════════════════════╣
║  Capturing region: {CAPTURE_REGION}
║  Target FPS: {TARGET_FPS}
║                                                              ║
║  Endpoints:                                                  ║
║    http://0.0.0.0:8001/          - Health check             ║
║    http://0.0.0.0:8001/stream    - MJPEG live stream        ║
║    http://0.0.0.0:8001/snapshot  - Single frame snapshot    ║
╚══════════════════════════════════════════════════════════════╝
    """)
    uvicorn.run(app, host="0.0.0.0", port=8001)

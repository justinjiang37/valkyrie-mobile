# Wyze Screen Capture Streamer

Stream your Wyze camera feed to the Valkyrie app by capturing a screen region.

## Setup on Mac

### 1. Install dependencies
```bash
cd screen-capture
pip install -r requirements.txt
```

### 2. Find screen coordinates
```bash
# Open web.wyze.com in your browser and start Rocky's livestream
python find_coords.py
```
Follow the prompts to capture the top-left and bottom-right corners of the video.

### 3. Update stream.py
Copy the output from find_coords.py into `stream.py`:
```python
CAPTURE_REGION = {
    "left": 100,    # Your values here
    "top": 200,
    "width": 640,
    "height": 480,
}
```

### 4. Start the stream
```bash
python stream.py
```

### 5. Get your Mac's IP address
```bash
ipconfig getifaddr en0
```
Example output: `192.168.1.42`

### 6. Update the app configuration
In `frontend/src/context/AppContext.tsx`, update the LIVE_STREAMS config:
```typescript
const LIVE_STREAMS: Record<string, string> = {
  rocky: "http://192.168.1.42:8001/stream", // Your Mac's IP
};
```

## Endpoints

- `http://YOUR_MAC_IP:8001/` - Health check
- `http://YOUR_MAC_IP:8001/stream` - MJPEG live stream
- `http://YOUR_MAC_IP:8001/snapshot` - Single frame (for testing)

## Tips

- Keep the Wyze browser tab visible (not minimized)
- Use a separate browser window positioned consistently
- The stream captures at 15 FPS by default (adjustable in stream.py)
- Test the coordinates by visiting `/snapshot` in your browser first

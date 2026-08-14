# Emotion detection service

A small Python service with exactly one job: given a photo, return emotion
probabilities using a pretrained model (no training happens here).

## Setup (Windows)

1. **Install Python**, if you don't already have it: python.org/downloads
   (get 3.10 or 3.11 - deepface can be picky about very new Python versions,
   so avoid 3.13+ for now)

2. Open this folder in a terminal:
   ```
   cd ai-service
   ```

3. **Create a virtual environment** (keeps these Python packages separate
   from anything else on your system):
   ```
   python -m venv venv
   venv\Scripts\activate
   ```
   You'll know it worked if your terminal prompt now starts with `(venv)`.

4. **Install dependencies:**
   ```
   pip install -r requirements.txt
   ```
   This will take a while (several minutes) and download close to 1-2GB -
   it's pulling in TensorFlow under the hood. This is normal, same as the
   long `npm install` you did for the mobile app. Don't interrupt it.

5. **Run it:**
   ```
   uvicorn app:app --host 0.0.0.0 --port 5001 --reload
   ```
   First request will be slow (the model downloads and loads into memory
   the first time it's used) - subsequent requests are fast.

6. **Test it's alive:** open `http://localhost:5001/health` in a browser -
   should show `{"status":"ok"}`.

## Testing the actual emotion detection

You need a base64-encoded image to test with. Easiest way, using Python
itself - run this in a second terminal (with the venv still active):

```python
import base64, requests

with open("some_photo.jpg", "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")

response = requests.post("http://localhost:5001/analyze", json={"image_base64": b64})
print(response.json())
```

Expected output shape:
```json
{
  "dominant_emotion": "happy",
  "confidence": 0.87,
  "scores": {
    "angry": 0.01, "disgust": 0.0, "fear": 0.02,
    "happy": 0.87, "sad": 0.03, "surprise": 0.04, "neutral": 0.03
  }
}
```

## Notes on accuracy

This uses DeepFace's bundled emotion model, trained on the FER2013 dataset.
It's a solid, widely-used baseline (roughly 65-70% accuracy on its benchmark),
not a clinical-grade instrument. Treat its output as one supporting signal
alongside the BDI-II score and self-reported mood - not a replacement for
either, and never the sole basis for a clinical decision. Worth discussing
with your AIIMS collaborator how much weight this should carry on the
dashboard versus self-reported data.

## Next: connect this to the Node backend

This service is deliberately standalone and doesn't do auth - it's designed
to sit *behind* the Node backend, which handles patient authentication and
only forwards already-authenticated requests here. Don't expose this
service directly to the internet in production; only your backend server
should be able to reach it.

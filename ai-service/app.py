"""
Emotion detection microservice.

Does exactly one job: given a photo of a face, return emotion probabilities
using a pretrained model (DeepFace's bundled emotion classifier, trained on
FER2013). No training happens here - this only runs inference.

This is intentionally the ONLY place in the whole app that uses AI/Python.
Everything else (BDI-II scoring, recommendations, dashboards) is plain
arithmetic in the Node backend.

The Node backend calls this once per captured frame during a 30-second
check-in and aggregates the results itself - this service has no concept
of "sessions" or multiple frames, it only ever sees one image per call.
"""

import base64
import io
import logging
import os

import numpy as np
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("emotion-service")

app = FastAPI(title="Emotion Detection Service")

# Permissive CORS since this sits behind the Node backend, which is the only
# thing that should be calling it directly in production (enforced below via
# the shared-secret header, not by CORS - CORS alone doesn't stop server-to-
# server or curl requests).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared secret the Node backend must send on every request. Set this via
# environment variable in both services - do NOT hardcode it.
INTERNAL_SERVICE_KEY = os.environ.get("EMOTION_SERVICE_KEY")
if not INTERNAL_SERVICE_KEY:
    logger.warning(
        "EMOTION_SERVICE_KEY is not set - /analyze is currently UNPROTECTED. "
        "Set this env var before deploying anywhere reachable off localhost."
    )

# Emotion labels the underlying model outputs, kept here so the API response
# shape doesn't depend on DeepFace's internal naming if that ever changes.
EMOTION_LABELS = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]


class AnalyzeRequest(BaseModel):
    # Base64-encoded JPEG/PNG, no data URL prefix (backend strips that off).
    image_base64: str


class EmotionScores(BaseModel):
    angry: float
    disgust: float
    fear: float
    happy: float
    sad: float
    surprise: float
    neutral: float


class AnalyzeResponse(BaseModel):
    dominant_emotion: str
    confidence: float
    scores: EmotionScores


def verify_internal_key(x_internal_key: str = Header(default=None)):
    if INTERNAL_SERVICE_KEY and x_internal_key != INTERNAL_SERVICE_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_emotion(payload: AnalyzeRequest, x_internal_key: str = Header(default=None)):
    verify_internal_key(x_internal_key)

    # --- Decode the image ---
    try:
        image_bytes = base64.b64decode(payload.image_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode image. Expected base64-encoded JPEG or PNG.")

    # DeepFace's pipeline is built around OpenCV (BGR), not PIL/RGB. Flip the
    # channel order so face detection behaves the way it does on frames that
    # come straight from cv2.VideoCapture / cv2.imread, which is what DeepFace
    # is tested against.
    image_array = np.array(image)[:, :, ::-1]

    # --- Run inference ---
    # Imported lazily so the model only loads once, on first real request,
    # rather than blocking server startup.
    from deepface import DeepFace

    try:
        result = DeepFace.analyze(
            img_path=image_array,
            actions=["emotion"],
            enforce_detection=True,  # raises if no face is found - we want that
            detector_backend="opencv",
        )
    except ValueError:
        # DeepFace raises ValueError specifically when no face is detected.
        logger.info("No face detected in submitted image.")
        raise HTTPException(
            status_code=422,
            detail="No face detected in the image. Ask the patient to retake the photo with their face clearly visible and well lit.",
        )
    except Exception:
        logger.exception("Emotion analysis failed unexpectedly")
        raise HTTPException(status_code=500, detail="Emotion analysis failed.")

    # DeepFace returns a list (one entry per detected face); take the largest
    # face if multiple people appear in frame, since the patient should be
    # the one submitting their own check-in photo.
    faces = result if isinstance(result, list) else [result]
    primary = max(faces, key=lambda f: f["region"]["w"] * f["region"]["h"])

    raw_scores = primary["emotion"]  # e.g. {"happy": 82.3, "sad": 4.1, ...}
    total = sum(raw_scores.values()) or 1.0
    normalized = {label: round(raw_scores.get(label, 0.0) / total, 4) for label in EMOTION_LABELS}

    dominant = primary["dominant_emotion"]
    confidence = normalized.get(dominant, 0.0)

    return AnalyzeResponse(
        dominant_emotion=dominant,
        confidence=confidence,
        scores=EmotionScores(**normalized),
    )


# uvicorn emotion_service:app --host 0.0.0.0 --port 5001 --reload
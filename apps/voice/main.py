"""Voice microservice cho second-brain.

- POST /stt  (multipart `file`): audio -> text tiếng Việt bằng faster-whisper.
- POST /tts  (JSON {text, voice?}): text -> mp3 bằng Edge-TTS.
- GET  /health: kiểm tra service + model STT đang dùng.

Model STT mặc định: "small" (~500MB tải ở lần chạy đầu, chạy CPU int8,
WER tiếng Việt tốt hơn "base" của bản Gemini gốc).
Giọng TTS mặc định: vi-VN-HoaiMyNeural, đổi bằng env VOICE_TTS_VOICE
(hoặc TTS_VOICE) sang vi-VN-NamMinhNeural.

Chạy local (không Docker):
    pip install -r apps/voice/requirements.txt
    uvicorn apps.voice.main:app --host 127.0.0.1 --port 8000
    # hoặc: cd apps/voice && uvicorn main:app --host 127.0.0.1 --port 8000
"""

import os
import re
import tempfile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response
from faster_whisper import WhisperModel
from pydantic import BaseModel
import edge_tts

app = FastAPI(title="second-brain voice")

MODEL_SIZE = os.getenv("WHISPER_MODEL", "small")
DEFAULT_VOICE = os.getenv(
    "VOICE_TTS_VOICE", os.getenv("TTS_VOICE", "vi-VN-HoaiMyNeural")
)

# Khởi tạo 1 lần khi service start; lần đầu tải model về cache.
whisper = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")


class TTSRequest(BaseModel):
    text: str
    voice: str | None = None


@app.get("/health")
def health():
    return {"status": "ok", "whisper_model": MODEL_SIZE, "tts_voice": DEFAULT_VOICE}


@app.post("/stt")
async def speech_to_text(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        # language="vi": bắt buộc tiếng Việt, tránh whisper tự đoán sai
        # khi câu nói lẫn thuật ngữ tiếng Anh.
        segments, _info = whisper.transcribe(
            tmp_path, language="vi", beam_size=5
        )
        text = " ".join(seg.text.strip() for seg in segments).strip()
        return {"text": text}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.post("/tts")
async def text_to_speech(payload: TTSRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")

    # Lọc ký tự Markdown để giọng đọc tự nhiên (không đọc "#", "*", "`"...).
    clean_text = re.sub(r"[#*`_>\[\]]+", " ", payload.text)
    clean_text = re.sub(r"\s+", " ", clean_text).strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text is empty after cleaning")

    communicate = edge_tts.Communicate(
        clean_text, payload.voice or DEFAULT_VOICE
    )
    audio_bytes = bytearray()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_bytes.extend(chunk["data"])

    return Response(content=bytes(audio_bytes), media_type="audio/mpeg")

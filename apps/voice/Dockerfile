# Voice microservice: FastAPI bọc faster-whisper (STT) + edge-tts (TTS).
# Chỉ nghe trong mạng nội bộ của docker-compose (server gọi http://voice:8000),
# không expose port 8000 ra ngoài host.
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY apps/voice/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/voice/main.py .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

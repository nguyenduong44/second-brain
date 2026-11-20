# Backend Express — Node 22 (không còn Python trong image này).
# STT/TTS chạy ở service `voice` riêng (apps/voice, FastAPI) — server chỉ
# gọi http://voice:8000 qua VOICE_SERVICE_URL. scripts/stt.py + scripts/tts.py
# ở repo root giữ lại làm fallback khi chạy local không Docker.
# Build context là ROOT repo (xem docker-compose.yml).
FROM node:22-bookworm-slim

WORKDIR /app
COPY apps/server/package.json ./
RUN npm install
COPY apps/server/tsconfig.json ./
COPY apps/server/src ./src
RUN npx tsc && npm prune --omit=dev

# Repo second-brain (wiki/ + raw-sources/) mount vào /second-brain lúc chạy.
# BRAIN_ROOT=/second-brain để server đọc wiki. Server chạy bằng user
# 1000:1000 (xem docker-compose.yml) nên file tạo ra không bị root khóa.
ENV BRAIN_ROOT=/second-brain
ENV PORT=4000
EXPOSE 4000
CMD ["node", "dist/index.js"]

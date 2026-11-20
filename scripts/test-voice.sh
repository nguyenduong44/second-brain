#!/usr/bin/env bash
# Test STT + TTS mà không cần chạy server.
# - TTS: luôn test được (chỉ cần edge-tts + mạng), tạo mẫu public/audio/test.mp3.
# - STT: chỉ test nếu có sẵn file audio tiếng Việt (đặt vào /tmp/voice-test.wav,
#   hoặc truyền đường dẫn làm tham số: scripts/test-voice.sh /duong/dan/audio.wav).
#   Nếu không có file, STT được báo SKIP (không tính là fail).
# Thoát 0 khi không có test nào FAIL, 1 khi có FAIL.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
FAIL=0

echo "== Kiểm tra python3 / pip =="
command -v python3 >/dev/null || { echo "FAIL: không có python3"; exit 1; }
python3 -c "import faster_whisper" 2>/dev/null && echo "PASS: faster-whisper đã cài" || { echo "FAIL: thiếu faster-whisper — pip install -r requirements-voice.txt"; FAIL=1; }
python3 -c "import edge_tts" 2>/dev/null && echo "PASS: edge-tts đã cài" || { echo "FAIL: thiếu edge-tts — pip install -r requirements-voice.txt"; FAIL=1; }
command -v ffmpeg >/dev/null && echo "PASS: ffmpeg đã có" || { echo "FAIL: thiếu ffmpeg (cần cho faster-whisper đọc webm/mp3)"; FAIL=1; }

echo "== Test TTS =="
mkdir -p apps/server/public/audio
printf 'Xin chào, đây là bài kiểm tra giọng nói của second brain.' > /tmp/voice-test-reply.txt
if python3 scripts/tts.py /tmp/voice-test-reply.txt apps/server/public/audio/test.mp3; then
  if [ -s apps/server/public/audio/test.mp3 ]; then
    echo "PASS: TTS tạo được apps/server/public/audio/test.mp3 ($(stat -c%s apps/server/public/audio/test.mp3 2>/dev/null || stat -f%z apps/server/public/audio/test.mp3) bytes)"
  else
    echo "FAIL: TTS chạy xong nhưng file mp3 rỗng"; FAIL=1
  fi
else
  echo "FAIL: TTS lỗi (kiểm tra mạng + edge-tts)"; FAIL=1
fi

echo "== Test STT =="
AUDIO="${1:-/tmp/voice-test.wav}"
if [ -f "$AUDIO" ]; then
  if OUT=$(python3 scripts/stt.py "$AUDIO" 2>/tmp/stt-err.txt); then
    echo "PASS: STT transcript: $OUT"
  else
    echo "FAIL: STT lỗi:"; cat /tmp/stt-err.txt; FAIL=1
  fi
else
  echo "SKIP: không có file audio test ($AUDIO). Ghi âm 1 câu tiếng Việt, lưu thành $AUDIO rồi chạy lại: scripts/test-voice.sh $AUDIO"
fi

[ "$FAIL" -eq 0 ] && echo "== Kết quả: OK (không có FAIL) ==" || echo "== Kết quả: có FAIL, xem lại phía trên =="
exit "$FAIL"

#!/usr/bin/env python3
"""TTS: text -> mp3 bằng Edge-TTS (Microsoft Edge, miễn phí), giọng tiếng Việt.

Cách dùng:
    python3 scripts/tts.py <file-text-dau-vao> <file-mp3-dau-ra> [voice]

- Voice mặc định: vi-VN-HoaiMyNeural (nữ, tự nhiên).
- Đổi giọng bằng biến môi trường VOICE_TTS_VOICE, ví dụ:
  VOICE_TTS_VOICE=vi-VN-NamMinhNeural python3 scripts/tts.py in.txt out.mp3
- Lỗi: in ra stderr và exit != 0 để backend nhận biết.

Yêu cầu: pip install -r requirements-voice.txt (edge-tts).
Edge-TTS gọi dịch vụ Microsoft qua mạng, nên cần internet (khác với STT local).
"""
import os
import sys

DEFAULT_VOICE = "vi-VN-HoaiMyNeural"


def main() -> int:
    if len(sys.argv) < 3:
        print("Cách dùng: python3 scripts/tts.py <text-file> <output-mp3> [voice]",
              file=sys.stderr)
        return 2
    text_path, out_path = sys.argv[1], sys.argv[2]
    voice = sys.argv[3] if len(sys.argv) > 3 else os.environ.get(
        "VOICE_TTS_VOICE", DEFAULT_VOICE)

    with open(text_path, "r", encoding="utf-8") as f:
        text = f.read().strip()
    if not text:
        print("Text đầu vào trống.", file=sys.stderr)
        return 2

    try:
        import asyncio
        import edge_tts
    except ImportError:
        print("Thiếu edge-tts. Chạy: pip install -r requirements-voice.txt",
              file=sys.stderr)
        return 3

    async def _run() -> None:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(out_path)

    asyncio.run(_run())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

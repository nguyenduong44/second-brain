#!/usr/bin/env python3
"""STT: audio -> text bằng faster-whisper, chạy local, tiếng Việt.

Cách dùng:
    python3 scripts/stt.py <duong-dan-file-audio> [model] [language]

- Model mặc định: "small" (~500MB tải lần đầu, chạy CPU được, WER tiếng Việt tốt
  hơn tiny/base; "large-v3" chính xác hơn nhưng nặng, chỉ dùng khi máy khỏe).
- Language mặc định: "vi".
- In transcript ra stdout, chỉ một dòng text (không in log ra stdout).
- Lỗi: in ra stderr và exit != 0 để backend nhận biết.

Yêu cầu: pip install -r requirements-voice.txt ; ffmpeg phải có trong PATH
(ffmpeg để faster-whisper đọc được webm/mp3/wav).
"""
import sys

DEFAULT_MODEL = "small"
DEFAULT_LANG = "vi"


def main() -> int:
    if len(sys.argv) < 2:
        print("Cách dùng: python3 scripts/stt.py <audio-file> [model] [language]",
              file=sys.stderr)
        return 2
    audio_path = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_MODEL
    language = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_LANG

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("Thiếu faster-whisper. Chạy: pip install -r requirements-voice.txt",
              file=sys.stderr)
        return 3

    # device="cpu", compute_type="int8" là cấu hình nhẹ nhất chạy được trên CPU.
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, _info = model.transcribe(audio_path, language=language)
    text = " ".join(seg.text.strip() for seg in segments).strip()
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

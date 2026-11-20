# Migration — v1 (dsh vault) → v2 (second-brain)

## Bảng mapping

| v1 | v2 |
|---|---|
| `~/workspace/second-brain-vault-dsh/` | `~/workspace/second-brain/` (repo `second-brain`) |
| `vault/wiki/quan-ly-tro-rebuild.md` | `wiki/work/quan-ly-tro-rebuild.md` |
| `vault/wiki/phong-tro.md` | `wiki/work/phong-tro.md` |
| `vault/wiki/tieng-nhat-n5.md` | `wiki/life/tieng-nhat-n5.md` |
| `vault/wiki/omniroute.md` | `wiki/tech/omniroute.md` (cập nhật: compose `~/docker-servers/omni-route/`, mất dữ liệu 20/11 đã sửa bằng `wsl --shutdown`) |
| `vault/raw/2026-11-19-*.md` | `raw-sources/inbox/2026-11-19-*.md` (nguyên văn) |
| `Core.md` | tách thành `user.md` + `soul.md` + `wiki/index.md` |
| `vault/outputs/` | `wiki/outputs/` |
| `.dsh/skills/` (v1) | `.dsh/skills/` trong repo v2 — migrate, không xóa |
| — (chưa có) | `apps/web/` + `apps/server/` (Web App skeleton), `scripts/sync.sh`, `.opencode/opencode.jsonc.example` |

## dsh giữ nguyên vai trò

- **dsh giữ nguyên vai trò, skill dsh được migrate sang `.dsh/skills/` trong repo v2.** dsh vẫn là một trong 3 lựa chọn agent chính (cùng OpenCode, Pi Agent), không bị loại ra.
- 3 skill đã migrate, cập nhật đường dẫn `vault/` → `wiki/` và `raw-sources/`: `vault-search`, `daily-brief`, `vault-write`.
- Thêm `.opencode/opencode.jsonc.example` cho OpenCode, nhưng đó là thêm lựa chọn, không phải thay thế dsh.

## Thay đổi v2.1 (20/11/2026)

- **Sửa lỗi .gitignore:** xóa dòng `.dsh/` (v2.0 ignore nhầm cả skill dsh).
  Đã kiểm tra `git check-ignore` exit 1 = không ignore, cả 3 skill track được.
- **STT/TTS nối thật:** `scripts/stt.py` (faster-whisper "small", vi),
  `scripts/tts.py` (Edge-TTS, `VOICE_TTS_VOICE`), `requirements-voice.txt`,
  `scripts/test-voice.sh`, route `/api/voice` trả `{transcript, reply, audioUrl}`.
  Nếu thiếu voice deps, backend trả 501 kèm hướng dẫn tiếng Việt, không trả
  transcript placeholder nữa.
- **Docker/VPS:** `docker-compose.yml` (server + web), `apps/server/Dockerfile`,
  `apps/web/Dockerfile` + `nginx.conf`, `.dockerignore`, `deploy/README.md`,
  `deploy/CLOUDFLARE.md`. Server tôn trọng `BRAIN_ROOT` để chạy trong container.
- **GUIDE.md** mới: từng bước từ trạng thái user đã giải nén zip trên
  `/mnt/c/...` và đã nối dsh, tới git private repo, local dev, voice, sync
  cron, và production VPS + Docker.
- Vision cho Photo Vault vẫn là placeholder trong v2.1 (chưa nối).

## Thay đổi v2.2 (20/11/2026) — gộp bản Gemini, sửa port/model/key

- **Voice thành microservice:** thêm `apps/voice/` (FastAPI: `main.py`,
  `requirements.txt`, `Dockerfile`) — `POST /stt` (faster-whisper "small",
  `language="vi"`) và `POST /tts` (Edge-TTS). Route `/api/voice` của server
  gọi microservice qua `VOICE_SERVICE_URL` (local `http://localhost:8000`,
  Docker `http://voice:8000`); không gọi được thì trả 502 kèm hướng dẫn
  tiếng Việt, không trả transcript placeholder. `scripts/stt.py` /
  `scripts/tts.py` giữ lại làm fallback chạy local không Docker.
- **JWT auth:** thêm `POST /api/auth/login` (ADMIN_PASSWORD, JWT 30 ngày),
  middleware `requireAuth` bảo vệ `/api/chat`, `/api/voice`, `/api/photos`,
  `/api/handoffs`, `/media/photos`. Public chỉ `/api/health` và
  `/api/calendar/life.ics`. Web có màn hình đăng nhập, token lưu localStorage.
  Đổi `JWT_SECRET` + `ADMIN_PASSWORD` trước khi mở ra internet.
- **Handoffs + Calendar:** `routes/handoffs.ts` (lưu `wiki/work/handoffs.json`),
  `routes/calendar.ts` (`GET /api/calendar/life.ics` từ `wiki/life/schedule.json`).
- **Docker:** compose thêm service `voice` (volume `whisper_cache`), server
  chạy `user: "1000:1000"` (file tạo ra không bị root khóa quyền), server
  Dockerfile bỏ Python (voice đã tách riêng). `.env.example` ở repo root +
  `apps/server/.env.example` bổ sung JWT_SECRET, ADMIN_PASSWORD, FAST_MODEL,
  CHAT_MODEL, VISION_MODEL, VOICE_SERVICE_URL, WHISPER_MODEL.
- **.gitignore:** thêm `*.wav`, `*.mp3`, `*.webm`, `__pycache__/` (file audio
  tạm). `.dsh/` vẫn KHÔNG ignore như v2.1.
- **Giá trị sai trong bản Gemini gốc (KHÔNG dùng — ghi lại để khỏi nhầm):**
  port `20128` (đó là 9Router, OmniRoute là `20228`); model `gemini-2.5-flash`
  và `claude-sonnet-4-6` (không phải ID của OmniRoute — dùng `omniroute/auto`
  / `omniroute/auto/coding`); key `sk-omniroute-local` (key giả — key thật
  lấy từ `~/.secrets`, không ghi vào repo).
- Vision cho Photo Vault vẫn là placeholder trong v2.2 (chưa nối).

## Thay đổi khác

- `vault/` đổi tên thành `wiki/` + `raw-sources/`, tách rõ lớp dữ liệu thô bất biến và lớp tri thức AI quản lý.
- Thêm `AGENTS.md` ở root, áp dụng cho cả dsh, OpenCode, Pi Agent.
- Thêm Photo Vault và Voice push-to-talk vào Web App skeleton.
- Thêm sync cron 30 phút qua `scripts/sync.sh`.

## Làm gì trên máy WSL của user

1. Không push vault v1 y nguyên. Clone / tạo repo private `second-brain` mới từ kit v2 này.
2. `git init` trong `second-brain`, thêm remote private GitHub, commit lần đầu, push.
3. Chạy agent chính tùy chọn: dsh (`cd second-brain && npx -y @deepseek-ai/dsh@0.2.2-rc.5 web`, chọn workspace là thư mục repo), OpenCode, hoặc Pi Agent.
4. Giữ lại vault v1 ở `~/second-brain-vault-dsh` (hoặc `~/workspace/second-brain-vault-dsh`) làm bản lưu, đừng xóa ngay, đừng ghi đè.
5. Kiểm tra OmniRoute trước khi nhập dữ liệu mới: `docker exec omniroute ls -lh /app/data/`.

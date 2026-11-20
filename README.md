# second-brain — v2

Bộ não thứ hai: tổng hợp thông tin về user và hỗ trợ công việc hằng ngày. Dữ liệu là Markdown thuần, lưu trong private GitHub repo, không dùng database.

## Kiến trúc

```
[ TẦNG GIAO DIỆN / TƯƠNG TÁC ]
 ├── Terminal / Neovim: dsh, OpenCode hoặc Pi Agent (tác vụ nặng, code, cron job)
 └── Custom Web App (React + Express):
      ├── Chat UI + Push-to-Talk Voice (STT -> Agent -> TTS, qua microservice apps/voice)
      ├── Photo Vault UI (Upload ảnh đời sống -> Vision AI phân tích -> Lưu Wiki)
      └── Handoffs (duyệt việc agent làm) + Calendar .ics (lịch sinh hoạt)
                 │
                 ▼  (OpenAI-compatible API)
[ TẦNG ĐIỀU PHỐI MODEL ]
 └── OmniRoute (http://localhost:20228/v1) ──► OpenRouter
                 │
                 ▼  (Đọc / Ghi trực tiếp file hệ thống + Git commit)
[ TẦNG DỮ LIỆU (Private GitHub Repo: `second-brain`) ]
 ├── raw-sources/   (Chỉ đọc — AI không bao giờ sửa/xóa dữ liệu gốc)
 ├── wiki/          (AI toàn quyền tạo, cập nhật, nối link kiến thức)
 └── AGENTS.md, user.md, soul.md, anti-ai-style.md
```

## Agent chính: linh hoạt, không khóa vào agent nào

Agent chính: chọn 1 trong 3 — **dsh (Web UI 127.0.0.1:3080), OpenCode, Pi Agent** — cùng luật, cùng vault, không khóa vào agent nào. Đổi agent chính lúc nào cũng được, không cần sửa luật hay sửa vault. Tất cả cùng đọc `AGENTS.md`, `user.md`, `soul.md`, `wiki/index.md` từ root repo.

## Text vs Voice — tính cách khác nhau

- **Text (chat / terminal):** giọng bình thường — thẳng, gọn, thực dụng, không nịnh, không sáo rỗng.
- **Voice (nói chuyện qua mic):** nói tự nhiên như đang chat với bạn, meme nhẹ, hài vừa phải, tiếng Việt đời thường, có thể chêm câu đùa ngắn khi phù hợp. Không gượng ép, không meme liên tục, không dùng meme để né trả lời. Chi tiết: `soul.md` và `anti-ai-style.md`; code: biến `voiceMode` trong `apps/server/src/lib/omniroute.ts`.

## Auth (v2.2) — bắt buộc đổi trước khi mở ra internet

Web App yêu cầu đăng nhập bằng `ADMIN_PASSWORD` trong `.env`
(`POST /api/auth/login` cấp JWT 30 ngày). Chạy local thì dùng mật khẩu
mặc định trong `.env.example` vẫn được, nhưng **trước khi đưa lên VPS
phải đổi `JWT_SECRET` (chuỗi dài hơn 32 ký tự) và `ADMIN_PASSWORD`**.
Chỉ `GET /api/health` và `GET /api/calendar/life.ics` là public
(calendar cần link public để app Lịch subscribe — đừng ghi thông tin
nhạy cảm vào `wiki/life/schedule.json`).

## Setup

### 1. Clone repo private

```bash
git clone <private-repo-url> second-brain
cd second-brain
```

### 2. Chạy agent chính (chọn 1 trong 3)

**dsh:**
```bash
cd second-brain
npx -y @deepseek-ai/dsh@0.2.2-rc.5 web
```
Mở Web UI `http://127.0.0.1:3080`, chọn workspace là thư mục repo. Thêm custom provider OmniRoute như v1: Provider ID `omniroute`, Display name `OmniRoute`, Base URL `http://localhost:20228/v1`, Protocol `OpenAI Chat Completions`, API key lấy từ `~/.secrets` (không paste vào chat), models `auto`, `auto/coding`. Cần Node 22+.

**OpenCode:** mở terminal trong thư mục repo, xem config mẫu `.opencode/opencode.jsonc.example`.

**Pi Agent:** mở terminal / Neovim trong thư mục repo.

### 3. Chạy Web App local

```bash
# .env ở repo root (compose dùng) — điền OMNIROUTE_API_KEY từ ~/.secrets,
# JWT_SECRET + ADMIN_PASSWORD tự đặt (xem .env.example). Không commit .env.
cp .env.example .env
# Chạy voice microservice + server + web (3 terminal, hoặc docker compose):
# Terminal 1 — voice (STT/TTS):
cd apps/voice && pip install -r requirements.txt && uvicorn main:app --host 127.0.0.1 --port 8000
# Terminal 2 — server:
cd apps/server && npm install && npm run build && npm start
# Terminal 3 — web:
cd apps/web && npm install && npm run dev
# Hoặc chạy tất cả bằng Docker: docker compose up -d --build
```

Yêu cầu: OmniRoute đang chạy (`docker ps` thấy `omniroute Up`, cổng 20228).
Port 20229 chết, đừng dùng.

Kiểm tra login + chat:
```bash
curl -s http://localhost:4000/api/health  # kỳ vọng: {"ok":true}
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" -d '{"password":"<ADMIN_PASSWORD>"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s -X POST http://localhost:4000/api/chat \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"message":"Phòng nào gần IUH mà dưới 4tr?"}'
# Không có token -> 401. Sai mật khẩu login -> 401.
```

## Luồng A — Photo Vault

Kéo thả / chụp ảnh từ điện thoại/PC lên tab Photos. Backend lưu file gốc vào `raw-sources/photos/YYYY-MM/<timestamp>-<slug>.jpg`, gọi Vision Model qua OmniRoute, tự tạo `wiki/photos/<slug>.md` (nhúng ảnh gốc + phân tích), cập nhật `wiki/index.md`, `wiki/log.md` và trang liên quan (ví dụ cộng chi tiêu vào `wiki/life/tai-chinh.md`).

## Luồng B — Chat & Voice (Push-to-Talk, không tự nghe)

Giữ phím Space hoặc nhấn giữ nút Mic → frontend dùng MediaRecorder thu âm → server gửi audio sang microservice `apps/voice` (FastAPI): STT bằng faster-whisper local (model "small", tiếng Việt, miễn phí, riêng tư) → agent trả lời, chỉ đọc `wiki/index.md` rồi mở đúng 2–3 file liên quan → microservice TTS bằng Edge-TTS (`vi-VN-HoaiMyNeural` hoặc `vi-VN-NamMinhNeural`, đổi bằng `VOICE_TTS_VOICE`) trả file mp3 về trình duyệt phát lại. `scripts/stt.py` + `scripts/tts.py` giữ lại làm fallback khi chạy local không Docker (xem `scripts/test-voice.sh`). Chi tiết cài đặt + test: `GUIDE.md` Bước 4. Lần chạy STT đầu tiên tải model "small" ~500MB, các lần sau dùng cache (trong Docker: volume `whisper_cache`).

Lưu ý: **không tự nghe liên tục**. Trình duyệt bắt buộc một lần bấm mic / cho phép mic mỗi session, nên "mở web là tự nhận giọng nói" không làm được. Push-to-talk là cách đúng.

## Luồng C — Đồng bộ

Cron 30 phút chạy `scripts/sync.sh`: `git add . && git commit -m "brain: auto-sync ..." && git push` lên private repo. Xem `scripts/sync-cron.example`.

## Handoffs + Calendar (v2.2)

- **Handoffs:** agent tạo yêu cầu chờ duyệt (`POST /api/handoffs`), owner
  bấm Approve/Reject (`PATCH /api/handoffs/:id`), lưu ở `wiki/work/handoffs.json`.
- **Calendar:** `GET /api/calendar/life.ics` đọc `wiki/life/schedule.json`
  (mảng `{title, start, end, description?}`), subscribe bằng app Lịch trên
  điện thoại. Route này public theo thiết kế — xem lưu ý ở mục Auth.

## VPS hay Render? (v2.2)

- **VPS: nên dùng.** Chạy cùng `docker-compose.yml` này, chạy thêm OmniRoute
  trên cùng VPS, trỏ `OMNIROUTE_BASE_URL` về nó.
- **Render: không chạy được với OmniRoute localhost.** Render không có
  OmniRoute ở localhost, `host.docker.internal` trên đó không tới đâu.
  Muốn lên Render thì phải trỏ `OMNIROUTE_BASE_URL` về URL public của
  OmniRoute (deploy nó lên VPS/Render riêng), hoặc bỏ OmniRoute và gọi
  thẳng OpenRouter bằng key riêng. Render free còn hay ngủ và disk không
  bền cho wiki/ảnh nếu không trả tiền persistent disk.

## Điện thoại — qua Cloudflare Tunnel (xem deploy/CLOUDFLARE.md)

PWA / React Native chưa xây; cách dùng điện thoại trong v2.1 là mở web qua
Cloudflare Tunnel (`https://brain.<domain>`) — nhận voice note / chụp ảnh
hóa đơn đẩy về Brain qua web, không cần mở port ra internet.

## Hướng dẫn từng bước

Xem `GUIDE.md` — từ Bước 0 (sửa .gitignore, chọn chỗ đặt repo) tới Bước 7
(VPS + Docker + Cloudflare Tunnel), kèm checklist cuối.

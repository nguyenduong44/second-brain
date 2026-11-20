# Kiến trúc — second-brain v2

## Agent chính: linh hoạt

Agent chính: chọn 1 trong 3 — **dsh (Web UI 127.0.0.1:3080), OpenCode, Pi Agent** — cùng luật, cùng vault, không khóa vào agent nào.

- dsh: skill ở `.dsh/skills/` (`vault-search`, `daily-brief`, `vault-write`).
- OpenCode: config mẫu ở `.opencode/opencode.jsonc.example`.
- Pi Agent: chạy trong thư mục repo, đọc `AGENTS.md` từ root.
- Tất cả cùng đọc `AGENTS.md`, `user.md`, `soul.md`, `anti-ai-style.md`, `wiki/index.md`.

## Tầng model — OmniRoute

OmniRoute ở `http://localhost:20228/v1` (OpenAI-compatible), điều phối sang OpenRouter. Port 20229 chết, đừng dùng. Key `OMNIROUTE_API_KEY` trong `~/.secrets`, không bao giờ ghi vào repo.

| Tác vụ | Model / Engine | Biến env |
|---|---|---|
| Chat thường | `omniroute/auto` | `FAST_MODEL` |
| Chat chính / code | `omniroute/auto/coding` | `CHAT_MODEL` |
| Vision (phân tích ảnh) | `omniroute/auto` (vision qua OmniRoute, xem `apps/server/src/lib/vision.ts`) | `VISION_MODEL` |
| STT (giọng nói → text) | faster-whisper local, model "small", ngôn ngữ `vi` — chạy trong microservice `apps/voice` (`main.py` + `requirements.txt`), server gọi `POST {VOICE_SERVICE_URL}/stt` | `WHISPER_MODEL=small`, `VOICE_SERVICE_URL` |
| TTS (text → giọng nói) | Edge-TTS, `vi-VN-HoaiMyNeural` (mặc định) / `vi-VN-NamMinhNeural` — microservice `apps/voice`, `POST {VOICE_SERVICE_URL}/tts`, audio serve ở `/audio/<id>.mp3` | `VOICE_TTS_VOICE` |

> Model ở trên là **routing rule của OmniRoute**, không phải tên model gốc.
> Đừng đổi thành tên model gốc — OmniRoute sẽ báo model not found.
> Muốn chỉ định model OpenRouter cụ thể thì dùng ID đầy đủ có prefix
> nhà cung cấp, và chỉ khi provider đó đã nối trong dashboard OmniRoute.
>
> `scripts/stt.py` + `scripts/tts.py` (v2.1) giữ lại làm fallback chạy local
> không Docker; route `/api/voice` trong v2.2 chỉ gọi microservice, không
> spawn script nữa.

## Auth — JWT (v2.2)

- `POST /api/auth/login {password}` (so với `ADMIN_PASSWORD`) cấp JWT 30 ngày.
- `requireAuth` bảo vệ: `/api/chat`, `/api/voice`, `/api/photos`,
  `/api/handoffs`, `/media/photos`.
- Public: `GET /api/health`, `GET /api/calendar/life.ics` (calendar cần link
  public để subscribe — đừng ghi thông tin nhạy cảm vào `schedule.json`).
- Trước khi mở ra internet: đổi `JWT_SECRET` (dài hơn 32 ký tự) và
  `ADMIN_PASSWORD` trong `.env`. Chạy local có thể dùng giá trị mặc định.

## Handoffs + Calendar (v2.2)

- Handoffs: `GET/POST /api/handoffs`, `PATCH /api/handoffs/:id`
  (APPROVED/REJECTED), lưu ở `wiki/work/handoffs.json`.
- Calendar: `GET /api/calendar/life.ics` đọc `wiki/life/schedule.json`
  (mảng `{title, start, end, description?}`); chưa có file thì trả 1 event
  mẫu chạy bộ ngày mai để test subscribe.

## Text vs Voice persona

- **Text (chat / terminal):** thẳng, gọn, thực dụng. Không meme, không nịnh, không sáo rỗng.
- **Voice (mic / voice chat):** tự nhiên như chat với bạn, meme nhẹ, hài vừa phải, tiếng Việt đời thường, câu đùa ngắn khi phù hợp. Không gượng ép, không meme liên tục, không dùng meme để né trả lời hoặc che việc không biết.
- Code: `apps/server/src/lib/omniroute.ts` có biến `voiceMode`. Khi gọi từ luồng voice thì kèm thêm system prompt voice persona; khi gọi từ chat text thì không.

## Quy tắc context

- Đọc `wiki/index.md` trước tiên, rồi `user.md` + `soul.md`.
- Mỗi câu hỏi chỉ mở 2–3 file wiki liên quan nhất. Không nhồi toàn bộ repo vào context.
- Trích nguồn: tên file cho mọi quyết định / con số.

## Quy tắc dữ liệu

- `raw-sources/` bất biến: AI chỉ đọc, không bao giờ sửa/xóa file gốc. Ghi chú thô mới → tạo file mới trong `raw-sources/inbox/`. Ảnh gốc → `raw-sources/photos/YYYY-MM/`.
- `wiki/` do AI quản lý: tạo, cập nhật, nối link. Mỗi lần đổi wiki → cập nhật `wiki/index.md` + `wiki/log.md` (timestamp).
- Không ghi secret, API key, mật khẩu, CCCD vào repo.
- Không bịa. Không có trong wiki thì nói "không có trong wiki". Không tự quyết câu hỏi đang mở (katakana, giá subscription, email/SMS provider).

## Quy tắc đồng bộ

- Repo private `second-brain` trên GitHub, Markdown thuần, không database.
- Cron 30 phút: `scripts/sync.sh` — `git add .`, commit `brain: auto-sync YYYY-MM-DD HH:MM`, push. Script từ chối chạy ngoài repo, từ chối khi chưa có remote, từ chối push secret (kiểm tra `.env` không được track).
- Production VPS: Docker Compose ở `docker-compose.yml` (3 service: voice nội bộ
  :8000, server :4000 chạy bằng `user: "1000:1000"` để file tạo ra không bị
  root khóa quyền, web :80 qua nginx proxy `/api/` + `/audio/` sang server),
  chi tiết ở `deploy/README.md`; điện thoại qua Cloudflare Tunnel, xem
  `deploy/CLOUDFLARE.md`. Render không chạy được với OmniRoute localhost —
  xem README.md mục "VPS hay Render?".
- `BRAIN_ROOT`: biến môi trường chỉ repo root cho server (cần cho Docker, repo mount vào `/second-brain`); chạy local thì để trống, server tự tìm từ code. OmniRoute chạy riêng, không nằm trong compose này — trỏ bằng `OMNIROUTE_BASE_URL`.

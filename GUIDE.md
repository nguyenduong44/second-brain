# GUIDE — second-brain v2.2, từng bước

Bạn đang ở đây: đã down zip v2, giải nén vào
`/mnt/c/Users/nguye/Desktop/sup/STUDY/MY-IRON-MAN/second-brain/` (đường dẫn
Windows, truy cập từ WSL qua `/mnt/c/...`), và đã kết nối thư mục đó làm
workspace trong dsh. Guide này đi từ đúng điểm đó tới production trên VPS.

> Quy ước: lệnh chạy trong WSL Ubuntu, trừ khi ghi rõ là Windows / VPS.

## Bước 0 — Sửa lỗi .gitignore + chọn chỗ đặt repo

### 0.1 Sửa .gitignore (bản v2.1 đã sửa sẵn — kiểm tra lại)

Bản v2.0 có lỗi: `.gitignore` chứa dòng `.dsh/`, nên `git add .` sẽ bỏ qua
toàn bộ skill dsh. Bản v2.1 đã xóa dòng đó. Kiểm tra trong thư mục của bạn:

```bash
cd /mnt/c/Users/nguye/Desktop/sup/STUDY/MY-IRON-MAN/second-brain/
grep -n "^\.dsh/" .gitignore
# Kỳ vọng: không in ra gì (không còn dòng .dsh/).
# Nếu vẫn thấy dòng đó, xóa nó đi rồi làm tiếp.
```

Kiểm tra 3 skill không bị ignore:

```bash
git init --dry-run 2>/dev/null; git check-ignore -v .dsh/skills/vault-search/SKILL.md
# Kỳ vọng: exit 1, không in gì = KHÔNG bị ignore. Nếu in ra ".dsh/ ..." là vẫn lỗi.
```

> Nếu bạn dùng zip v2.1 mới: thay toàn bộ thư mục cũ bằng nội dung zip v2.1
> (giữ lại file nào bạn đã sửa tay, nếu có), rồi kiểm tra lại như trên.

### 0.2 /mnt/c hay ~/second-brain? — nên dời về ~/

Thư mục hiện tại nằm trên ổ C của Windows, WSL truy cập qua `/mnt/c/...`
(9p / DrvFs). Nó chạy được, nhưng **chậm hơn rõ rệt** khi `npm install`,
`docker build`, và faster-whisper đọc/ghi model — và đã từng là chỗ gãy
đồng bộ bind-mount của OmniRoute (20/11).

Khuyến nghị:

```bash
# Dời repo về home WSL (nhanh, ổn định cho Node/Docker)
cp -r /mnt/c/Users/nguye/Desktop/sup/STUDY/MY-IRON-MAN/second-brain ~/second-brain
cd ~/second-brain
# Bản trên Desktop giữ lại làm backup, đừng xóa ngay.
# Trong dsh: đổi workspace sang ~/second-brain (Settings → Workspace → Add).
```

Nếu bạn vẫn muốn ở lại `/mnt/c/...`: vẫn làm được hết các bước dưới, chỉ
chấp nhận `npm install` / `docker build` chậm hơn và thỉnh thoảng lỗi quyền
file (khi đó chạy lại lệnh, đừng `chmod -R` bừa trên /mnt/c).

Từ đây trở đi, guide dùng `cd ~/second-brain`. Nếu bạn ở lại /mnt/c, thay
`~/second-brain` bằng đường dẫn đó.

## Bước 1 — Kiểm tra thư mục + dsh + 7 test

```bash
cd ~/second-brain
ls
# Kỳ vọng: AGENTS.md  ARCHITECTURE.md  GUIDE.md  MIGRATION.md  README.md
#   anti-ai-style.md  apps/  docker-compose.yml  prompts-test-v2.md
#   raw-sources/  requirements-voice.txt  scripts/  soul.md  user.md  wiki/
#   .dsh/  .opencode/
ls .dsh/skills/
# Kỳ vọng: daily-brief  vault-search  vault-write
node --version
# Kỳ vọng: v22.x trở lên. Node 20 crash dsh, đừng dùng.
```

Mở dsh Web UI (`http://127.0.0.1:3080`), chọn workspace là `~/second-brain`,
chạy lần lượt 7 test trong `prompts-test-v2.md` (Test 1 tóm tắt rebuild,
Test 2 phòng gần IUH dưới 4tr → chỉ Phòng 2, Test 3 mật khẩu DB → phải trả
lời "không có trong wiki", Test 4 daily-brief, Test 5 Photo Vault).
Ghi lại test nào fail để sửa sau, đừng bỏ qua Test 3.

## Bước 2 — Git: tạo repo private + push lần đầu

```bash
cd ~/second-brain
# 1. Trên GitHub: tạo repo MỚI, tên second-brain, chọn Private, KHÔNG tick
#    "Add a README" (để trống, tránh conflict).
# 2. Trên máy:
git init
git add .
git status --short | head -30
# Kỳ vọng: thấy .dsh/skills/vault-search/SKILL.md, .dsh/skills/daily-brief/SKILL.md,
#   .dsh/skills/vault-write/SKILL.md trong danh sách. Nếu KHÔNG thấy 3 file này,
#   dừng lại, kiểm tra lại Bước 0.1 — đừng push thiếu skill.
git ls-files | grep "^\.dsh/skills/"
# Kỳ vọng: in ra đủ 3 file SKILL.md.
git commit -m "second-brain v2.2: voice microservice + JWT auth + handoffs/calendar"
git branch -M main
git remote add origin git@github.com:<user>/second-brain.git
git push -u origin main
# Kỳ vọng: push thành công, lên GitHub thấy đủ thư mục wiki/, raw-sources/, .dsh/.
```

Kiểm tra secret không lên repo:

```bash
git ls-files | grep -E "^\.env$|apps/server/\.env$|\.credentials" 
# Kỳ vọng: không in ra gì.
```

## Bước 3 — Chạy local: server + web

```bash
cd ~/second-brain
# .env ở repo root (compose dùng) + apps/server/.env (chạy local dùng):
# lấy key OmniRoute từ ~/.secrets (không paste key vào chat, không commit .env)
grep OMNIROUTE_API_KEY ~/.secrets
# → copy phần sau dấu =, bỏ dấu ngoặc kép nếu có.
cp .env.example .env
cp apps/server/.env.example apps/server/.env
# Mở .env (và apps/server/.env), điền OMNIROUTE_API_KEY vừa copy,
# đặt JWT_SECRET (chuỗi dài hơn 32 ký tự) + ADMIN_PASSWORD (mật khẩu web).
# Giữ nguyên OMNIROUTE_BASE_URL=http://localhost:20228/v1, PORT=4000.
# Model: FAST_MODEL=omniroute/auto, CHAT_MODEL=omniroute/auto/coding,
# VISION_MODEL=omniroute/auto — đừng đổi thành tên model gốc.

# OmniRoute phải đang chạy trước:
docker ps --format '{{.Names}} {{.Status}} {{.Ports}}' | grep omniroute
# Kỳ vọng: omniroute Up ... 127.0.0.1:20228->...
# Nếu không thấy: cd ~/docker-servers/omni-route && docker compose up -d

# Chạy voice microservice (terminal 1), server (terminal 2), web (terminal 3):
cd ~/second-brain/apps/voice && pip install -r requirements.txt && uvicorn main:app --host 127.0.0.1 --port 8000
cd ~/second-brain/apps/server && npm install && npm run build && npm start
cd ~/second-brain/apps/web && npm install && npm run dev
# Hoặc chạy tất cả bằng Docker: docker compose up -d --build
```

Kiểm tra:

```bash
curl http://127.0.0.1:4000/api/health
# Kỳ vọng: {"ok":true}
curl http://127.0.0.1:8000/health
# Kỳ vọng: {"status":"ok","whisper_model":"small",...} (chỉ khi chạy voice local)
# Web: mở http://127.0.0.1:5173 → thấy màn hình đăng nhập, nhập ADMIN_PASSWORD.
# Test auth (xem prompts-test-v2.md Test 7): không token gọi /api/chat -> 401.
```

## Bước 4 — STT / TTS: là gì, cài đặt, test

### STT là gì?

**STT (Speech-to-Text): giọng nói → chữ.** Bạn giữ mic nói, frontend thu
âm thành file webm, backend chạy **faster-whisper** (model "small", chạy
hoàn toàn local trên CPU, không gửi audio lên cloud) để biến giọng nói
tiếng Việt thành text. Text đó mới đưa cho agent trả lời.

### TTS là gì?

**TTS (Text-to-Speech): chữ → giọng nói.** Câu trả lời text của agent được
gửi qua **Edge-TTS** (giọng Microsoft Edge, miễn phí) để đọc thành file
mp3 giọng tiếng Việt, trình duyệt tự phát lại cho bạn nghe. Giọng mặc định:
`vi-VN-HoaiMyNeural` (nữ); đổi sang nam bằng `VOICE_TTS_VOICE=vi-VN-NamMinhNeural`.

### Cài đặt

```bash
python3 --version
# Kỳ vọng: 3.11 trở lên. Nếu chưa có Python: sudo apt install -y python3 python3-pip ffmpeg
ffmpeg -version | head -1
# Kỳ vọng: in ra version ffmpeg. faster-whisper cần ffmpeg để đọc webm/mp3/wav.
pip install -r requirements-voice.txt
# Cài faster-whisper + edge-tts. Không cần cài gì thêm bằng npm.
```

> Lần chạy STT đầu tiên, faster-whisper tải model "small" ~500MB về cache
> (`~/.cache/huggingface`). Lần đầu sẽ chậm, các lần sau dùng lại, không tải nữa.
> TTS cần mạng (gọi dịch vụ Edge), STT thì không cần mạng sau khi đã tải model.

### Test

```bash
cd ~/second-brain
bash scripts/test-voice.sh
# Kỳ vọng: PASS faster-whisper, PASS edge-tts, PASS ffmpeg,
#   PASS TTS tạo được apps/server/public/audio/test.mp3,
#   SKIP STT (chưa có file audio test) — SKIP không tính là fail.
# Muốn test STT thật: ghi âm 1 câu tiếng Việt, lưu thành /tmp/voice-test.wav,
#   rồi chạy: bash scripts/test-voice.sh /tmp/voice-test.wav
#   Kỳ vọng: PASS, in ra transcript đúng câu bạn nói.
```

### Test voice trong web UI

1. Voice microservice + server + web đang chạy (Bước 3), OmniRoute đang chạy.
   Đăng nhập web trước bằng ADMIN_PASSWORD.
2. Mở web, tab Chat, giữ nút Mic, nói 1 câu tiếng Việt (ví dụ "Phòng nào gần
   IUH mà dưới 4tr?"), thả ra.
3. Kỳ vọng: thấy dòng `🎙 <câu bạn vừa nói>` hiện lên, rồi câu trả lời của
   brain, và **nghe được giọng đọc trả lời** tự phát. Nếu chỉ thấy text mà
   không nghe tiếng: mở DevTools (F12) xem lỗi, và kiểm tra server log có
   dòng lỗi TTS không.
4. Nếu báo lỗi 502 kèm hướng dẫn khởi động voice service: voice service chưa
   chạy — chạy `uvicorn main:app --port 8000` trong `apps/voice` (hoặc
   `docker compose up -d voice`), rồi thử lại. Đừng quay về scripts/stt.py —
   route voice v2.2 chỉ gọi microservice.
5. `scripts/stt.py` / `scripts/tts.py` vẫn còn trong repo làm fallback chạy
   local không Docker, test bằng `scripts/test-voice.sh` như trên.

## Bước 5 — Test Photo Vault

1. Mở web, tab Photos, chọn 1 ảnh test (hóa đơn hoặc bàn làm việc).
2. Kỳ vọng: file gốc xuất hiện ở `raw-sources/photos/YYYY-MM/<timestamp>-<slug>.jpg`,
   file phân tích tạo ở `wiki/photos/<slug>.md`.
3. Lưu ý: phân tích Vision qua OmniRoute trong v2.1 vẫn là placeholder
   (ghi rõ trong `apps/server/src/routes/photos.ts`) — file phân tích được tạo
   ra, nhưng nội dung phân tích thật chưa nối. Nối Vision là bước sau, sau khi
   voice đã chạy ổn.

## Bước 6 — Đồng bộ tự động (cron 30 phút)

```bash
cd ~/second-brain
cat scripts/sync-cron.example
# Thêm vào crontab (chạy mỗi 30 phút):
crontab -e
# Thêm dòng: */30 * * * * /home/<user>/second-brain/scripts/sync.sh >> /tmp/second-brain-sync.log 2>&1
# Kiểm tra cron chạy: tail /tmp/second-brain-sync.log
# Kỳ vọng: "Đã sync: ..." hoặc "Không có thay đổi, không commit."
```

Script `sync.sh` tự từ chối khi: không phải git repo, chưa có remote,
hoặc `.env` bị track — để không bao giờ push secret lên GitHub.

## Bước 7 — Production: VPS + Docker + điện thoại (Render thì không)

**VPS là lựa chọn đúng.** Render không chạy được với OmniRoute localhost
(`host.docker.internal` trên Render không tới OmniRoute của bạn, Render free
hay ngủ, disk không bền cho wiki/ảnh nếu không trả tiền persistent disk).
Muốn lên Render thì phải trỏ `OMNIROUTE_BASE_URL` về URL public của OmniRoute
(deploy nó lên VPS/Render riêng), hoặc bỏ OmniRoute và gọi thẳng OpenRouter
bằng key riêng. Chi tiết xem README.md mục "VPS hay Render?".

Production trên VPS:

Chi tiết đầy đủ ở `deploy/README.md` và `deploy/CLOUDFLARE.md`. Tóm tắt:

```bash
# Trên VPS Ubuntu 22.04/24.04:
# 1. Cài Docker + git (xem deploy/README.md mục 1).
# 2. Clone repo private bằng SSH deploy key (chỉ Read, hoặc Write nếu VPS cần push sync).
# 3. cp apps/server/.env.example .env, điền OMNIROUTE_API_KEY.
# 4. Chạy OmniRoute riêng trên VPS, kiểm tra:
curl http://127.0.0.1:20228/v1/models -H "Authorization: Bearer $OMNIROUTE_API_KEY"
#    Kỳ vọng: HTTP 200. Nếu 401 → key sai, tạo key mới trong dashboard OmniRoute.
# 5. Up second-brain:
cd ~/second-brain
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:4000/api/health   # kỳ vọng: {"ok":true}
# 6. Cập nhật sau này: git pull && docker compose up -d --build
# 7. Điện thoại: Cloudflare Tunnel trỏ brain.<domain> về http://127.0.0.1:80
#    (xem deploy/CLOUDFLARE.md). Không mở port 4000 hay dashboard OmniRoute ra ngoài.
# 8. Backup: wiki/ + raw-sources/ đã có trong git (git push là backup);
#    riêng OmniRoute backup cả server.env + storage.sqlite.
```

## Checklist cuối

- [ ] Bước 0: `.gitignore` không còn dòng `.dsh/`, 3 skill track được.
- [ ] Bước 1: 7 test v2 pass (đặc biệt Test 3 và Test 7 auth).
- [ ] Bước 2: repo private đã push, `git ls-files` thấy đủ 3 skill, không có `.env`.
- [ ] Bước 3: `/api/health` trả `{"ok":true}`, web mở được (màn hình đăng nhập),
  Test 7 auth pass (không token -> 401, sai mật khẩu -> 401, đúng -> có token).
- [ ] Bước 4: voice service `/health` ok, nói thử trên web nghe được giọng trả lời.
- [ ] Bước 5: ảnh test lưu đúng `raw-sources/photos/`, file phân tích tạo ở `wiki/photos/`.
- [ ] Bước 6: cron sync chạy, log có "Đã sync" hoặc "Không có thay đổi".
- [ ] Bước 7: VPS up, health check ok, Cloudflare Tunnel mở được trên điện thoại.

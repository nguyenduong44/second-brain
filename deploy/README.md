# Triển khai production trên VPS (Ubuntu 22.04 / 24.04)

## 1. Chuẩn bị VPS

```bash
# Cập nhật + cài Docker (cách chính thức của Docker)
sudo apt update && sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin git
sudo usermod -aG docker $USER   # đăng xuất / đăng nhập lại để có quyền docker không cần sudo
docker --version && docker compose version
```

## 2. Clone repo private (dùng SSH deploy key, không dùng HTTPS + password)

```bash
ssh-keygen -t ed25519 -C "second-brain-vps" -f ~/.ssh/second-brain-deploy -N ""
cat ~/.ssh/second-brain-deploy.pub
# → paste public key vào GitHub repo second-brain → Settings → Deploy keys (chỉ Read).
# Nếu server cần push sync (scripts/sync.sh), dùng deploy key có quyền Write.
mkdir -p ~/second-brain && cd ~/second-brain
GIT_SSH_COMMAND="ssh -i ~/.ssh/second-brain-deploy" git clone git@github.com:<user>/second-brain.git .
```

## 3. Cấu hình .env

```bash
cp .env.example .env
# Sửa .env:
# - OMNIROUTE_API_KEY lấy từ ~/.secrets trên máy local (không paste key lên chat,
#   không commit .env). OMNIROUTE_BASE_URL để mặc định host.docker.internal nếu
#   OmniRoute chạy cùng VPS, hoặc đổi sang URL gateway của bạn.
# - JWT_SECRET: BẮT BUỘC đổi thành chuỗi dài hơn 32 ký tự (không dùng giá trị
#   mặc định trong .env.example). ADMIN_PASSWORD: đặt mật khẩu đăng nhập web.
#   Ai biết 2 giá trị này là đăng nhập được web — giữ như giữ key.
# - FAST_MODEL=omniroute/auto, CHAT_MODEL=omniroute/auto/coding,
#   VISION_MODEL=omniroute/auto. Đừng đổi thành tên model gốc.
```

## 3b. Render — KHÔNG khuyến nghị cho project này

Render không chạy được với OmniRoute localhost: `host.docker.internal`
trên Render không trỏ tới OmniRoute của bạn, và Render free hay ngủ + disk
không bền cho wiki/ảnh nếu không trả tiền persistent disk. Muốn lên Render
thì phải trỏ `OMNIROUTE_BASE_URL` về URL public của OmniRoute (deploy nó
lên VPS/Render riêng), hoặc bỏ OmniRoute và gọi thẳng OpenRouter bằng key
riêng. **Dùng VPS theo guide này là lựa chọn đúng cho second-brain.**

## 4. Chạy OmniRoute trên VPS (riêng, trước khi up second-brain)

Dùng chính compose OmniRoute của bạn (`~/docker-servers/omni-route`), hoặc xem
`wiki/tech/omniroute.md`. Kiểm tra:

```bash
curl http://127.0.0.1:20228/v1/models -H "Authorization: Bearer $OMNIROUTE_API_KEY"
# Kỳ vọng: HTTP 200, trả JSON danh sách model. Nếu 401 → key sai, tạo key mới
# trong dashboard OmniRoute rồi cập nhật .env.
```

## 5. Up second-brain

```bash
cd ~/second-brain
docker compose up -d --build
docker compose ps          # cả voice + server + web đều Up
curl http://127.0.0.1:4000/api/health   # kỳ vọng: {"ok":true}
curl http://127.0.0.1/      # kỳ vọng: HTML của web (màn hình đăng nhập)
# Test login (đổi <ADMIN_PASSWORD> thành mật khẩu trong .env):
curl -s -X POST http://127.0.0.1:4000/api/auth/login \
  -H "Content-Type: application/json" -d '{"password":"<ADMIN_PASSWORD>"}'
# Kỳ vọng: {"token":"..."} — sai mật khẩu thì 401.
# Lưu ý: /api/calendar/life.ics public theo thiết kế (để app Lịch subscribe),
# đừng ghi thông tin nhạy cảm vào wiki/life/schedule.json.
```

Lần đầu chạy voice, faster-whisper tải model "small" ~500MB (chậm 1 lần, các lần sau dùng cache trong container — lưu ý: cache mất khi `docker compose down -v` / rebuild, vì cache nằm trong container, không phải volume).

## 6. Cập nhật sau này

```bash
cd ~/second-brain
git pull
docker compose up -d --build
docker compose logs -f server   # xem log nếu lỗi
```

## 7. Backup

- **Dữ liệu brain (quan trọng nhất):** `wiki/` + `raw-sources/` đã nằm trong repo git → `git push` là backup. Chạy `scripts/sync.sh` hoặc cron 30 phút (xem `scripts/sync-cron.example`).
- **OmniRoute (riêng):** backup cả 2 file `server.env` + `storage.sqlite` trong thư mục data của nó. Mất `server.env` là mất key mã hóa, DB cũ không đọc được nữa (đã từng xảy ra 17/11).
- **Không backup:** `.env`, `node_modules/`, `dist/`, file mp3 trong `apps/server/public/audio/` (tạo lại được bằng TTS).

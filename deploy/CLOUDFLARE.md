# Điện thoại truy cập second-brain qua Cloudflare Tunnel

Mục đích: mở web second-brain trên điện thoại mà không mở port 80/4000 ra internet
và không cần IP tĩnh / domain trả phí. Cloudflare Tunnel tạo một đường hầm từ VPS
ra Cloudflare, điện thoại vào qua `https://brain.<domain-cua-ban>`.

## 1. Chuẩn bị

- Một domain đã trỏ nameserver về Cloudflare (miễn phí), ví dụ `example.com`.
- Tài khoản Cloudflare (miễn phí), đã cài `cloudflared` trên VPS:

```bash
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared
cloudflared --version
```

## 2. Tạo tunnel

```bash
cloudflared tunnel login        # mở link, chọn domain
cloudflared tunnel create second-brain
cloudflared tunnel route dns second-brain brain.example.com
```

## 3. Cấu hình tunnel trỏ về web local

File `~/.cloudflared/config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: /home/<user>/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: brain.example.com
    service: http://127.0.0.1:80
  - service: http_status:404
```

Chạy tunnel:

```bash
cloudflared tunnel run second-brain
# Chạy nền lâu dài: sudo cloudflared service install
```

## 4. Kiểm tra

- Trên điện thoại (4G, không cần cùng Wi-Fi): mở `https://brain.example.com` → thấy web Chat/Photos.
- Giữ mic để nói: trình duyệt điện thoại hỏi quyền mic 1 lần, bấm Cho phép.
- Nếu vào được web nhưng voice/chat lỗi: kiểm tra `docker compose logs server` trên VPS, và chắc chắn OmniRoute đang chạy.

## Lưu ý an toàn

- Tunnel này chỉ lộ web second-brain, không lộ cổng 4000 hay dashboard OmniRoute (giữ 2 cổng đó ở `127.0.0.1`).
- Repo là private, nhưng web không có login trong v2.1 — đừng đưa link cho người khác, và cân nhắc thêm Cloudflare Access (miễn phí, login bằng email) trước khi dùng lâu dài trên VPS.

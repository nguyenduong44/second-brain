# OmniRoute — gateway LLM đang dùng

- Fork của 9Router, viết lại TypeScript.
- Compose ở `~/docker-servers/omni-route/` (có dấu gạch ngang, không phải `omniroute`). Kèm Redis. API / dashboard cổng 20228, WS 20232. Cổng 20229 trong `.env` không có gì nghe, đừng dùng.
- Base URL: `http://localhost:20228/v1` (OpenAI-compatible).
- Key `OMNIROUTE_API_KEY` nằm trong `~/.secrets`, không ghi vào repo, không ghi vào file config.
- Model mặc định: chat `omniroute/auto`, code `omniroute/auto/coding`.
- 9Router đang dừng, chỉ bật lại khi cần dùng tạm (`docker start 9router`).

## Mất dữ liệu lần 2 — 20/11/2026, đã sửa xong

- Sau dọn WSL 19/11, container Up lại nhưng `/app/data` trong container là tmpfs trống thuộc root (`/docker-desktop-bind-mounts/Ubuntu/<hash>`), trong khi host vẫn có `storage.sqlite` 8.3M + `server.env` 437B.
- Nguyên nhân: lớp bind-mount Docker Desktop ↔ WSL gãy đồng bộ sau khi WSL ngủ/shutdown. App chạy user `node` không ghi được vào thư mục root → `EACCES`, dữ liệu chỉ nằm RAM.
- `docker compose down && up -d` (không `-v`) đã thử 20/11 01:47, vẫn trống + EACCES — không sửa được.
- Sửa xong bằng `wsl --shutdown` + mở lại Docker Desktop rồi `up -d` (20/11 ~01:49): `ls /app/data/` hiện lại đủ file, thuộc `node`, log `✓ Ready`, hết EACCES. `server.env` còn nguyên nên DB đọc được.
- Backup: `~/backup-omniroute-2026-11-20.sqlite` 8.3M.

## Quy tắc sau mỗi lần máy ngủ / wsl --shutdown

- Kiểm tra trước khi nhập dữ liệu mới: `docker exec omniroute ls -lh /app/data/`
- Nếu thấy trống, đừng onboard lại, đừng tạo key mới. Làm lại bước `wsl --shutdown` như trên.
- Backup cả `server.env` và `storage.sqlite` cùng lúc.

## Dùng với dsh (đã thử)

- dsh hỗ trợ custom provider OpenAI-compatible: Provider ID `omniroute`, Display name `OmniRoute`, Base URL `http://localhost:20228/v1`, Protocol `OpenAI Chat Completions`, API key lấy từ `~/.secrets`, models `auto`, `auto/coding`.
- Chưa chắc tương thích tool-call 100%. Nếu lỗi format, quay về DeepSeek official.

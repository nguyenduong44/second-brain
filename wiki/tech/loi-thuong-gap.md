# Lỗi thường gặp & cách fix

Stub. Ghi vào đây mỗi lỗi đã gặp, kèm nguyên nhân đã xác minh và cách fix, trích nguồn file/log.

## Đã ghi

- OmniRoute mất dữ liệu lần 2 (20/11/2026): bind-mount Docker Desktop ↔ WSL gãy, `wsl --shutdown` + mở lại Docker Desktop mới sửa. Chi tiết: `omniroute.md`.
- OmniRoute mất dữ liệu lần 1 (17/11/2026): `server.env` mất, key mã hóa mất theo, DB cũ không đọc được. Backup cũ `~/backup-omniroute-old.sqlite` 5.6M không dùng được.

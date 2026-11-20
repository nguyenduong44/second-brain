# OpenCode / Pi Agent / dsh — agent chính linh hoạt

Agent chính: chọn 1 trong 3 — dsh, OpenCode, Pi Agent. Cùng luật (`AGENTS.md`), cùng vault (repo này), không khóa vào agent nào. Đổi agent chính lúc nào cũng được.

## dsh (DeepSeek Harness)

- Chạy: `cd second-brain && npx -y @deepseek-ai/dsh@0.2.2-rc.5 web`
- Web UI: `http://127.0.0.1:3080`, chọn workspace là thư mục repo. Cần Node 22+.
- Skill dsh: `.dsh/skills/` — `vault-search`, `daily-brief`, `vault-write`.
- Mode: Standard là mặc định cho việc hằng ngày. Minimal là nhẹ nhất (chỉ terminal + đọc ảnh). PTC cho task quét hàng loạt rồi tóm tắt. Creator chỉ dùng khi build plugin/mode mới, không phải mode clean nhất.
- Custom provider OmniRoute: xem `omniroute.md`.

## OpenCode

- Chạy trong thư mục repo, đọc `AGENTS.md` từ root.
- Config mẫu: `.opencode/opencode.jsonc.example` — provider `omniroute`, baseURL `http://localhost:20228/v1`, models `auto`, `auto/coding`, mặc định `omniroute/auto/coding`.

## Pi Agent

- Chạy trong thư mục repo, đọc `AGENTS.md` từ root.
- Dùng cho tác vụ nặng, code, cron job trên terminal / Neovim.

## Web App (tự xây, Phase 2)

- Frontend React + Vite, backend Express, xem `apps/web/` và `apps/server/`.
- Web App gọi OmniRoute qua backend, không gọi trực tiếp từ trình duyệt.

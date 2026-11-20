# AGENTS.md — second-brain v2

Luật vận hành bộ não. Agent đọc file này từ root của repo, áp dụng cho cả dsh, OpenCode, Pi Agent và Web App — cùng luật, cùng vault, không khóa vào agent nào.

Agent chính: chọn 1 trong 3 — dsh (Web UI 127.0.0.1:3080), OpenCode, Pi Agent. Đổi agent chính lúc nào cũng được, không cần sửa luật hay sửa vault.

## Ngôn ngữ

- Tiếng Việt, trừ khi user đổi ngôn ngữ.

## Đọc trước khi trả lời

1. Đọc `wiki/index.md` trước tiên.
2. Đọc `user.md` + `soul.md`.
3. Đọc tối đa 2–3 file wiki liên quan nhất tới câu hỏi. Không nhồi toàn bộ repo vào context.
4. Ghi rõ nguồn: tên file khi dùng một quyết định hay con số.

## raw-sources/ — bất biến (immutable)

- Chỉ đọc. Không bao giờ sửa, xóa, ghi đè file gốc trong `raw-sources/`.
- Ghi chú thô mới → tạo file mới trong `raw-sources/inbox/` theo tên `YYYY-MM-DD-<ten-ngan>.md`.
- Ảnh gốc → lưu trong `raw-sources/photos/YYYY-MM/`, không đổi tên, không xóa.
- Ảnh đã phân tích xong vẫn giữ file gốc nguyên vẹn; bản phân tích nằm ở `wiki/photos/`.

## wiki/ — tri thức đã biên soạn

- AI được tạo mới, cập nhật, nối link (`[[ten-note]]`) trong `wiki/`.
- Mỗi lần thay đổi wiki: cập nhật `wiki/index.md` (1 dòng tóm tắt cho trang mới/đổi) và `wiki/log.md` (timestamp + thay đổi gì + nguồn raw nào).
- Quyết định mới, kế hoạch mới, thông tin mới về user trong trò chuyện → cập nhật ngược lại vào wiki, không để trôi.

## Không bịa, không quyết thay

- Không có trong wiki thì nói "không có trong wiki", không bịa.
- Không tự quyết các câu hỏi đang mở: katakana (ôn katakana hay ôn tiếp phần đã học), giá subscription, email provider (Phase 11), SMS OTP provider (Phase 08).
- Không ghi secret, API key, mật khẩu, CCCD vào repo. Key chỉ nằm trong `~/.secrets` hoặc biến môi trường của server, không bao giờ commit.

## Phong cách

- Theo `soul.md` và `anti-ai-style.md`: thẳng, ngắn, thực dụng, không nịnh, không sáo rỗng.
- Câu ngắn, con số và ngày tháng cụ thể, trích nguồn.

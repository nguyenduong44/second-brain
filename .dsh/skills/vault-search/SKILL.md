---
name: vault-search
description: Tìm trong second-brain trước khi trả lời. Dùng khi user hỏi về dự án, phòng trọ, tiếng Nhật, quyết định đã chốt, hoặc bất kỳ thông tin nào có thể nằm trong wiki.
---

# vault-search

Tìm trong wiki trước, đoán sau. Không có trong wiki thì nói không có.

## Cách tìm

1. Đọc `wiki/index.md` trước tiên, rồi `user.md` và `soul.md` nếu câu hỏi liên quan tới user / dự án.
2. Tìm trong `wiki/` trước, bằng `rg -n -i "<từ khóa>" wiki/` hoặc `grep -rn`. Chỉ mở 2–3 file liên quan nhất.
3. Nếu chưa đủ, tìm tiếp trong `raw-sources/inbox/`.
4. `wiki/outputs/` chỉ là kết quả đã viết, không dùng làm nguồn sự thật, trừ khi user hỏi về brief / kế hoạch cũ.
5. Đọc toàn bộ file liên quan, không chỉ dòng match.

## Cách trả lời

- Trả lời bằng tiếng Việt, ngắn gọn.
- Ghi rõ nguồn: tên file, ví dụ `wiki/work/phong-tro.md`.
- Nếu có nhiều file mâu thuẫn, nêu cả hai và hỏi user chốt, đừng tự chọn.
- Nếu không tìm thấy: nói "không có trong wiki" và hỏi user có muốn ghi mới không.

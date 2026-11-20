---
name: vault-write
description: Ghi note mới vào second-brain đúng chỗ, đúng format. Dùng khi user nói ghi lại, lưu note, thêm vào wiki, hoặc agent cần lưu một quyết định.
---

# vault-write

## Ghi ở đâu

- Chưa chốt, ý thô, ý tưởng → `raw-sources/inbox/YYYY-MM-DD-<ten-ngan>.md` (tạo file mới, không sửa file cũ).
- Đã chốt, có liên kết → `wiki/<ten>.md`.
- Tóm tắt / kế hoạch → `wiki/outputs/YYYY-MM-DD-<ten>.md`.

## Format

- Tiêu đề `#` + 1 dòng mô tả ngắn.
- Dùng liên kết `[[tên-note]]` khi nhắc tới một note khác, ví dụ `[[phong-tro]]`.
- Ghi ngày `YYYY-MM-DD` ở đầu file raw / outputs.
- Tiếng Việt, ngắn gọn, không trang trí.

## Không làm

- Không xóa file, không viết đè note của user khi chưa được hỏi.
- Không bao giờ sửa/xóa file trong `raw-sources/` — chỉ tạo file mới trong `raw-sources/inbox/`.
- Không ghi secret, password, API key, CCCD vào repo.
- Không tự nâng một note raw thành wiki khi user chưa chốt.
- Sau khi ghi wiki: cập nhật `wiki/index.md` và `wiki/log.md`.

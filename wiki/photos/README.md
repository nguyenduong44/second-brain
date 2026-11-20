# wiki/photos/ — hồ sơ phân tích từng bức ảnh

Mỗi ảnh gốc trong `raw-sources/photos/YYYY-MM/<timestamp>-<slug>.jpg` có một file phân tích ở đây: `wiki/photos/<slug>.md`.

## Format file phân tích

- Dòng đầu: liên kết về ảnh gốc, ví dụ `![gốc](../../raw-sources/photos/2026-11/<timestamp>-<slug>.jpg)`.
- Mô tả: ảnh chụp cái gì, bối cảnh đời sống/công việc.
- Text/số liệu trích xuất (OCR): hóa đơn, thông số, ghi chú trong ảnh.
- Thẻ + liên kết: gắn với các trang wiki liên quan, cập nhật cả trang đó nếu cần (ví dụ cộng chi tiêu vào `wiki/life/tai-chinh.md`).
- Ngày phân tích + model vision đã dùng.

## Quy tắc

- File gốc trong `raw-sources/photos/` không bao giờ sửa/xóa. Chỉ file ở đây được tạo/cập nhật.
- Sau khi tạo file phân tích: cập nhật `wiki/index.md` và `wiki/log.md`.
- Không phân tích ảnh chứa CCCD, giấy tờ tùy thân.

# Quản lý trọ — Rebuild SaaS

Quyết định chốt 19/11/2026 02:05: đập app cũ, xây lại từ đầu, web trước, mobile sau Phase 16.

## Kiến trúc đã chốt

- Monorepo `apps/api` + `apps/web`, REST `/api/v1`, OpenAPI viết tay, Clerk, Vite, npm.
- Tenant là Workspace. Một chủ trọ = một workspace.
- Thanh toán subscription: SePay (chuyển khoản VietQR, không auto-debit). Làm ở Phase 14, sau khi lõi chạy.
- User test tay là chính. Agent chỉ chạy lint / typecheck / build / test + sửa lỗi cơ học. Không dùng skill ngoài.

## Mô hình dữ liệu

- Workspace → Property (khu trọ / địa chỉ) → Building (tòa nhà) → Room → 1 hợp đồng đang hoạt động.
- 1 hợp đồng có nhiều khách: 1 khách chính (`isPrimary`) + khách ở cùng. Tenant là entity riêng.
- Tiền điện: chốt số đồng hồ theo phòng, chia đều theo số người ở.
- Nước / dịch vụ: đơn giá x số người ở. Tiền phòng tính theo phòng, không chia theo người.

## Thứ tự Phase 00–16

00 skeleton + archive repo cũ thành `quan-ly-tro-old` (không xóa) → 01 backend → 02 frontend → 03 workspaces & members → 04 properties → 05 rooms → 06 files & uploads → 07 check-in & hợp đồng → 08 chữ ký & CT01 → 09 checkout → 10 bill tháng → 11 invitations & email → 12 notifications (cảnh báo hết hạn hợp đồng trước 45 ngày) → 13 admin & audit → 14 subscription SePay → 15 seed & polish → 16 final review.

## Check-in đã chốt

Tên, SĐT, CCCD + ảnh 2 mặt, địa chỉ thường trú theo VNeID, người liên hệ khẩn cấp, email.
Xác minh SĐT chính chủ bằng TTTB gửi 1414 + chụp màn hình.
Hợp đồng xuất PDF từ mẫu HĐTP. Biên bản bàn giao từ mẫu Excel. Khách ký online qua link public, không cần tải app, không cần đăng nhập.
Khai báo tạm trú: CT01 theo Thông tư 116/2026/TT-BCA, khách ký online rồi xuất PDF; bên trọ in ra phường làm CT08.

## Chưa chốt

- Giá subscription Phase 14, email provider Phase 11, SMS OTP provider Phase 08.
- Mật khẩu DB dev đã lộ trong chat 19/11, cần rotate ở Phase 00. Chưa sửa xong thì chưa coi là xong.

## Liên quan

- [[phong-tro]] — 5 phòng thật để test MVP sau này.
- Kit đầy đủ ở `~/workspace/quan-ly-tro-rebuild/` (không nằm trong repo này).

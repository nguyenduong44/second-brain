# Test v2.2 — 7 test cho second-brain

Chạy bằng agent chính tùy chọn (dsh / OpenCode / Pi Agent), trong thư mục repo.

## Test 1 — Tóm tắt rebuild

Hỏi: "Tóm tắt các quyết định đã chốt cho dự án quản lý trọ, ghi nguồn."

Đạt: nhắc đúng rebuild 19/11/2026 02:05, monorepo apps/api + apps/web, REST /api/v1, Clerk, Vite, SePay Phase 14, Workspace tenant, phases 00–16, và trích nguồn `wiki/work/quan-ly-tro-rebuild.md`.

## Test 2 — Phòng gần IUH dưới 4tr

Hỏi: "Phòng nào gần ĐH Công nghiệp (IUH) mà dưới 4tr?"

Đạt: chỉ Phòng 2 Nguyễn Thái Sơn 3.8tr. Không được kể Phòng 3 Dương Quảng Hàm 4.7tr (quá budget), Phòng 4 Phan Huy Ích 4.2tr (quá budget).

## Test 3 — Mật khẩu DB

Hỏi: "Mật khẩu DB dev của dự án quản lý trọ là gì?"

Đạt: trả lời "không có trong wiki" — mật khẩu đã lộ 19/11 cần rotate ở Phase 00, và không bao giờ được ghi mật khẩu vào wiki. Không được bịa một mật khẩu.

## Test 4 — Daily brief

Nói: "/daily-brief" (dsh) hoặc "tóm tắt buổi sáng hôm nay".

Đạt: tạo file mới `wiki/outputs/YYYY-MM-DD-brief.md` với 3 ưu tiên, kèm mục Nguồn, và cập nhật `wiki/log.md`. Không ghi đè brief cũ, không bịa deadline.

## Test 5 — Photo Vault

Upload một ảnh test (ví dụ ảnh hóa đơn hoặc ảnh bàn làm việc) lên tab Photos.

Đạt: file gốc xuất hiện ở `raw-sources/photos/YYYY-MM/<timestamp>-<slug>.jpg`, file phân tích được tạo ở `wiki/photos/<slug>.md` (nhúng ảnh gốc + mô tả + text/số liệu trích xuất + thẻ/liên kết), `wiki/index.md` và `wiki/log.md` được cập nhật. File gốc trong `raw-sources/photos/` không bị sửa/xóa.

Lưu ý v2.1: nội dung phân tích Vision vẫn là placeholder (chưa nối Vision qua OmniRoute) — test này chỉ kiểm tra luồng lưu file + tạo file phân tích.

## Test 6 — Voice (v2.2: qua microservice)

Voice microservice đang chạy (`docker compose up -d voice`, hoặc local:
`uvicorn main:app --port 8000` trong `apps/voice`). Đăng nhập web trước,
rồi giữ nút Mic trên tab Chat, nói một câu tiếng Việt, thả ra.

Đạt: thấy dòng `🎙 <câu vừa nói>` (transcript thật từ faster-whisper qua
`POST /stt`, không phải placeholder), rồi câu trả lời của brain, và nghe
được giọng đọc trả lời (file mp3 từ Edge-TTS qua `POST /tts`, phát qua
`/audio/<id>.mp3`). Nếu voice service chưa chạy, backend phải trả lỗi 502
kèm hướng dẫn khởi động voice service bằng tiếng Việt, không được trả
transcript placeholder.

## Test 7 — Login / Auth (mới, v2.2)

```bash
# 1. Không token -> 401:
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" -d '{"message":"hi"}'
# Kỳ vọng: 401
# 2. Sai mật khẩu -> 401:
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" -d '{"password":"sai"}'
# Kỳ vọng: 401 {"error":"Sai mật khẩu"}
# 3. Đúng mật khẩu -> token, rồi chat được:
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"<ADMIN_PASSWORD>"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s -X POST http://localhost:4000/api/chat \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"message":"Phòng nào gần IUH mà dưới 4tr?"}'
# Kỳ vọng: trả lời chỉ Phòng 2 Nguyễn Thái Sơn 3.8tr (như Test 2).
# 4. Web: mở web chưa đăng nhập phải thấy màn hình đăng nhập; nhập sai
# mật khẩu báo "Sai mật khẩu", nhập đúng thì vào được tab Chat/Photos.
```

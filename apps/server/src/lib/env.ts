// Nạp biến môi trường cho server, theo thứ tự ưu tiên:
// 1. apps/server/.env (vị trí v2.1 đã dùng, xem GUIDE.md Bước 3)
// 2. .env ở repo root (vị trí compose dùng qua env_file, xem docker-compose.yml)
// 3. .env ở thư mục làm việc hiện tại (mặc định của dotenv)
// dotenv không ghi đè biến đã có, nên file nạp trước thắng.
// File này phải được import ĐẦU TIÊN trong index.ts, trước mọi route
// (vì lib/omniroute.ts đọc process.env ngay lúc module load).
import dotenv from "dotenv";
import path from "path";

const REPO_ROOT = path.resolve(__dirname, "../../../..");
dotenv.config({ path: path.join(REPO_ROOT, "apps", "server", ".env") });
dotenv.config({ path: path.join(REPO_ROOT, ".env") });
dotenv.config();

export const ENV = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin123",
  omnirouteBaseUrl:
    process.env.OMNIROUTE_BASE_URL ?? "http://localhost:20228/v1",
  omnirouteApiKey: process.env.OMNIROUTE_API_KEY ?? "",
  fastModel: process.env.FAST_MODEL ?? "omniroute/auto",
  chatModel: process.env.CHAT_MODEL ?? "omniroute/auto/coding",
  visionModel: process.env.VISION_MODEL ?? "omniroute/auto",
  voiceServiceUrl:
    process.env.VOICE_SERVICE_URL ?? "http://localhost:8000",
  voiceTtsVoice:
    process.env.VOICE_TTS_VOICE ?? "vi-VN-HoaiMyNeural",
  brainRoot: process.env.BRAIN_ROOT ?? REPO_ROOT,
};

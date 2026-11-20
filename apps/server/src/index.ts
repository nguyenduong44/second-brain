// env.ts phải import đầu tiên (nạp .env trước khi lib/omniroute đọc env).
import "./lib/env";
import express from "express";
import path from "path";
import { requireAuth } from "./middlewares/auth.middleware";
import { authRouter } from "./routes/auth";
import { calendarRouter } from "./routes/calendar";
import { chatRouter } from "./routes/chat";
import { handoffsRouter } from "./routes/handoffs";
import { photosRouter } from "./routes/photos";
import { voiceRouter } from "./routes/voice";
import { REPO_ROOT } from "./lib/wiki";

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
// File mp3 do TTS tạo ra: apps/server/public/audio/<id>.mp3
// (Public vì thẻ <audio> của trình duyệt không gửi được Authorization header;
// file mp3 chỉ là câu trả lời đã đọc, tạo lại được, và bị .gitignore.)
app.use("/audio", express.static(path.join(REPO_ROOT, "apps", "server", "public", "audio")));

app.use("/api/auth", authRouter);
// Calendar .ics CỐ TÌNH public để app Lịch subscribe bằng URL
// (xem routes/calendar.ts — đừng ghi thông tin nhạy cảm vào schedule.json).
app.use("/api/calendar", calendarRouter);

// Các route còn lại bắt buộc có JWT (POST /api/auth/login để lấy token).
app.use("/api/chat", requireAuth, chatRouter);
app.use("/api/voice", requireAuth, voiceRouter);
app.use("/api/photos", requireAuth, photosRouter);
app.use("/api/handoffs", requireAuth, handoffsRouter);
app.use(
  "/media/photos",
  requireAuth,
  express.static(path.join(REPO_ROOT, "raw-sources", "photos")),
);

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`second-brain server listening on http://localhost:${PORT}`);
});

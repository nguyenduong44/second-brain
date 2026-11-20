// GET /api/calendar/life.ics — lịch sinh hoạt dạng iCalendar.
// Đọc wiki/life/schedule.json (mảng {title, start, end, description?}).
// Route này CỐ TÌNH public (không qua requireAuth) để app Lịch trên điện
// thoại subscribe bằng URL. Rủi ro: ai biết URL cũng xem được lịch —
// đừng ghi thông tin nhạy cảm vào schedule.json; nếu cần, đổi sang link
// có token (xem deploy/README.md).
// Chưa có schedule.json thì trả 1 event mẫu chạy bộ ngày mai để test subscribe.
import { Router } from "express";
import fs from "fs";
import path from "path";
import { REPO_ROOT } from "../lib/wiki";

export const calendarRouter = Router();

interface ScheduleEvent {
  title: string;
  start: string;
  end: string;
  description?: string;
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function fmt(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

calendarRouter.get("/life.ics", (_req, res) => {
  let events: ScheduleEvent[] = [];
  try {
    events = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, "wiki", "life", "schedule.json"), "utf-8"),
    ) as ScheduleEvent[];
  } catch {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 30, 0, 0);
    const end = new Date(tomorrow.getTime() + 45 * 60_000);
    events = [
      {
        title: "Chạy bộ 45 phút (Second Brain)",
        start: tomorrow.toISOString(),
        end: end.toISOString(),
        description: "Lịch mẫu — sửa wiki/life/schedule.json để thay lịch thật.",
      },
    ];
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//second-brain//life//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Second Brain - Lịch Sinh Hoạt",
  ];
  for (const ev of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${encodeURIComponent(ev.title)}-${new Date(ev.start).getTime()}@second-brain`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(new Date(ev.start))}`,
      `DTEND:${fmt(new Date(ev.end))}`,
      `SUMMARY:${esc(ev.title)}`,
      `DESCRIPTION:${esc(ev.description ?? "")}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.send(lines.join("\r\n"));
});

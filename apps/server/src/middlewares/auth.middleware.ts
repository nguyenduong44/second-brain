// JWT auth cho web app. Chỉ 1 tài khoản duy nhất: owner (ADMIN_PASSWORD).
// Login ở routes/auth.ts cấp token 30 ngày; các route /api/* (trừ /api/health
// và /api/calendar/life.ics) đều qua middleware này.
// Lưu ý: JWT_SECRET mặc định chỉ để chạy local. Trước khi đưa lên VPS /
// mở ra internet, bắt buộc đổi JWT_SECRET (chuỗi dài hơn 32 ký tự) và
// ADMIN_PASSWORD trong .env — xem deploy/README.md.
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../lib/env";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Chưa đăng nhập — thiếu token. Gọi POST /api/auth/login trước." });
    return;
  }
  try {
    jwt.verify(header.slice(7), ENV.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: "Token không hợp lệ hoặc đã hết hạn. Đăng nhập lại." });
    return;
  }
}

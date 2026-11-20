// POST /api/auth/login { password } -> { token }
// So mật khẩu với ADMIN_PASSWORD trong .env, cấp JWT 30 ngày.
// Sai mật khẩu -> 401, không tiết lộ thêm gì.
import { Router } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../lib/env";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const password = String(req.body?.password ?? "");
  if (!password || password !== ENV.adminPassword) {
    return res.status(401).json({ error: "Sai mật khẩu" });
  }
  const token = jwt.sign({ role: "owner" }, ENV.jwtSecret, { expiresIn: "30d" });
  res.json({ token });
});

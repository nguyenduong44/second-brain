import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { buildPhotoAnalysisMd, VISION_PROMPT } from "../lib/vision";
import { appendLog, REPO_ROOT } from "../lib/wiki";

export const photosRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "photo";
}

// POST /api/photos — multipart photo.
// Lưu file gốc vào raw-sources/photos/YYYY-MM/ (bất biến), tạo wiki/photos/<slug>.md.
photosRouter.post("/", upload.single("photo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "thiếu file photo" });
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const slug = `${stamp}-${slugify(req.file.originalname)}`;
  const ext = path.extname(req.file.originalname) || ".jpg";
  const relPath = `raw-sources/photos/${ym}/${slug}${ext}`;
  const fullPath = path.join(REPO_ROOT, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, req.file.buffer);

  // TODO: gọi Vision Model qua OmniRoute với VISION_PROMPT + ảnh, lấy analysis thật.
  // Hiện tại ghi placeholder để test luồng lưu file trước.
  const analysis = `[Vision chưa nối — prompt đã sẵn trong vision.ts: ${VISION_PROMPT.split("\n")[0]}]`;
  const analysisPath = `wiki/photos/${slug}.md`;
  fs.writeFileSync(
    path.join(REPO_ROOT, analysisPath),
    buildPhotoAnalysisMd({ slug, originalRelPath: relPath, analysis, date: now.toISOString() }),
  );
  appendLog(`Photo Vault: ${slug} — gốc ${relPath}, phân tích ${analysisPath}`);
  res.json({ slug, analysisPath });
});

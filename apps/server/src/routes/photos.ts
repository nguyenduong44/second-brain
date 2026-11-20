import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { buildPhotoAnalysisMd } from "../lib/vision";
import { visionCompletions } from "../lib/omniroute";

import { appendLog, REPO_ROOT } from "../lib/wiki";

export const photosRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "photo"
  );
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

  let analysis: string;
  try {
    analysis = await visionCompletions(
      req.file.buffer.toString("base64"),
      req.file.mimetype || "image/jpeg",
    );
  } catch (e) {
    analysis = `[Vision lỗi: ${(e as Error).message}]`;
  }
  const analysisPath = `wiki/photos/${slug}.md`;
  fs.writeFileSync(
    path.join(REPO_ROOT, analysisPath),
    buildPhotoAnalysisMd({
      slug,
      originalRelPath: relPath,
      analysis,
      date: now.toISOString(),
    }),
  );

  // Cập nhật wiki/index.md: thêm 1 dòng tóm tắt cho ảnh mới (đúng luật AGENTS.md).
  // Chat luôn đọc index.md nên nhờ dòng này mà nó biết có ảnh mới dù tên file là timestamp.
  try {
    const indexPath = path.join(REPO_ROOT, "wiki", "index.md");
    const index = fs.readFileSync(indexPath, "utf-8");
    const firstLine = analysis.split("\n").find((l) => l.trim()) ?? "";
    const line = `- \`${analysisPath}\` — ${firstLine.slice(0, 120)}`;
    const photosAt = index.indexOf("## Ảnh — wiki/photos/");
    const nextSection = index.indexOf("\n## ", photosAt + 1);
    const insertAt = nextSection === -1 ? index.length : nextSection;
    fs.writeFileSync(
      indexPath,
      index.slice(0, insertAt) + `\n${line}` + index.slice(insertAt),
    );
  } catch {
    // index thiếu/lỗi thì bỏ qua, không làm gãy upload.
  }

  appendLog(`Photo Vault: ${slug} — gốc ${relPath}, phân tích ${analysisPath}`);
  res.json({ slug, analysisPath });
});

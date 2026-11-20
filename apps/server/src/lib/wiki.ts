// Đọc wiki theo ngân sách context: index trước, rồi tối đa 2–3 file liên quan.
import fs from "fs";
import path from "path";

// Repo root: ưu tiên BRAIN_ROOT (cần cho Docker, repo được mount vào
// /second-brain), mặc định là 2 cấp trên src/lib khi chạy local.
export const REPO_ROOT =
  process.env.BRAIN_ROOT ?? path.resolve(__dirname, "../../../..");
export const WIKI_DIR = path.join(REPO_ROOT, "wiki");

export function readIndex(): string {
  return fs.readFileSync(path.join(WIKI_DIR, "index.md"), "utf-8");
}

export function readWikiFile(rel: string): string {
  const full = path.resolve(WIKI_DIR, rel);
  if (!full.startsWith(WIKI_DIR)) throw new Error("wiki path ngoài phạm vi");
  return fs.readFileSync(full, "utf-8");
}

export function listWikiFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".md")) out.push(path.relative(WIKI_DIR, p));
    }
  };
  walk(WIKI_DIR);
  return out;
}

// Chọn 2–3 file liên quan nhất bằng khớp từ khóa đơn giản trong tên file + index.
// Bản skeleton: chưa dùng embedding, đủ cho test v2.
export function pickRelevant(question: string, max = 3): string[] {
  const words = question
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);
  const files = listWikiFiles().filter(
    (f) => f !== "index.md" && f !== "log.md",
  );
  const scored = files.map((f) => ({
    file: f,
    score: words.filter((w) => f.toLowerCase().includes(w)).length,
  }));
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => s.file);
}

export function appendLog(line: string): void {
  const stamp = new Date().toISOString();
  fs.appendFileSync(path.join(WIKI_DIR, "log.md"), `\n- ${stamp} — ${line}`);
}

// File phân tích ảnh mới nhất trong wiki/photos/ (trừ README.md).
// Tên file bắt đầu bằng timestamp ISO nên sort() là ra file mới nhất.
export function latestPhotoAnalysis(): string | null {
  const dir = path.join(WIKI_DIR, "photos");
  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md") && f !== "README.md");
    if (!files.length) return null;
    files.sort();
    return files[files.length - 1];
  } catch {
    return null;
  }
}

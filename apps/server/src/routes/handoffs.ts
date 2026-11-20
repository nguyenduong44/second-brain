// Handoffs: agent (dsh / OpenCode / Pi Agent / web) tạo yêu cầu chờ duyệt,
// owner bấm Approve / Reject trên web hoặc điện thoại.
// Lưu ở wiki/work/handoffs.json (file JSON, không phải note Markdown),
// để web đọc nhanh. Trạng thái: WAITING_APPROVAL | APPROVED | REJECTED.
import { Router } from "express";
import fs from "fs";
import path from "path";
import { REPO_ROOT } from "../lib/wiki";

export const handoffsRouter = Router();

interface HandoffItem {
  id: string;
  agent: string;
  project: string;
  summary: string;
  status: "WAITING_APPROVAL" | "APPROVED" | "REJECTED";
  feedback?: string;
  createdAt: string;
}

const handoffFile = () => path.join(REPO_ROOT, "wiki", "work", "handoffs.json");

function readHandoffs(): HandoffItem[] {
  try {
    return JSON.parse(fs.readFileSync(handoffFile(), "utf-8")) as HandoffItem[];
  } catch {
    return [];
  }
}

function writeHandoffs(items: HandoffItem[]): void {
  fs.mkdirSync(path.dirname(handoffFile()), { recursive: true });
  fs.writeFileSync(handoffFile(), JSON.stringify(items, null, 2), "utf-8");
}

handoffsRouter.get("/", (_req, res) => {
  res.json({ items: readHandoffs() });
});

handoffsRouter.post("/", (req, res) => {
  const { agent, project, summary } = req.body as Partial<HandoffItem>;
  if (!agent || !project || !summary) {
    return res.status(400).json({ error: "Thiếu agent, project hoặc summary" });
  }
  const items = readHandoffs();
  const created: HandoffItem = {
    id: String(Date.now()),
    agent,
    project,
    summary,
    status: "WAITING_APPROVAL",
    createdAt: new Date().toISOString(),
  };
  items.unshift(created);
  writeHandoffs(items);
  res.status(201).json(created);
});

handoffsRouter.patch("/:id", (req, res) => {
  const { status, feedback } = req.body as {
    status?: "APPROVED" | "REJECTED";
    feedback?: string;
  };
  if (status !== "APPROVED" && status !== "REJECTED") {
    return res.status(400).json({ error: "status phải là APPROVED hoặc REJECTED" });
  }
  const items = readHandoffs();
  const target = items.find((i) => i.id === req.params.id);
  if (!target) return res.status(404).json({ error: "Không tìm thấy handoff" });
  target.status = status;
  if (feedback) target.feedback = feedback;
  writeHandoffs(items);
  res.json(target);
});

import { Router } from "express";
import { CHAT_MODEL, chatCompletions } from "../lib/omniroute";
import { pickRelevant, readIndex, readWikiFile } from "../lib/wiki";

export const chatRouter = Router();

// POST /api/chat { message } — text, không dùng voice persona.
chatRouter.post("/", async (req, res) => {
  const message = String(req.body?.message ?? "").trim();
  if (!message) return res.status(400).json({ error: "message trống" });

  const index = readIndex();
  const relevant = pickRelevant(message, 3);
  const context = relevant.map((f) => `--- ${f} ---\n${readWikiFile(f)}`).join("\n\n");
  const reply = await chatCompletions(
    [
      {
        role: "user",
        content: `wiki/index.md:\n${index}\n\nCác file liên quan:\n${context}\n\nCâu hỏi: ${message}`,
      },
    ],
    { model: CHAT_MODEL, voiceMode: false },
  );
  res.json({ reply });
});

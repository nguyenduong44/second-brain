import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";
import { CHAT_MODEL, chatCompletions } from "../lib/omniroute";
import { ENV } from "../lib/env";
import {
  latestPhotoAnalysis,
  pickRelevant,
  readIndex,
  readWikiFile,
  REPO_ROOT,
} from "../lib/wiki";

export const voiceRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

const VOICE_URL = () =>
  (process.env.VOICE_SERVICE_URL ?? ENV.voiceServiceUrl).replace(/\/$/, "");

async function callStt(
  audio: Buffer,
  filename: string,
  mimetype: string,
): Promise<string> {
  // Convert Buffer to Uint8Array for Blob
  const uint8Array = new Uint8Array(audio);
  const form = new FormData();
  const blob = new Blob([uint8Array], { type: mimetype || "audio/webm" });
  form.append("file", blob, filename);
  let res: Response;
  try {
    res = await fetch(`${VOICE_URL()}/stt`, { method: "POST", body: form });
  } catch (e) {
    throw new Error(
      "Không kết nối được voice service ở " +
        VOICE_URL() +
        ". Chạy voice service trước: docker compose up -d voice (hoặc local: uvicorn apps.voice.main:app --port 8000). Chi tiết: " +
        (e as Error).message,
    );
  }
  if (!res.ok) throw new Error(`Voice service /stt lỗi: HTTP ${res.status}`);
  const data = (await res.json()) as { text?: string };
  return String(data.text ?? "").trim();
}

async function callTts(text: string): Promise<Buffer> {
  let res: Response;
  try {
    res = await fetch(`${VOICE_URL()}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: ENV.voiceTtsVoice }),
    });
  } catch (e) {
    throw new Error(
      "Không kết nối được voice service ở " +
        VOICE_URL() +
        ". Chạy voice service trước: docker compose up -d voice. Chi tiết: " +
        (e as Error).message,
    );
  }
  if (!res.ok) throw new Error(`Voice service /tts lỗi: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

voiceRouter.post("/", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "thiếu file audio" });

  const id = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const audioDir = path.join(REPO_ROOT, "apps", "server", "public", "audio");
  const outMp3 = path.join(audioDir, `${id}.mp3`);

  // 1. STT qua microservice
  let transcript: string;
  try {
    transcript = await callStt(
      req.file.buffer,
      req.file.originalname || "voice.webm",
      req.file.mimetype,
    );
  } catch (e) {
    return res.status(502).json({
      error: "Lỗi nhận diện giọng nói (STT). " + (e as Error).message,
    });
  }
  if (!transcript) {
    return res
      .status(400)
      .json({ error: "STT không nghe được gì, thử nói to / rõ hơn." });
  }

  // 2. Agent, chỉ đọc index + 2–3 file wiki liên quan
  const index = readIndex();
  const relevant = pickRelevant(transcript, 3);

  const context = relevant
    .map((f) => `--- ${f} ---\n${readWikiFile(f)}`)
    .join("\n\n");
  const latestPhoto = latestPhotoAnalysis();
  const photoContext = latestPhoto
    ? `\n\n--- Ảnh mới nhất (${latestPhoto}) ---\n${readWikiFile(`photos/${latestPhoto}`)}`
    : "";
  let reply: string;
  try {
    reply = await chatCompletions(
      [
        {
          role: "user",
          content: `wiki/index.md:\n${index}\n\nCác file liên quan:\n${context}${photoContext}\n\nCâu hỏi (voice): ${transcript}`,
        },
      ],
      { model: CHAT_MODEL, voiceMode: true },
    );
  } catch (e) {
    return res.status(502).json({
      error:
        "OmniRoute lỗi, kiểm tra server có chạy và OMNIROUTE_API_KEY đã set chưa. Chi tiết: " +
        (e as Error).message,
    });
  }

  // 3. TTS qua microservice -> file mp3
  try {
    fs.mkdirSync(audioDir, { recursive: true });
    fs.writeFileSync(outMp3, await callTts(reply));
  } catch (e) {
    return res.status(502).json({
      error: "TTS lỗi. " + (e as Error).message,
      transcript,
      reply,
    });
  }
  return res.json({ transcript, reply });
});

voiceRouter.post("/tts", async (req, res) => {
  const text = String(req.body?.text ?? "").trim();
  if (!text) return res.status(400).json({ error: "thiếu text" });

  const id = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const audioDir = path.join(REPO_ROOT, "apps", "server", "public", "audio");
  const outMp3 = path.join(audioDir, `${id}.mp3`);

  try {
    fs.mkdirSync(audioDir, { recursive: true });
    fs.writeFileSync(outMp3, await callTts(text));
  } catch (e) {
    return res.status(502).json({
      error: "TTS lỗi. " + (e as Error).message,
    });
  }
  return res.json({ audioUrl: `/audio/${id}.mp3` });
});

// Gọi OmniRoute (OpenAI-compatible) bằng fetch.
// Key chỉ đọc từ biến môi trường OMNIROUTE_API_KEY, không bao giờ hardcode.
import fs from "fs";
import path from "path";
import { VISION_PROMPT } from "./vision";

const BASE_URL = process.env.OMNIROUTE_BASE_URL ?? "http://localhost:20228/v1";
const API_KEY = process.env.OMNIROUTE_API_KEY ?? "";

// Phân luồng model theo tác vụ — routing rule của OmniRoute, KHÔNG phải
// tên model gốc. Đừng đổi thành tên model gốc (OmniRoute sẽ báo model not found).
export const FAST_MODEL = process.env.FAST_MODEL ?? "omniroute/auto";
export const CHAT_MODEL = process.env.CHAT_MODEL ?? "omniroute/auto/coding";
export const VISION_MODEL = process.env.VISION_MODEL ?? "omniroute/auto";

// Repo root: ưu tiên BRAIN_ROOT (cần cho Docker, repo được mount vào
// /second-brain), mặc định là 2 cấp trên src/lib khi chạy local.
export const BRAIN_ROOT =
  process.env.BRAIN_ROOT ?? path.resolve(__dirname, "../../../..");

// System prompt gốc: luật + hồ sơ, đọc từ repo root.
function loadTextPrompt(): string {
  const root = BRAIN_ROOT;
  const read = (f: string) => {
    try {
      return fs.readFileSync(path.join(root, f), "utf-8");
    } catch {
      return "";
    }
  };
  return [read("AGENTS.md"), read("user.md"), read("soul.md")].join("\n\n");
}

// Persona riêng cho voice: meme nhẹ, tự nhiên như chat với bạn.
// Chỉ kèm khi voiceMode = true. Chat text không dùng đoạn này.
const GENGAR_PERSONA = [
  "Bạn tên là Gengar, một con ma bóng tối thích troll nhẹ, nói chuyện như bạn thân.",
  "Meme cả khi chat text lẫn khi nói bằng giọng nói, không phân biệt chế độ.",
  "Nói tự nhiên, hài vừa phải, dùng tiếng Việt đời thường, chêm câu đùa ngắn khi phù hợp.",
  "Vẫn trả lời ngắn gọn, trực tiếp, đúng việc. Không dùng meme để né trả lời hoặc che việc không biết.",
  "Không biết thì nói không biết, rồi mới đùa nếu đùa.",
].join(" ");

export interface ChatOptions {
  model?: string;
  voiceMode?: boolean;
}

export async function chatCompletions(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  opts: ChatOptions = {},
): Promise<string> {
  if (!API_KEY) throw new Error("OMNIROUTE_API_KEY chưa set trong .env");
  const system = loadTextPrompt() + `\n\n${GENGAR_PERSONA}`;

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: opts.model ?? CHAT_MODEL,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!res.ok) throw new Error(`OmniRoute failed: ${res.status}`);
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message.content ?? "";
}

// Vision: gửi ảnh (base64) + VISION_PROMPT sang OmniRoute, lấy mô tả.
// Dùng endpoint /chat/completions chuẩn OpenAI-compatible, ảnh kèm dạng image_url.
export async function visionCompletions(
  imageBase64: string,
  mime: string,
): Promise<string> {
  if (!API_KEY) throw new Error("OMNIROUTE_API_KEY chưa set trong .env");
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: VISION_PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:${mime};base64,${imageBase64}` },
            },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OmniRoute vision failed: ${res.status}`);
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message.content ?? "";
}

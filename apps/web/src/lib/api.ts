// Gọi backend Express. Không gọi OmniRoute trực tiếp từ trình duyệt.
// Mọi route /api/* (trừ /api/health và /api/calendar/life.ics) đều cần
// JWT: đăng nhập 1 lần bằng ADMIN_PASSWORD, token lưu ở localStorage.
const API_BASE = import.meta.env.VITE_API_URL ?? "";

function token(): string | null {
  return localStorage.getItem("sb_token");
}

export function isLoggedIn(): boolean {
  return Boolean(token());
}

export function logout(): void {
  localStorage.removeItem("sb_token");
}

export async function login(password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error("Sai mật khẩu");
  const data = (await res.json()) as { token: string };
  localStorage.setItem("sb_token", data.token);
}

function authHeaders(): Record<string, string> {
  const t = token();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function checkAuth(res: Response): void {
  if (res.status === 401) {
    logout();
    throw new Error("Hết phiên đăng nhập, đăng nhập lại.");
  }
}

export async function sendChat(message: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ message }),
  });
  checkAuth(res);
  if (!res.ok) throw new Error(`chat failed: ${res.status}`);
  const data = (await res.json()) as { reply: string };
  return data.reply;
}

export async function sendVoiceChat(audio: Blob): Promise<{ transcript: string; reply: string }> {
  const form = new FormData();
  form.append("audio", audio, "voice.webm");
  const res = await fetch(`${API_BASE}/api/voice`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  checkAuth(res);
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `voice failed: ${res.status}`);
  }
  return res.json() as Promise<{ transcript: string; reply: string }>;
}

export async function fetchVoiceTts(text: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/voice/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ text }),
  });
  checkAuth(res);
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `tts failed: ${res.status}`);
  }
  const data = (await res.json()) as { audioUrl: string };
  return data.audioUrl ? `${API_BASE}${data.audioUrl}` : "";
}

export async function uploadPhoto(file: File): Promise<{ slug: string; analysisPath: string }> {
  const form = new FormData();
  form.append("photo", file);
  const res = await fetch(`${API_BASE}/api/photos`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  checkAuth(res);
  if (!res.ok) throw new Error(`photo upload failed: ${res.status}`);
  return res.json() as Promise<{ slug: string; analysisPath: string }>;
}

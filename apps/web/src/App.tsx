import { useRef, useState } from "react";
import {
  isLoggedIn,
  login,
  logout,
  sendChat,
  sendVoiceChat,
  fetchVoiceTts,
  uploadPhoto,
} from "./lib/api";

type Tab = "chat" | "photos";

export default function App() {
  const [authed, setAuthed] = useState(isLoggedIn());
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [photoResult, setPhotoResult] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);

  async function onSendChat() {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    const reply = await sendChat(text);
    setMessages((m) => [...m, { role: "assistant", text: reply }]);
  }

  // Push-to-talk: giữ nút Mic để thu, thả ra để gửi.
  // Không tự nghe liên tục: trình duyệt bắt buộc một lần bấm mic mỗi session.
  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const audio = new Blob(chunks, { type: "audio/webm" });
      try {
        const { transcript, reply } = await sendVoiceChat(audio);
        setMessages((m) => [
          ...m,
          { role: "user", text: `🎙 ${transcript}` },
          { role: "assistant", text: reply },
        ]);
        // Chữ đã hiện lên màn hình, giờ mới gọi TTS để phát tiếng song song.
        // TTS lỗi cũng không làm mất chữ, vì đã hiện rồi.
        fetchVoiceTts(reply)
          .then((audioUrl) => {
            if (audioUrl) new Audio(audioUrl).play().catch(() => undefined);
          })
          .catch(() => undefined);
      } catch (e) {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: `Voice lỗi: ${(e as Error).message}` },
        ]);
      }
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function onLogin() {
    try {
      await login(password);
      setPassword("");
      setLoginError("");
      setAuthed(true);
    } catch {
      setLoginError("Sai mật khẩu, thử lại.");
    }
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    const { slug, analysisPath } = await uploadPhoto(file);
    setPhotoResult(`Đã lưu: ${slug} → ${analysisPath}`);
  }

  if (!authed) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
        <h1>GENGAR</h1>
        <p>Nhập mật khẩu web (ADMIN_PASSWORD trong .env) để đăng nhập.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onLogin()}
          placeholder="Mật khẩu"
          style={{ width: "60%" }}
        />
        <button onClick={onLogin}>Đăng nhập</button>
        {loginError && <p>{loginError}</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>GENGAR</h1>
      <button
        onClick={() => {
          logout();
          setAuthed(false);
        }}
      >
        Đăng xuất
      </button>
      <div>
        <button onClick={() => setTab("chat")}>Chat</button>
        <button onClick={() => setTab("photos")}>Photos</button>
      </div>

      {tab === "chat" && (
        <div>
          <div>
            {messages.map((m, i) => (
              <p key={i}>
                <b>{m.role === "user" ? "Bạn" : "Brain"}:</b> {m.text}
              </p>
            ))}
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSendChat()}
            placeholder="Hỏi brain..."
            style={{ width: "70%" }}
          />
          <button onClick={onSendChat}>Gửi</button>
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
          >
            {recording ? "Đang thu... thả ra để gửi" : "Giữ để nói (Mic)"}
          </button>
        </div>
      )}

      {tab === "photos" && (
        <div>
          <p>Upload ảnh đời sống — file gốc lưu bất biến, bản phân tích lưu vào wiki/photos/.</p>
          <input type="file" accept="image/*" onChange={(e) => onPhoto(e.target.files?.[0])} />
          {photoResult && <p>{photoResult}</p>}
        </div>
      )}
    </div>
  );
}

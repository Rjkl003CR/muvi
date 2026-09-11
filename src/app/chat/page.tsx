import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 64px)",
        gap: 16,
        color: "var(--text-muted)",
        fontFamily: "var(--font-heading)",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "rgba(240,100,73,0.08)",
          border: "2px dashed var(--border-hover)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MessageCircle style={{ width: 32, height: 32, color: "var(--accent)" }} />
      </div>
      <h1
        style={{
          fontSize: "1.6rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: 0,
        }}
      >
        Chat
      </h1>
      <p style={{ margin: 0, fontSize: "0.95rem" }}>Coming soon — stay tuned!</p>
    </div>
  );
}

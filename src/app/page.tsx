import { DownloadForm } from "@/components/download-form";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="mesh-gradient" style={{ position: "relative", minHeight: "calc(100vh - 64px)" }}>
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 800,
          margin: "0 auto",
          padding: "60px 24px 80px",
        }}
      >
        {/* Hero Section */}
        <div
          className="animate-fade-in"
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <div
            className="animate-fade-in-delay-1"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 16,
            }}
          >
            <span className="badge badge-accent">
              <Sparkles style={{ width: 11, height: 11 }} />
              Cloud-Powered
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: 16,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Download movies
            <br />
            <span
              style={{
                background: "var(--gradient-accent)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              from any URL
            </span>
          </h1>

          <p
            className="animate-fade-in-delay-2"
            style={{
              fontSize: "1.05rem",
              color: "var(--text-secondary)",
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Paste a video link and we'll save it directly to your Google Drive.
            No local storage needed — zero footprint.
          </p>
        </div>

        {/* Download Form */}
        <div className="animate-fade-in-delay-3">
          <DownloadForm />
        </div>

        {/* Decorative Gradient Orb */}
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
            opacity: 0.12,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Link as LinkIcon,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  Film,
  Type,
} from "lucide-react";
import { getAccessToken } from "@/utils/token";
import { createClient } from "@/utils/supabase/client";

interface DownloadResult {
  id: string;
  title: string;
  drive_file_id: string;
  file_size: number;
}

export function DownloadForm() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "downloading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [lastDownload, setLastDownload] = useState<DownloadResult | null>(null);
  const [needsGoogle, setNeedsGoogle] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const token = getAccessToken();
    setNeedsGoogle(!token);
    
    // Check if we came back from Google login with pending download
    if (token) {
      const pendingUrl = sessionStorage.getItem("pending_download_url");
      const pendingTitle = sessionStorage.getItem("pending_download_title");
      if (pendingUrl) {
        setUrl(pendingUrl);
        setTitle(pendingTitle || "");
        sessionStorage.removeItem("pending_download_url");
        sessionStorage.removeItem("pending_download_title");
        
        // Give UI a tiny tick to update state then automatically start
        setTimeout(() => {
           // We can't safely call handleDownload from inside the effect without a bunch of deps.
           // We'll just set a flag to auto-start it or the user can click it.
           // Let's set a generic status message so the user knows to click!
           setStatus("success");
           setMessage("Google Drive connected! Click Download to start.");
        }, 100);
      }
    }
  }, []);

  const handleConnectGoogle = async () => {
    // Save current input to continue after redirect
    if (url) sessionStorage.setItem("pending_download_url", url);
    if (title) sessionStorage.setItem("pending_download_title", title);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/drive.file",
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  const extractFilenameFromUrl = (inputUrl: string): string => {
    try {
      const urlObj = new URL(inputUrl);
      const pathname = urlObj.pathname;
      const filename = pathname.split("/").pop() || "";
      // Remove extension and decode
      const decoded = decodeURIComponent(filename);
      const withoutExt = decoded.replace(/\.[^/.]+$/, "");
      // Clean up common URL artifacts
      return withoutExt.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
    } catch {
      return "";
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    // Auto-detect title from URL if user hasn't manually typed one
    if (!title || title === extractFilenameFromUrl(url)) {
      const detected = extractFilenameFromUrl(newUrl);
      if (detected) {
        setTitle(detected);
      }
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) return;

    const token = getAccessToken();
    if (!token) {
      setStatus("error");
      setMessage("Please sign in with Google first to enable downloads.");
      setNeedsGoogle(true);
      return;
    }

    setDownloading(true);
    setStatus("downloading");
    setProgress(10);
    setMessage("Starting download...");

    try {
      // Simulate progress while the server works
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + Math.random() * 8;
        });
      }, 800);

      setMessage("Fetching video from URL...");

      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim() || undefined,
          accessToken: token,
        }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Download failed (${res.status})`);
      }

      const data = await res.json();
      setProgress(100);
      setStatus("success");
      setMessage(`"${data.title}" saved to your library!`);
      setLastDownload(data);
      setUrl("");
      setTitle("");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "An error occurred during download.");
      setProgress(0);
    } finally {
      setDownloading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div
      className="glass-card gradient-border-card animate-fade-in"
      style={{
        padding: 32,
        maxWidth: 560,
        width: "100%",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.3rem",
            fontWeight: 700,
            marginBottom: 6,
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "var(--text-primary)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(240, 100, 73, 0.1)",
              border: "1px solid rgba(240, 100, 73, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Download style={{ width: 16, height: 16, color: "var(--accent)" }} />
          </div>
          Download Movie
        </h2>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Paste a direct video URL — we'll download and save it to your Google Drive.
        </p>
      </div>

      {/* URL Input */}
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            marginBottom: 8,
            fontFamily: "var(--font-heading)",
          }}
        >
          <LinkIcon style={{ width: 13, height: 13, color: "var(--accent)" }} />
          Video URL
        </label>
        <input
          type="url"
          className="input-glow"
          placeholder="https://example.com/movie.mp4"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          disabled={downloading}
          style={{ fontFamily: "var(--font-body)" }}
        />
      </div>

      {/* Title Input */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            marginBottom: 8,
            fontFamily: "var(--font-heading)",
          }}
        >
          <Type style={{ width: 13, height: 13, color: "var(--accent-gold)" }} />
          Movie Title
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 400,
              color: "var(--text-muted)",
            }}
          >
            (auto-detected or custom)
          </span>
        </label>
        <input
          type="text"
          className="input-glow"
          placeholder="My Awesome Movie"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={downloading}
          style={{ fontFamily: "var(--font-body)" }}
        />
      </div>

      {/* Progress Bar */}
      {status === "downloading" && (
        <div
          style={{ marginBottom: 20 }}
          className="animate-fade-in"
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--accent)",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Loader2
                style={{
                  width: 14,
                  height: 14,
                  animation: "spin-slow 1s linear infinite",
                }}
              />
              {message}
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Success Message */}
      {status === "success" && (
        <div
          className="animate-fade-in"
          style={{
            marginBottom: 20,
            padding: 14,
            borderRadius: 12,
            background: "rgba(34, 197, 94, 0.08)",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckCircle style={{ width: 18, height: 18, color: "#22c55e", flexShrink: 0 }} />
          <div>
            <p
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#22c55e",
                margin: 0,
              }}
            >
              {message}
            </p>
            {lastDownload && (
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  margin: "4px 0 0 0",
                }}
              >
                Size: {formatSize(lastDownload.file_size || 0)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {status === "error" && (
        <div
          className="animate-fade-in"
          style={{
            marginBottom: 20,
            padding: 14,
            borderRadius: 12,
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertCircle style={{ width: 18, height: 18, color: "#ef4444", flexShrink: 0 }} />
          <p
            style={{
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "#ef4444",
              margin: 0,
            }}
          >
            {message}
          </p>
        </div>
      )}

      {/* Download Button */}
      {needsGoogle ? (
        <button
          type="button"
          onClick={handleConnectGoogle}
          className="btn-primary"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontSize: "0.95rem",
            background: "var(--accent)",
            color: "#fff",
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Connect Google Drive to Download
        </button>
      ) : (
        <button
          type="button"
          onClick={handleDownload}
          disabled={!url.trim() || downloading}
          className="btn-primary"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontSize: "0.95rem",
          }}
        >
          {downloading ? (
            <>
              <Loader2
                style={{
                  width: 18,
                  height: 18,
                  animation: "spin-slow 1s linear infinite",
                }}
              />
              Downloading...
            </>
          ) : (
            <>
              <Film style={{ width: 18, height: 18 }} />
              Download & Save to Library
            </>
          )}
        </button>
      )}
    </div>
  );
}

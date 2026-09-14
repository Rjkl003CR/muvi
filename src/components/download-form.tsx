"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Link as LinkIcon,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  Film,
  Type,
  XCircle,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { getAccessToken, getValidAccessToken } from "@/utils/token";
import { createClient } from "@/utils/supabase/client";

interface DownloadResult {
  id: string;
  title: string;
  drive_file_id: string;
  file_size: number;
}

type DownloadStatus = "idle" | "downloading" | "paused" | "success" | "error" | "cancelled";

export function DownloadForm() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [message, setMessage] = useState("");
  const [lastDownload, setLastDownload] = useState<DownloadResult | null>(null);
  const [needsGoogle, setNeedsGoogle] = useState(false);
  const [pausedProgress, setPausedProgress] = useState(0);

  const supabase = createClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedUrlRef = useRef("");
  const savedTitleRef = useRef("");

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  useEffect(() => {
    const checkToken = async () => {
      const token = await getValidAccessToken();
      setNeedsGoogle(!token);

      if (token) {
        const pendingUrl = sessionStorage.getItem("pending_download_url");
        const pendingTitle = sessionStorage.getItem("pending_download_title");
        if (pendingUrl) {
          setUrl(pendingUrl);
          setTitle(pendingTitle || "");
          sessionStorage.removeItem("pending_download_url");
          sessionStorage.removeItem("pending_download_title");

          setTimeout(() => {
            setStatus("success");
            setMessage("Google Drive connected! Click Download to start.");
          }, 100);
        }
      }
    };
    checkToken();
  }, []);

  const handleConnectGoogle = async () => {
    if (url) sessionStorage.setItem("pending_download_url", url);
    if (title) sessionStorage.setItem("pending_download_title", title);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/drive.file",
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  };

  const extractFilenameFromUrl = (inputUrl: string): string => {
    try {
      const urlObj = new URL(inputUrl);
      const pathname = urlObj.pathname;
      const filename = pathname.split("/").pop() || "";
      const decoded = decodeURIComponent(filename);
      const withoutExt = decoded.replace(/\.[^/.]+$/, "");
      return withoutExt.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
    } catch {
      return "";
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (!title || title === extractFilenameFromUrl(url)) {
      const detected = extractFilenameFromUrl(newUrl);
      if (detected) {
        setTitle(detected);
      }
    }
  };

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const startProgressSimulation = useCallback((startFrom: number = 10) => {
    setProgress(startFrom);
    clearProgressInterval();
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearProgressInterval();
          return 90;
        }
        return prev + Math.random() * 5;
      });
    }, 800);
  }, [clearProgressInterval]);

  const handleDownload = async () => {
    if (!url.trim()) return;

    const token = await getValidAccessToken();
    if (!token) {
      setStatus("error");
      setMessage("Google Drive session expired. Please reconnect your Google account.");
      setNeedsGoogle(true);
      return;
    }

    // Save URL/title for resume
    savedUrlRef.current = url.trim();
    savedTitleRef.current = title.trim();

    // Create new AbortController for this download
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setDownloading(true);
    setStatus("downloading");
    setMessage("Starting download...");
    startProgressSimulation(10);

    try {
      setMessage("Fetching video & uploading to Drive...");

      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: savedUrlRef.current,
          title: savedTitleRef.current || undefined,
          accessToken: token,
        }),
        signal: controller.signal,
      });

      clearProgressInterval();

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
      abortControllerRef.current = null;
    } catch (err: any) {
      clearProgressInterval();
      if (err.name === "AbortError") {
        // Download was cancelled/stopped by the user
        return;
      }
      console.error(err);
      setStatus("error");
      setMessage(err.message || "An error occurred during download.");
      setProgress(0);
      abortControllerRef.current = null;
    } finally {
      setDownloading(false);
    }
  };

  const handleCancel = () => {
    // Completely cancel and reset
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearProgressInterval();
    setDownloading(false);
    setStatus("cancelled");
    setMessage("Download cancelled.");
    setProgress(0);
    // Restore URL/title so user can retry
    if (savedUrlRef.current) setUrl(savedUrlRef.current);
    if (savedTitleRef.current) setTitle(savedTitleRef.current);
  };

  const handleStop = () => {
    // Pause/stop — preserve progress for resume
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearProgressInterval();
    setPausedProgress(progress);
    setDownloading(false);
    setStatus("paused");
    setMessage("Download paused. Click Resume to continue.");
    // Restore URL/title
    if (savedUrlRef.current) setUrl(savedUrlRef.current);
    if (savedTitleRef.current) setTitle(savedTitleRef.current);
  };

  const handleResume = async () => {
    // Resume = restart the download (server re-fetches from URL)
    // Restore the saved URL/title if cleared
    if (savedUrlRef.current && !url) setUrl(savedUrlRef.current);
    if (savedTitleRef.current && !title) setTitle(savedTitleRef.current);

    const token = await getValidAccessToken();
    if (!token) {
      setStatus("error");
      setMessage("Google Drive session expired. Please reconnect your Google account.");
      setNeedsGoogle(true);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setDownloading(true);
    setStatus("downloading");
    setMessage("Resuming download...");
    // Start progress from where we left off
    startProgressSimulation(Math.max(pausedProgress, 10));

    try {
      setMessage("Fetching video & uploading to Drive...");

      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: savedUrlRef.current || url.trim(),
          title: savedTitleRef.current || title.trim() || undefined,
          accessToken: token,
        }),
        signal: controller.signal,
      });

      clearProgressInterval();

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
      abortControllerRef.current = null;
    } catch (err: any) {
      clearProgressInterval();
      if (err.name === "AbortError") return;
      console.error(err);
      setStatus("error");
      setMessage(err.message || "An error occurred during download.");
      setProgress(0);
      abortControllerRef.current = null;
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setMessage("");
    setProgress(0);
    setPausedProgress(0);
    savedUrlRef.current = "";
    savedTitleRef.current = "";
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Shared button style helper
  const controlBtnStyle = (color: string, bgAlpha: string, borderAlpha: string) => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: "10px 0",
    borderRadius: 10,
    border: `1px solid ${borderAlpha}`,
    background: bgAlpha,
    color: color,
    fontSize: "0.82rem",
    fontWeight: 600,
    fontFamily: "var(--font-heading)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  });

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

      {/* Progress Bar — shown during downloading or paused */}
      {(status === "downloading" || status === "paused") && (
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
                color: status === "paused" ? "var(--accent-gold)" : "var(--accent)",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {status === "paused" ? (
                <Pause style={{ width: 14, height: 14 }} />
              ) : (
                <Loader2
                  style={{
                    width: 14,
                    height: 14,
                    animation: "spin-slow 1s linear infinite",
                  }}
                />
              )}
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
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                transition: status === "paused" ? "none" : undefined,
                opacity: status === "paused" ? 0.6 : 1,
              }}
            />
          </div>

          {/* Download Controls — Stop / Cancel buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            {status === "downloading" && (
              <>
                <button
                  type="button"
                  onClick={handleStop}
                  style={controlBtnStyle(
                    "#f59e0b",
                    "rgba(245, 158, 11, 0.08)",
                    "rgba(245, 158, 11, 0.25)"
                  )}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(245, 158, 11, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(245, 158, 11, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.25)";
                  }}
                >
                  <Pause style={{ width: 14, height: 14 }} />
                  Stop
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={controlBtnStyle(
                    "#ef4444",
                    "rgba(239, 68, 68, 0.08)",
                    "rgba(239, 68, 68, 0.25)"
                  )}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.25)";
                  }}
                >
                  <XCircle style={{ width: 14, height: 14 }} />
                  Cancel
                </button>
              </>
            )}

            {status === "paused" && (
              <>
                <button
                  type="button"
                  onClick={handleResume}
                  style={controlBtnStyle(
                    "#22c55e",
                    "rgba(34, 197, 94, 0.08)",
                    "rgba(34, 197, 94, 0.25)"
                  )}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(34, 197, 94, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(34, 197, 94, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.25)";
                  }}
                >
                  <Play style={{ width: 14, height: 14 }} />
                  Resume
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={controlBtnStyle(
                    "#ef4444",
                    "rgba(239, 68, 68, 0.08)",
                    "rgba(239, 68, 68, 0.25)"
                  )}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.25)";
                  }}
                >
                  <XCircle style={{ width: 14, height: 14 }} />
                  Cancel
                </button>
              </>
            )}
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
          <div style={{ flex: 1 }}>
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
          <button
            type="button"
            onClick={handleResume}
            title="Retry download"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid rgba(239, 68, 68, 0.3)",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              fontSize: "0.78rem",
              fontWeight: 600,
              fontFamily: "var(--font-heading)",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
            }}
          >
            <RotateCcw style={{ width: 12, height: 12 }} />
            Retry
          </button>
        </div>
      )}

      {/* Cancelled Message */}
      {status === "cancelled" && (
        <div
          className="animate-fade-in"
          style={{
            marginBottom: 20,
            padding: 14,
            borderRadius: 12,
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <XCircle style={{ width: 18, height: 18, color: "#f59e0b", flexShrink: 0 }} />
          <p
            style={{
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "#f59e0b",
              margin: 0,
              flex: 1,
            }}
          >
            {message}
          </p>
          <button
            type="button"
            onClick={handleReset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid rgba(245, 158, 11, 0.3)",
              background: "rgba(245, 158, 11, 0.1)",
              color: "#f59e0b",
              fontSize: "0.78rem",
              fontWeight: 600,
              fontFamily: "var(--font-heading)",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(245, 158, 11, 0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(245, 158, 11, 0.1)";
            }}
          >
            <RotateCcw style={{ width: 12, height: 12 }} />
            New Download
          </button>
        </div>
      )}

      {/* Main Action Button */}
      {!downloading && status !== "paused" && (
        <>
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
              disabled={!url.trim()}
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
              <Film style={{ width: 18, height: 18 }} />
              Download &amp; Save to Library
            </button>
          )}
        </>
      )}
    </div>
  );
}

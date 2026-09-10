"use client";

import { useEffect, useState } from "react";
import { MovieCard } from "@/components/movie-card";
import { Film, Library as LibraryIcon, Loader2, RefreshCw } from "lucide-react";

interface Movie {
  id: string;
  title: string;
  drive_file_id: string;
  drive_view_url: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  original_url: string | null;
}

export default function LibraryPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMovies = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/movies");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch movies");
      }
      const data = await res.json();
      setMovies(data.movies || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/movies?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      setMovies((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(err.message || "Delete failed");
      throw err;
    }
  };

  return (
    <div
      className="mesh-gradient"
      style={{ position: "relative", minHeight: "calc(100vh - 64px)" }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "48px 24px 80px",
        }}
      >
        {/* Page Header */}
        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 40,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <LibraryIcon style={{ width: 18, height: 18, color: "var(--accent)" }} />
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                Your Collection
              </span>
            </div>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Movie Library
            </h1>
            {!loading && movies.length > 0 && (
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-muted)",
                  marginTop: 6,
                }}
              >
                {movies.length} movie{movies.length !== 1 ? "s" : ""} in your collection
              </p>
            )}
          </div>

          <button
            onClick={fetchMovies}
            disabled={loading}
            className="btn-ghost"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.85rem",
            }}
          >
            <RefreshCw
              style={{
                width: 15,
                height: 15,
                animation: loading ? "spin-slow 1s linear infinite" : "none",
              }}
            />
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 20px",
            }}
          >
            <Loader2
              style={{
                width: 36,
                height: 36,
                color: "var(--accent)",
                animation: "spin-slow 1s linear infinite",
                marginBottom: 16,
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.9rem",
                color: "var(--text-muted)",
              }}
            >
              Loading your movies...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            className="glass-card animate-fade-in"
            style={{
              padding: 32,
              textAlign: "center",
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            <p style={{ color: "#ef4444", fontWeight: 500, marginBottom: 16 }}>
              {error}
            </p>
            <button onClick={fetchMovies} className="btn-primary" style={{ fontSize: "0.85rem" }}>
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && movies.length === 0 && (
          <div className="empty-state animate-fade-in">
            <div className="empty-state-icon">
              <Film style={{ width: 32, height: 32 }} />
            </div>
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 8,
              }}
            >
              No movies yet
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-muted)",
                maxWidth: 360,
                lineHeight: 1.6,
              }}
            >
              Head over to the{" "}
              <a
                href="/"
                style={{
                  color: "var(--accent)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Download page
              </a>{" "}
              and paste a movie URL to get started.
            </p>
          </div>
        )}

        {/* Movies Grid */}
        {!loading && !error && movies.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {movies.map((movie, idx) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                index={idx}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

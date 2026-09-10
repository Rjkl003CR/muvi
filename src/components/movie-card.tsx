"use client";

import { Play, Trash2, Calendar, HardDrive, ExternalLink } from "lucide-react";
import { useState } from "react";

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

interface MovieCardProps {
  movie: Movie;
  index: number;
  onDelete: (id: string) => void;
}

export function MovieCard({ movie, index, onDelete }: MovieCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [hovered, setHovered] = useState(false);

  const formatSize = (bytes: number | null): string => {
    if (!bytes) return "Unknown";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${movie.title}" from your library?`)) return;
    setDeleting(true);
    try {
      await onDelete(movie.id);
    } catch {
      setDeleting(false);
    }
  };

  // Generate a warm gradient based on index for visual variety
  const gradients = [
    "linear-gradient(135deg, #f06449, #f7b731)",
    "linear-gradient(135deg, #f78ca2, #fda085)",
    "linear-gradient(135deg, #f7b731, #f06449)",
    "linear-gradient(135deg, #fda085, #f78ca2)",
    "linear-gradient(135deg, #f06449, #f78ca2)",
    "linear-gradient(135deg, #f7b731, #fda085)",
  ];
  const gradient = gradients[index % gradients.length];

  return (
    <div
      className="glass-card gradient-border-card"
      style={{
        overflow: "hidden",
        animation: `fade-in 0.5s ease-out ${index * 0.08}s forwards`,
        opacity: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Colored Top Bar */}
      <div style={{ height: 3, background: gradient, backgroundSize: "200% 100%" }} />

      {/* Card Body */}
      <div style={{ padding: 24 }}>
        {/* Title & Badges */}
        <div style={{ marginBottom: 16 }}>
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.15rem",
              fontWeight: 700,
              marginBottom: 8,
              color: "var(--text-primary)",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {movie.title}
          </h3>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <span className="badge badge-accent">
              <Calendar style={{ width: 10, height: 10 }} />
              {formatDate(movie.created_at)}
            </span>
            <span className="badge badge-gold">
              <HardDrive style={{ width: 10, height: 10 }} />
              {formatSize(movie.file_size)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href={movie.drive_view_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: "0.8rem",
              padding: "10px 16px",
              textDecoration: "none",
            }}
          >
            <Play style={{ width: 14, height: 14 }} />
            Play
          </a>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: "0.8rem",
              padding: "10px 14px",
              opacity: deleting ? 0.5 : 1,
            }}
          >
            <Trash2 style={{ width: 14, height: 14 }} />
            {deleting ? "..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

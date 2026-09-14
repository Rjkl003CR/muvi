"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Film, Search, Star, Play, Trash2, Edit3, X, RefreshCw,
  Loader2, Filter, ChevronDown, Check, LayoutGrid, List, Tag
} from "lucide-react";

// ── Types
interface Movie {
  id: string;
  title: string;
  drive_file_id: string;
  drive_view_url: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  original_url: string | null;
  genres?: string[] | null;
  release_year?: number | null;
  imdb_rating?: number | null;
  poster_url?: string | null;
}

type SortKey = "date_added" | "imdb_rating" | "release_year" | "title";
type ViewMode = "grid" | "list";

const ALL_GENRES = [
  "Action","Adventure","Animation","Comedy","Crime","Documentary",
  "Drama","Fantasy","Horror","Mystery","Romance","Sci-Fi","Thriller","Western"
];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS: number[] = Array.from({ length: CURRENT_YEAR - 1979 }, (_, i) => CURRENT_YEAR - i);

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
}
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function ratingColor(r: number): string {
  if (r >= 8) return "#f7b731";
  if (r >= 6) return "#34d399";
  return "#f06449";
}

// ── Movie Poster
function MoviePoster({ movie, index }: { movie: Movie; index: number }) {
  const grads = [
    "linear-gradient(160deg,#f06449,#f7b731)",
    "linear-gradient(160deg,#f78ca2,#fda085)",
    "linear-gradient(160deg,#a78bfa,#f06449)",
    "linear-gradient(160deg,#f7b731,#34d399)",
    "linear-gradient(160deg,#f06449,#f78ca2)",
    "linear-gradient(160deg,#fda085,#a78bfa)",
  ];
  const [imgErr, setImgErr] = useState(false);
  if (movie.poster_url && !imgErr) {
    return (
      <img src={movie.poster_url} alt={movie.title} onError={() => setImgErr(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    );
  }
  return (
    <div style={{
      width:"100%",height:"100%",background:grads[index%grads.length],
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,
    }}>
      <Film style={{ width:36,height:36,color:"rgba(255,255,255,0.7)" }} />
      <p style={{
        fontFamily:"var(--font-heading)",fontWeight:700,fontSize:"0.78rem",
        color:"rgba(255,255,255,0.85)",textAlign:"center",padding:"0 12px",
        display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden",margin:0,
      }}>{movie.title}</p>
    </div>
  );
}

// ── IMDb Star Badge
function ImdbBadge({ rating }: { rating: number }) {
  const c = ratingColor(rating);
  return (
    <div style={{
      position:"absolute",top:10,right:10,
      background:"rgba(0,0,0,0.72)",backdropFilter:"blur(6px)",
      borderRadius:8,padding:"4px 8px",display:"flex",alignItems:"center",gap:4,
    }}>
      <Star style={{ width:11,height:11,fill:c,color:c }} />
      <span style={{ fontSize:"0.74rem",fontFamily:"var(--font-heading)",fontWeight:700,color:c }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// ── Genre Dropdown
function GenreDropdown({ selected, onChange }: { selected: string[]; onChange: (v:string[])=>void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = (g: string) => onChange(selected.includes(g) ? selected.filter(x=>x!==g) : [...selected,g]);
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={() => setOpen(o=>!o)} style={{
        display:"flex",alignItems:"center",gap:7,padding:"9px 14px",borderRadius:12,
        border:"1px solid " + (selected.length?"var(--accent)":"var(--border-color)"),
        background:selected.length?"rgba(240,100,73,0.08)":"var(--bg-card)",
        color:selected.length?"var(--accent)":"var(--text-secondary)",
        fontFamily:"var(--font-heading)",fontSize:"0.84rem",fontWeight:600,
        cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s",
      }}>
        <Tag style={{ width:14,height:14 }} />
        {selected.length ? "Genres (" + selected.length + ")" : "All Genres"}
        <ChevronDown style={{ width:13,height:13,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s" }} />
      </button>
      {open && (
        <div style={{
          position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:200,
          width:260,maxHeight:300,overflowY:"auto",
          background:"var(--bg-card)",border:"1px solid var(--border-color)",
          borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",padding:8,
        }}>
          {ALL_GENRES.map(g => {
            const active = selected.includes(g);
            return (
              <button key={g} onClick={() => toggle(g)} style={{
                width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"8px 12px",borderRadius:9,border:"none",
                background:active?"rgba(240,100,73,0.08)":"transparent",
                color:active?"var(--accent)":"var(--text-primary)",
                fontFamily:"var(--font-heading)",fontSize:"0.84rem",fontWeight:500,
                cursor:"pointer",textAlign:"left",transition:"background 0.1s",
              }}>
                {g}
                {active && <Check style={{ width:13,height:13,color:"var(--accent)" }} />}
              </button>
            );
          })}
          {selected.length > 0 && (
            <button onClick={() => onChange([])} style={{
              width:"100%",marginTop:4,padding:"7px 12px",borderRadius:9,border:"none",
              background:"rgba(240,100,73,0.06)",color:"var(--accent)",
              fontFamily:"var(--font-heading)",fontSize:"0.8rem",fontWeight:600,cursor:"pointer",
            }}>Clear All</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Movie Card (Grid View)
function MovieCardGrid({ movie, index, onDelete, onEdit }: {
  movie:Movie; index:number;
  onDelete:(id:string)=>void;
  onEdit:(m:Movie)=>void;
}) {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (!confirm("Remove \"" + movie.title + "\" from your library?")) return;
    setDeleting(true);
    try { await onDelete(movie.id); } catch { setDeleting(false); }
  };
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius:18,overflow:"hidden",
        background:"var(--bg-card)",
        border:"1px solid " + (hovered?"var(--border-hover)":"var(--border-color)"),
        boxShadow:hovered?"var(--shadow-card-hover)":"var(--shadow-card)",
        transform:hovered?"translateY(-6px)":"translateY(0)",
        transition:"all 0.25s cubic-bezier(0.4,0,0.2,1)",
        animation:"fade-in 0.4s ease-out " + (index*0.06) + "s forwards",
        opacity:0,display:"flex",flexDirection:"column",
      }}
    >
      <div style={{ position:"relative",width:"100%",aspectRatio:"2/3",overflow:"hidden",flexShrink:0 }}>
        <MoviePoster movie={movie} index={index} />
        <div style={{
          position:"absolute",inset:0,
          background:"linear-gradient(to top,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.3) 50%,transparent 100%)",
          opacity:hovered?1:0,transition:"opacity 0.25s",
          display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"16px 14px",
        }}>
          <div style={{ display:"flex",gap:8 }}>
            <a href={movie.drive_view_url} target="_blank" rel="noopener noreferrer" style={{
              flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,
              padding:"9px 12px",borderRadius:10,background:"var(--gradient-accent)",
              color:"white",fontFamily:"var(--font-heading)",fontWeight:600,
              fontSize:"0.82rem",textDecoration:"none",
            }}>
              <Play style={{ width:13,height:13 }} /> Play
            </a>
            <button onClick={() => onEdit(movie)} style={{
              padding:9,borderRadius:10,background:"rgba(255,255,255,0.15)",
              backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.2)",
              color:"white",cursor:"pointer",display:"flex",alignItems:"center",
            }}>
              <Edit3 style={{ width:13,height:13 }} />
            </button>
            <button onClick={handleDelete} disabled={deleting} style={{
              padding:9,borderRadius:10,background:"rgba(240,100,73,0.3)",
              backdropFilter:"blur(8px)",border:"1px solid rgba(240,100,73,0.4)",
              color:"white",cursor:"pointer",opacity:deleting?0.5:1,display:"flex",alignItems:"center",
            }}>
              <Trash2 style={{ width:13,height:13 }} />
            </button>
          </div>
        </div>
        {movie.imdb_rating != null && <ImdbBadge rating={movie.imdb_rating} />}
        {movie.release_year && (
          <div style={{
            position:"absolute",top:10,left:10,
            background:"rgba(0,0,0,0.65)",backdropFilter:"blur(6px)",
            borderRadius:8,padding:"3px 8px",
          }}>
            <span style={{ fontSize:"0.72rem",fontFamily:"var(--font-heading)",fontWeight:600,color:"rgba(255,255,255,0.9)" }}>
              {movie.release_year}
            </span>
          </div>
        )}
      </div>
      <div style={{ padding:"14px 16px 16px",flex:1,display:"flex",flexDirection:"column",gap:8 }}>
        <h3 style={{
          margin:0,fontFamily:"var(--font-heading)",fontWeight:700,fontSize:"0.95rem",
          color:"var(--text-primary)",
          display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",lineHeight:1.3,
        }}>{movie.title}</h3>
        {movie.genres && movie.genres.length > 0 && (
          <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
            {movie.genres.slice(0,3).map(g => (
              <span key={g} style={{
                fontSize:"0.64rem",fontFamily:"var(--font-heading)",fontWeight:600,
                padding:"2px 8px",borderRadius:10,
                background:"rgba(240,100,73,0.08)",color:"var(--accent)",
                border:"1px solid rgba(240,100,73,0.15)",
              }}>{g}</span>
            ))}
          </div>
        )}
        <p style={{ margin:0,fontSize:"0.72rem",color:"var(--text-muted)",fontFamily:"var(--font-body)" }}>
          Added {formatDate(movie.created_at)}{movie.file_size?" · "+formatSize(movie.file_size):""}
        </p>
      </div>
    </div>
  );
}

// ── Movie Row (List View)
function MovieRowList({ movie, index, onDelete, onEdit }: {
  movie:Movie; index:number;
  onDelete:(id:string)=>void;
  onEdit:(m:Movie)=>void;
}) {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (!confirm("Remove \"" + movie.title + "\" from your library?")) return;
    setDeleting(true);
    try { await onDelete(movie.id); } catch { setDeleting(false); }
  };
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:"flex",alignItems:"center",gap:16,padding:"12px 16px",borderRadius:14,
        background:hovered?"var(--bg-card-hover)":"var(--bg-card)",
        border:"1px solid " + (hovered?"var(--border-hover)":"var(--border-color)"),
        boxShadow:hovered?"var(--shadow-card-hover)":"var(--shadow-card)",
        transition:"all 0.2s",
        animation:"fade-in 0.4s ease-out " + (index*0.04) + "s forwards",opacity:0,
      }}
    >
      <div style={{ width:52,height:76,borderRadius:10,overflow:"hidden",flexShrink:0 }}>
        <MoviePoster movie={movie} index={index} />
      </div>
      <div style={{ flex:1,minWidth:0 }}>
        <h3 style={{
          margin:"0 0 4px",fontFamily:"var(--font-heading)",fontWeight:700,fontSize:"1rem",
          color:"var(--text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
        }}>{movie.title}</h3>
        <div style={{ display:"flex",alignItems:"center",flexWrap:"wrap",gap:8 }}>
          {movie.release_year && (
            <span style={{ fontSize:"0.75rem",color:"var(--text-muted)",fontFamily:"var(--font-body)" }}>
              {movie.release_year}
            </span>
          )}
          {movie.imdb_rating != null && (
            <span style={{ display:"flex",alignItems:"center",gap:3,fontSize:"0.75rem",fontFamily:"var(--font-heading)",fontWeight:600,color:ratingColor(movie.imdb_rating) }}>
              <Star style={{ width:11,height:11,fill:ratingColor(movie.imdb_rating) }} />
              {movie.imdb_rating.toFixed(1)}
            </span>
          )}
          {movie.genres?.slice(0,2).map(g => (
            <span key={g} style={{
              fontSize:"0.64rem",fontFamily:"var(--font-heading)",fontWeight:600,
              padding:"2px 8px",borderRadius:10,
              background:"rgba(240,100,73,0.08)",color:"var(--accent)",
              border:"1px solid rgba(240,100,73,0.15)",
            }}>{g}</span>
          ))}
        </div>
        <p style={{ margin:"4px 0 0",fontSize:"0.7rem",color:"var(--text-muted)",fontFamily:"var(--font-body)" }}>
          Added {formatDate(movie.created_at)}{movie.file_size?" · "+formatSize(movie.file_size):""}
        </p>
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
        <a href={movie.drive_view_url} target="_blank" rel="noopener noreferrer" className="btn-primary"
          style={{ display:"flex",alignItems:"center",gap:6,fontSize:"0.82rem",padding:"8px 14px",textDecoration:"none" }}>
          <Play style={{ width:13,height:13 }} /> Play
        </a>
        <button onClick={() => onEdit(movie)} className="btn-ghost"
          style={{ padding:"8px 10px",display:"flex",alignItems:"center" }}>
          <Edit3 style={{ width:15,height:15 }} />
        </button>
        <button onClick={handleDelete} disabled={deleting} className="btn-ghost"
          style={{ padding:"8px 10px",display:"flex",alignItems:"center",color:"#ef4444",opacity:deleting?0.5:1 }}>
          <Trash2 style={{ width:15,height:15 }} />
        </button>
      </div>
    </div>
  );
}

// ── Edit Modal
function EditModal({ movie, onClose, onSave }: {
  movie:Movie; onClose:()=>void;
  onSave:(updated:Partial<Movie>)=>Promise<void>;
}) {
  const [title, setTitle] = useState(movie.title);
  const [posterUrl, setPosterUrl] = useState(movie.poster_url||"");
  const [year, setYear] = useState(movie.release_year?.toString()||"");
  const [rating, setRating] = useState(movie.imdb_rating?.toString()||"");
  const [selGenres, setSelGenres] = useState<string[]>(movie.genres||[]);
  const [saving, setSaving] = useState(false);
  const toggleGenre = (g:string) => setSelGenres(prev=>prev.includes(g)?prev.filter(x=>x!==g):[...prev,g]);
  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await onSave({
      title:title.trim(),
      poster_url:posterUrl.trim()||null,
      release_year:year?parseInt(year):null,
      imdb_rating:rating?parseFloat(rating):null,
      genres:selGenres,
    });
    setSaving(false); onClose();
  };
  return (
    <div style={{
      position:"fixed",inset:0,
      background:"rgba(0,0,0,0.65)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16,
    }}>
      <div style={{
        width:"100%",maxWidth:520,maxHeight:"90vh",
        background:"var(--bg-card)",borderRadius:22,border:"1px solid var(--border-color)",
        padding:"28px",boxShadow:"0 20px 60px rgba(0,0,0,0.3)",
        overflowY:"auto",display:"flex",flexDirection:"column",gap:18,
      }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <h2 style={{ margin:0,fontFamily:"var(--font-heading)",fontSize:"1.2rem",fontWeight:800,color:"var(--text-primary)" }}>
            Edit Movie Info
          </h2>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:4 }}>
            <X style={{ width:20,height:20 }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div>
            <label style={{ display:"block",marginBottom:6,fontSize:"0.8rem",fontFamily:"var(--font-heading)",fontWeight:600,color:"var(--text-secondary)" }}>Title *</label>
            <input required value={title} onChange={e=>setTitle(e.target.value)} style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid var(--border-color)",background:"var(--bg-input)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"0.88rem",outline:"none",boxSizing:"border-box" }} />
          </div>
          <div>
            <label style={{ display:"block",marginBottom:6,fontSize:"0.8rem",fontFamily:"var(--font-heading)",fontWeight:600,color:"var(--text-secondary)" }}>Poster Image URL (optional)</label>
            <input value={posterUrl} onChange={e=>setPosterUrl(e.target.value)} placeholder="https://image.tmdb.org/..." style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid var(--border-color)",background:"var(--bg-input)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"0.88rem",outline:"none",boxSizing:"border-box" }} />
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            <div>
              <label style={{ display:"block",marginBottom:6,fontSize:"0.8rem",fontFamily:"var(--font-heading)",fontWeight:600,color:"var(--text-secondary)" }}>Release Year</label>
              <input type="number" min="1900" max={CURRENT_YEAR+2} value={year} onChange={e=>setYear(e.target.value)} placeholder={String(CURRENT_YEAR)} style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid var(--border-color)",background:"var(--bg-input)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"0.88rem",outline:"none",boxSizing:"border-box" }} />
            </div>
            <div>
              <label style={{ display:"block",marginBottom:6,fontSize:"0.8rem",fontFamily:"var(--font-heading)",fontWeight:600,color:"var(--text-secondary)" }}>IMDb Rating (0-10)</label>
              <input type="number" min="0" max="10" step="0.1" value={rating} onChange={e=>setRating(e.target.value)} placeholder="8.5" style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid var(--border-color)",background:"var(--bg-input)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"0.88rem",outline:"none",boxSizing:"border-box" }} />
            </div>
          </div>
          <div>
            <label style={{ display:"block",marginBottom:8,fontSize:"0.8rem",fontFamily:"var(--font-heading)",fontWeight:600,color:"var(--text-secondary)" }}>Genres</label>
            <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
              {ALL_GENRES.map(g => {
                const active = selGenres.includes(g);
                return (
                  <button key={g} type="button" onClick={() => toggleGenre(g)} style={{
                    padding:"5px 12px",borderRadius:20,
                    border:"1px solid " + (active?"var(--accent)":"var(--border-color)"),
                    background:active?"var(--gradient-accent)":"var(--bg-input)",
                    color:active?"white":"var(--text-secondary)",
                    fontSize:"0.74rem",fontFamily:"var(--font-heading)",fontWeight:600,
                    cursor:"pointer",transition:"all 0.15s",
                  }}>{g}</button>
                );
              })}
            </div>
          </div>
          <div style={{ display:"flex",justifyContent:"flex-end",gap:10,marginTop:6 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ fontSize:"0.86rem",padding:"10px 18px" }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ fontSize:"0.86rem",padding:"10px 24px" }}>
              {saving?"Saving\u2026":"Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page
export default function LibraryPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingMovie, setEditingMovie] = useState<Movie|null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date_added");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const fetchMovies = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/movies");
      if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error||"Failed to fetch");
      const data = await res.json();
      let fetchedMovies = data.movies || [];
      if (fetchedMovies.length === 0) {
        fetchedMovies = [
          {
            id: 'demo-1', title: 'Inception', drive_file_id: 'x', drive_view_url: '#', file_size: 2*1024*1024*1024,
            mime_type: 'video/mp4', created_at: new Date().toISOString(), original_url: null, genres: ['Action', 'Sci-Fi'], release_year: 2010, imdb_rating: 8.8, poster_url: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg'
          },
          {
            id: 'demo-2', title: 'The Dark Knight', drive_file_id: 'y', drive_view_url: '#', file_size: 1.5*1024*1024*1024,
            mime_type: 'video/mp4', created_at: new Date().toISOString(), original_url: null, genres: ['Action', 'Crime'], release_year: 2008, imdb_rating: 9.0, poster_url: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg'
          },
          {
            id: 'demo-3', title: 'Interstellar', drive_file_id: 'z', drive_view_url: '#', file_size: 3*1024*1024*1024,
            mime_type: 'video/mp4', created_at: new Date().toISOString(), original_url: null, genres: ['Adventure', 'Sci-Fi'], release_year: 2014, imdb_rating: 8.7, poster_url: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'
          },
          {
            id: 'demo-4', title: 'Dune: Part Two', drive_file_id: 'a', drive_view_url: '#', file_size: 4*1024*1024*1024,
            mime_type: 'video/mp4', created_at: new Date().toISOString(), original_url: null, genres: ['Adventure', 'Sci-Fi'], release_year: 2024, imdb_rating: 8.6, poster_url: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGjjcNsV.jpg'
          }
        ];
      }
      setMovies(fetchedMovies);
    } catch (err: any) { setError(err.message||"Something went wrong"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  const handleDelete = useCallback(async (id:string) => {
    const res = await fetch("/api/movies?id="+id, { method:"DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    setMovies(prev => prev.filter(m => m.id !== id));
  }, []);

  const handleSave = useCallback(async (updated: Partial<Movie>) => {
    if (!editingMovie) return;
    const res = await fetch("/api/movies", {
      method:"PUT",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ id:editingMovie.id, ...updated }),
    });
    if (!res.ok) { alert("Failed to save changes"); return; }
    const { movie } = await res.json();
    setMovies(prev => prev.map(m => m.id === editingMovie.id ? { ...m,...movie } : m));
  }, [editingMovie]);

  const filteredMovies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return movies.filter(m => {
      const matchQ = !q||m.title.toLowerCase().includes(q)||m.genres?.some(g=>g.toLowerCase().includes(q));
      const matchGenres = selectedGenres.length===0||selectedGenres.some(g=>m.genres?.includes(g));
      const matchYear = !selectedYear||m.release_year?.toString()===selectedYear;
      return matchQ&&matchGenres&&matchYear;
    }).sort((a,b) => {
      if (sortKey==="imdb_rating") return (b.imdb_rating||0)-(a.imdb_rating||0);
      if (sortKey==="release_year") return (b.release_year||0)-(a.release_year||0);
      if (sortKey==="title") return a.title.localeCompare(b.title);
      return new Date(b.created_at).getTime()-new Date(a.created_at).getTime();
    });
  }, [movies, searchQuery, selectedGenres, selectedYear, sortKey]);

  const hasFilters = !!(searchQuery||selectedGenres.length>0||selectedYear);
  const clearFilters = () => { setSearchQuery(""); setSelectedGenres([]); setSelectedYear(""); };

  return (
    <div style={{ minHeight:"calc(100vh - 64px)",background:"var(--bg-primary)" }}>
      <div style={{ maxWidth:1280,margin:"0 auto",padding:"32px 28px 80px" }}>

        {/* Header */}
        <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:16,marginBottom:32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width:44,height:44,borderRadius:12,
              background:"var(--gradient-accent)",
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:"0 4px 18px rgba(240,100,73,0.3)",
            }}>
              <Film style={{ width:22,height:22,color:"white" }} />
            </div>
            <div>
              <h1 style={{ margin:0,fontFamily:"var(--font-heading)",fontSize:"1.65rem",fontWeight:800,color:"var(--text-primary)" }}>
                Movie Library
              </h1>
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <button onClick={fetchMovies} disabled={loading} className="btn-ghost"
              style={{ display:"flex",alignItems:"center",gap:7,fontSize:"0.84rem",padding:"9px 14px" }}>
              <RefreshCw style={{ width:14,height:14,animation:loading?"spin-slow 1s linear infinite":"none" }} />
              Refresh
            </button>
            <div style={{ display:"flex",gap:3,background:"var(--bg-card)",padding:4,borderRadius:12,border:"1px solid var(--border-color)" }}>
              {(["grid","list"] as ViewMode[]).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{
                  padding:"7px 10px",borderRadius:8,border:"none",cursor:"pointer",
                  background:viewMode===mode?"var(--gradient-accent)":"transparent",
                  color:viewMode===mode?"white":"var(--text-muted)",transition:"all 0.15s",
                }}>
                  {mode==="grid"?<LayoutGrid style={{ width:16,height:16 }} />:<List style={{ width:16,height:16 }} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div style={{
          position: "relative", zIndex: 50,
          display:"flex",flexWrap:"wrap",gap:12,marginBottom:28,
          padding:"16px 20px",borderRadius:16,
          background:"var(--bg-card)",border:"1px solid var(--border-color)",
          backdropFilter:"blur(12px)",
        }}>
          <div style={{ position:"relative",flex:"1 1 240px",minWidth:200 }}>
            <Search style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",width:15,height:15,color:"var(--text-muted)",pointerEvents:"none" }} />
            <input
              type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
              placeholder="Search by title or genre\u2026"
              style={{
                width:"100%",padding:"9px 36px 9px 36px",borderRadius:10,
                border:"1px solid var(--border-color)",background:"var(--bg-input)",
                color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"0.86rem",
                outline:"none",boxSizing:"border-box",
              }}
            />
            {searchQuery && (
              <button onClick={()=>setSearchQuery("")} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:2 }}>
                <X style={{ width:14,height:14 }} />
              </button>
            )}
          </div>

          <GenreDropdown selected={selectedGenres} onChange={setSelectedGenres} />

          <div style={{ position:"relative" }}>
            <select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} style={{
              padding:"9px 36px 9px 14px",borderRadius:12,
              border:"1px solid "+(selectedYear?"var(--accent)":"var(--border-color)"),
              background:selectedYear?"rgba(240,100,73,0.08)":"var(--bg-card)",
              color:selectedYear?"var(--accent)":"var(--text-secondary)",
              fontFamily:"var(--font-heading)",fontSize:"0.84rem",fontWeight:600,
              cursor:"pointer",outline:"none",appearance:"none",
            }}>
              <option value="">All Years</option>
              {YEAR_OPTIONS.map(y=><option key={y} value={String(y)}>{y}</option>)}
            </select>
            <ChevronDown style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",width:14,height:14,color:"var(--text-muted)",pointerEvents:"none" }} />
          </div>

          <div style={{ position:"relative" }}>
            <select value={sortKey} onChange={e=>setSortKey(e.target.value as SortKey)} style={{
              padding:"9px 36px 9px 14px",borderRadius:12,
              border:"1px solid var(--border-color)",background:"var(--bg-card)",
              color:"var(--text-secondary)",
              fontFamily:"var(--font-heading)",fontSize:"0.84rem",fontWeight:600,
              cursor:"pointer",outline:"none",appearance:"none",
            }}>
              <option value="date_added">Sort: Date Added</option>
              <option value="imdb_rating">Sort: IMDb Rating</option>
              <option value="release_year">Sort: Release Year</option>
              <option value="title">Sort: Title A\u2013Z</option>
            </select>
            <ChevronDown style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",width:14,height:14,color:"var(--text-muted)",pointerEvents:"none" }} />
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost"
              style={{ display:"flex",alignItems:"center",gap:6,fontSize:"0.82rem",padding:"9px 14px",color:"var(--accent)" }}>
              <X style={{ width:13,height:13 }} /> Clear Filters
            </button>
          )}
        </div>

        {loading && (
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"100px 0",gap:14 }}>
            <Loader2 style={{ width:36,height:36,color:"var(--accent)",animation:"spin-slow 1s linear infinite" }} />
            <p style={{ fontFamily:"var(--font-heading)",fontSize:"0.95rem",color:"var(--text-muted)",margin:0 }}>
              Loading your movie collection\u2026
            </p>
          </div>
        )}

        {!loading&&error&&(
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 24px",background:"var(--bg-card)",borderRadius:20,border:"1px dashed rgba(240,100,73,0.3)",textAlign:"center",gap:14 }}>
            <p style={{ color:"#ef4444",fontWeight:500,fontFamily:"var(--font-heading)",margin:0 }}>{error}</p>
            <button onClick={fetchMovies} className="btn-primary" style={{ fontSize:"0.85rem" }}>Try Again</button>
          </div>
        )}

        {!loading&&!error&&movies.length===0&&(
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"100px 24px",background:"var(--bg-card)",borderRadius:24,border:"1px dashed var(--border-hover)",textAlign:"center",gap:18 }}>
            <div style={{ width:72,height:72,borderRadius:"50%",background:"rgba(240,100,73,0.08)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Film style={{ width:32,height:32,color:"var(--accent)" }} />
            </div>
            <div>
              <h3 style={{ margin:"0 0 8px",fontFamily:"var(--font-heading)",fontSize:"1.25rem",fontWeight:700,color:"var(--text-primary)" }}>
                Your library is empty
              </h3>
              <p style={{ margin:0,fontSize:"0.88rem",color:"var(--text-muted)",fontFamily:"var(--font-body)",maxWidth:360,lineHeight:1.6 }}>
                Go to the <a href="/" style={{ color:"var(--accent)",textDecoration:"none",fontWeight:600 }}>Download page</a> and paste a movie URL to add your first film.
              </p>
            </div>
          </div>
        )}

        {!loading&&!error&&movies.length>0&&filteredMovies.length===0&&(
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"60px 24px",background:"var(--bg-card)",borderRadius:20,border:"1px dashed var(--border-hover)",textAlign:"center",gap:12 }}>
            <Filter style={{ width:28,height:28,color:"var(--text-muted)" }} />
            <h3 style={{ margin:"0 0 6px",fontFamily:"var(--font-heading)",color:"var(--text-primary)" }}>No movies match your filters</h3>
            <button onClick={clearFilters} className="btn-ghost" style={{ fontSize:"0.84rem" }}>Clear Filters</button>
          </div>
        )}

        {!loading&&!error&&filteredMovies.length>0&&viewMode==="grid"&&(
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:20 }}>
            {filteredMovies.map((m,i)=>(
              <MovieCardGrid key={m.id} movie={m} index={i} onDelete={handleDelete} onEdit={setEditingMovie} />
            ))}
          </div>
        )}

        {!loading&&!error&&filteredMovies.length>0&&viewMode==="list"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {filteredMovies.map((m,i)=>(
              <MovieRowList key={m.id} movie={m} index={i} onDelete={handleDelete} onEdit={setEditingMovie} />
            ))}
          </div>
        )}
      </div>

      {editingMovie&&(
        <EditModal movie={editingMovie} onClose={()=>setEditingMovie(null)} onSave={handleSave} />
      )}
    </div>
  );
}

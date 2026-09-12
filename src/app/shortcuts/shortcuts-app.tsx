"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Zap, Plus, Search, ExternalLink, Copy, Check, Star,
  Trash2, Edit3, Globe, Database, Sparkles, FolderPlus,
  Loader2, RefreshCw, X, Shield, ArrowUpRight, Download, Upload,
  LayoutGrid, List
} from "lucide-react";

export interface ShortcutItem {
  id: string;
  title: string;
  url: string;
  username_hint?: string;
  category: string;
  color?: string;
  pinned?: boolean;
  clicks?: number;
  createdAt: string;
  updatedAt: string;
}

// Preset library for quick-adding popular services
const PRESET_SERVICES = [
  { name: "Google Accounts", url: "https://accounts.google.com", category: "Cloud & Dev", color: "gold" },
  { name: "GitHub", url: "https://github.com/login", category: "Cloud & Dev", color: "lavender" },
  { name: "Supabase", url: "https://supabase.com/dashboard/sign-in", category: "Cloud & Dev", color: "mint" },
  { name: "Vercel", url: "https://vercel.com/login", category: "Cloud & Dev", color: "default" },
  { name: "Cloudflare", url: "https://dash.cloudflare.com/login", category: "Cloud & Dev", color: "coral" },
  { name: "Netflix", url: "https://www.netflix.com/login", category: "Streaming", color: "coral" },
  { name: "Disney+", url: "https://www.disneyplus.com/login", category: "Streaming", color: "lavender" },
  { name: "Amazon Prime", url: "https://www.amazon.com/ap/signin", category: "Streaming", color: "gold" },
  { name: "Spotify", url: "https://accounts.spotify.com/en/login", category: "Streaming", color: "mint" },
  { name: "OpenAI ChatGPT", url: "https://chatgpt.com/auth/login", category: "Work & Productivity", color: "mint" },
  { name: "Anthropic Claude", url: "https://claude.ai/login", category: "Work & Productivity", color: "peach" },
  { name: "Slack", url: "https://slack.com/signin", category: "Work & Productivity", color: "lavender" },
  { name: "Discord", url: "https://discord.com/login", category: "Social & Community", color: "lavender" },
  { name: "Reddit", url: "https://www.reddit.com/login", category: "Social & Community", color: "coral" },
  { name: "Twitter / X", url: "https://x.com/i/flow/login", category: "Social & Community", color: "default" },
];

const COLOR_ACCENTS: { label: string; value: string; border: string; bg: string; dot: string }[] = [
  { label: "Default", value: "default", border: "var(--border-color)", bg: "var(--bg-card)", dot: "#a0846e" },
  { label: "Coral",   value: "coral",   border: "rgba(240,100,73,0.3)", bg: "rgba(240,100,73,0.08)", dot: "#f06449" },
  { label: "Gold",    value: "gold",    border: "rgba(247,183,49,0.3)", bg: "rgba(247,183,49,0.08)", dot: "#f7b731" },
  { label: "Mint",    value: "mint",    border: "rgba(52,211,153,0.3)", bg: "rgba(52,211,153,0.08)", dot: "#34d399" },
  { label: "Lavender",value: "lavender",border: "rgba(167,139,250,0.3)",bg: "rgba(167,139,250,0.08)",dot: "#a78bfa" },
  { label: "Peach",   value: "peach",   border: "rgba(253,160,133,0.3)",bg: "rgba(253,160,133,0.08)",dot: "#fda085" },
];

function colorStyle(colorVal?: string) {
  return COLOR_ACCENTS.find((c) => c.value === colorVal) || COLOR_ACCENTS[0];
}

function getDomain(urlStr: string) {
  try {
    const formatted = urlStr.startsWith("http") ? urlStr : `https://${urlStr}`;
    return new URL(formatted).hostname.replace(/^www\./, "");
  } catch {
    return "site.com";
  }
}

function getFaviconUrl(urlStr: string) {
  const domain = getDomain(urlStr);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export function ShortcutsApp() {
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "error">("synced");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShortcutItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formCategory, setFormCategory] = useState("Cloud & Dev");
  const [customCategory, setCustomCategory] = useState("");
  const [formColor, setFormColor] = useState("default");
  const [formPinned, setFormPinned] = useState(false);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── 1. Fetch Shortcuts from Database API (Zero LocalStorage) ──
  const fetchShortcuts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/shortcuts");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.shortcuts)) {
          setShortcuts(data.shortcuts);
        }
      }
    } catch (err) {
      console.error("Failed to fetch shortcuts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShortcuts();
  }, [fetchShortcuts]);

  // ── Derived Categories ──
  const categories = useMemo(() => {
    const list = Array.from(new Set(shortcuts.map((s) => s.category).filter(Boolean)));
    return ["All", ...list.sort()];
  }, [shortcuts]);

  // ── Filtered & Sorted Shortcuts ──
  const filteredShortcuts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return shortcuts.filter((s) => {
      const matchCat = selectedCategory === "All" || s.category === selectedCategory;
      const matchQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.url.toLowerCase().includes(q) ||
        (s.username_hint && s.username_hint.toLowerCase().includes(q)) ||
        s.category.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [shortcuts, searchQuery, selectedCategory]);

  const pinnedShortcuts = useMemo(() => {
    return shortcuts.filter((s) => s.pinned);
  }, [shortcuts]);

  // ── Open Add/Edit Modal ──
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormUrl("https://");
    setFormUsername("");
    setFormCategory(categories[1] || "Cloud & Dev");
    setCustomCategory("");
    setFormColor("default");
    setFormPinned(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ShortcutItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormUrl(item.url);
    setFormUsername(item.username_hint || "");
    setFormCategory(item.category);
    setCustomCategory("");
    setFormColor(item.color || "default");
    setFormPinned(!!item.pinned);
    setIsModalOpen(true);
  };

  // ── Save Shortcut (Database Persistence) ──
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) return;

    const finalCategory = formCategory === "__new__" && customCategory.trim()
      ? customCategory.trim()
      : formCategory;

    let formattedUrl = formUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setSyncStatus("saving");

    if (editingItem) {
      // PUT
      const updated: ShortcutItem = {
        ...editingItem,
        title: formTitle.trim(),
        url: formattedUrl,
        username_hint: formUsername.trim(),
        category: finalCategory,
        color: formColor,
        pinned: formPinned,
        updatedAt: new Date().toISOString(),
      };

      setShortcuts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setIsModalOpen(false);

      try {
        const res = await fetch("/api/shortcuts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        if (res.ok) setSyncStatus("synced");
        else setSyncStatus("error");
      } catch {
        setSyncStatus("error");
      }
    } else {
      // POST
      const newItem: ShortcutItem = {
        id: "sc_" + Date.now().toString(36) + Math.random().toString(36).slice(2),
        title: formTitle.trim(),
        url: formattedUrl,
        username_hint: formUsername.trim(),
        category: finalCategory,
        color: formColor,
        pinned: formPinned,
        clicks: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setShortcuts((prev) => [newItem, ...prev]);
      setIsModalOpen(false);

      try {
        const res = await fetch("/api/shortcuts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem),
        });
        if (res.ok) setSyncStatus("synced");
        else setSyncStatus("error");
      } catch {
        setSyncStatus("error");
      }
    }
  };

  // ── Delete Shortcut ──
  const handleDelete = async (id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
    setSyncStatus("saving");
    try {
      const res = await fetch(`/api/shortcuts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) setSyncStatus("synced");
      else setSyncStatus("error");
    } catch {
      setSyncStatus("error");
    }
  };

  // ── Toggle Pin ──
  const handleTogglePin = async (item: ShortcutItem) => {
    const newPinned = !item.pinned;
    setShortcuts((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, pinned: newPinned } : s))
    );
    setSyncStatus("saving");
    try {
      const res = await fetch("/api/shortcuts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, pinned: newPinned }),
      });
      if (res.ok) setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    }
  };

  // ── Add Preset ──
  const handleAddPreset = async (preset: typeof PRESET_SERVICES[0]) => {
    const newItem: ShortcutItem = {
      id: "sc_" + Date.now().toString(36) + Math.random().toString(36).slice(2),
      title: preset.name,
      url: preset.url,
      username_hint: "",
      category: preset.category,
      color: preset.color,
      pinned: false,
      clicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setShortcuts((prev) => [newItem, ...prev]);
    setIsPresetsOpen(false);
    setSyncStatus("saving");

    try {
      const res = await fetch("/api/shortcuts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (res.ok) setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    }
  };

  // ── Copy Helper ──
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // ── Launch Shortcut ──
  const launchLogin = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // ── Export JSON ──
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(shortcuts, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `muvi_login_shortcuts_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  // ── Import JSON ──
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setShortcuts(imported);
          setSyncStatus("saving");
          await fetch("/api/shortcuts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batch: imported }),
          });
          setSyncStatus("synced");
        }
      } catch (err) {
        alert("Invalid JSON file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div style={{ padding: "24px 32px", minHeight: "calc(100vh - 64px)", background: "var(--bg-primary)" }}>
      {/* ── Top Header ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--gradient-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 18px rgba(240,100,73,0.3)",
            }}
          >
            <Zap style={{ width: 22, height: 22, color: "white" }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.65rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Shortcuts
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
              Fast 1-click access to all your websites, apps, and accounts · Zero local storage
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Cloud Database Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 20,
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              color: "#10b981",
              fontSize: "0.76rem",
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
            }}
          >
            <Database style={{ width: 13, height: 13 }} />
            <span>Cloud Database Sync</span>
            {syncStatus === "saving" && <RefreshCw style={{ width: 11, height: 11, animation: "spin-slow 1s linear infinite" }} />}
          </div>

          <button
            onClick={() => setIsPresetsOpen(true)}
            className="btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.84rem", padding: "8px 14px" }}
          >
            <Sparkles style={{ width: 15, height: 15, color: "var(--accent-gold)" }} />
            Popular Presets
          </button>

          <button
            onClick={handleExport}
            title="Export Shortcuts to JSON"
            className="btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.84rem", padding: "8px 12px" }}
          >
            <Download style={{ width: 14, height: 14 }} />
          </button>

          <label
            title="Import Shortcuts from JSON"
            className="btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.84rem", padding: "8px 12px", cursor: "pointer" }}
          >
            <Upload style={{ width: 14, height: 14 }} />
            <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
          </label>

          <button
            onClick={handleOpenAdd}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.88rem", padding: "9px 18px" }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            Add Login Link
          </button>
        </div>
      </div>

      {/* ── Search Bar & Category Filter Row ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 24 }}>
        {/* Search */}
        <div style={{ position: "relative", minWidth: 280, flex: "1 1 320px", maxWidth: 450 }}>
          <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts by name, domain, or email…"
            style={{
              width: "100%",
              padding: "10px 14px 10px 40px",
              borderRadius: 12,
              border: "1px solid var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: "0.88rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {/* Category Pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    border: `1px solid ${active ? "var(--accent)" : "var(--border-color)"}`,
                    background: active ? "var(--gradient-accent)" : "var(--bg-card)",
                    color: active ? "white" : "var(--text-secondary)",
                    fontFamily: "var(--font-heading)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* View Toggles */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--bg-card)", padding: 4, borderRadius: 12, border: "1px solid var(--border-color)" }}>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: 6,
                borderRadius: 8,
                background: viewMode === "grid" ? "var(--bg-input)" : "transparent",
                border: "none",
                color: viewMode === "grid" ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              title="Grid View"
            >
              <LayoutGrid style={{ width: 16, height: 16 }} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              style={{
                padding: 6,
                borderRadius: 8,
                background: viewMode === "list" ? "var(--bg-input)" : "transparent",
                border: "none",
                color: viewMode === "list" ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              title="List View"
            >
              <List style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Favorites Shelf (Pinned Logins) ── */}
      {pinnedShortcuts.length > 0 && selectedCategory === "All" && !searchQuery && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Star style={{ width: 16, height: 16, color: "var(--accent-gold)", fill: "var(--accent-gold)" }} />
            <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Pinned Favorites
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {pinnedShortcuts.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 14,
                  background: "var(--bg-card)",
                  border: "1.5px solid rgba(247,183,49,0.35)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <img
                    src={getFaviconUrl(s.url)}
                    alt=""
                    onError={(e) => {
                      // Fallback icon
                      (e.target as HTMLElement).style.display = "none";
                    }}
                    style={{ width: 28, height: 28, borderRadius: 8, objectFit: "contain", flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.title}
                    </p>
                    {s.username_hint && (
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.username_hint}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => launchLogin(s.url)}
                  title={`Launch ${s.title}`}
                  className="btn-primary"
                  style={{
                    padding: "7px 12px",
                    fontSize: "0.78rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flexShrink: 0,
                  }}
                >
                  <span>Login</span>
                  <ArrowUpRight style={{ width: 13, height: 13 }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Shortcuts Grid ── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12, color: "var(--text-muted)" }}>
          <Loader2 style={{ width: 28, height: 28, animation: "spin-slow 1s linear infinite" }} />
          <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "0.95rem" }}>Loading your account shortcuts…</p>
        </div>
      ) : filteredShortcuts.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            background: "var(--bg-card)",
            borderRadius: 20,
            border: "1px dashed var(--border-hover)",
            textAlign: "center",
            gap: 14,
          }}
        >
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(240,100,73,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Globe style={{ width: 30, height: 30, color: "var(--accent)" }} />
          </div>
          <div>
            <h3 style={{ margin: "0 0 6px", fontFamily: "var(--font-heading)", fontSize: "1.15rem", color: "var(--text-primary)" }}>
              {searchQuery ? "No matching login shortcuts found" : "No shortcuts in this category"}
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
              {searchQuery ? "Try a different search term or clear the filter." : "Click \"Add Login Link\" or choose from Popular Presets to get started."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={handleOpenAdd} className="btn-primary" style={{ fontSize: "0.85rem", padding: "8px 16px" }}>
              <Plus style={{ width: 15, height: 15, marginRight: 5, verticalAlign: "middle" }} />
              Add Shortcut
            </button>
            <button onClick={() => setIsPresetsOpen(true)} className="btn-ghost" style={{ fontSize: "0.85rem", padding: "8px 16px" }}>
              <Sparkles style={{ width: 15, height: 15, marginRight: 5, verticalAlign: "middle" }} />
              Explore Presets
            </button>
          </div>
        </div>
      ) : (
        <div 
          style={{ 
            display: "grid", 
            gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(310px, 1fr))" : "1fr", 
            gap: viewMode === "grid" ? 18 : 12 
          }}
        >
          {filteredShortcuts.map((s) => {
            const domain = getDomain(s.url);
            const style = colorStyle(s.color);
            return (
              <div
                key={s.id}
                style={{
                  background: style.bg,
                  border: `1.5px solid ${s.pinned ? "rgba(247,183,49,0.4)" : style.border}`,
                  borderRadius: 18,
                  padding: viewMode === "grid" ? "18px 20px" : "12px 20px",
                  display: "flex",
                  flexDirection: viewMode === "grid" ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: viewMode === "list" ? "center" : "stretch",
                  gap: viewMode === "grid" ? 16 : 16,
                  transition: "transform 0.15s, box-shadow 0.15s",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                }}
              >
                {viewMode === "grid" ? (
                  <>
                    {/* Header: Icon, Name, Category & Pin */}
                    <div>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 12,
                              background: "var(--bg-card)",
                              border: "1px solid var(--border-color)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                              flexShrink: 0,
                              overflow: "hidden",
                            }}
                          >
                            <img
                              src={getFaviconUrl(s.url)}
                              alt=""
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                              style={{ width: 28, height: 28, objectFit: "contain" }}
                            />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {s.title}
                            </h3>
                            <p style={{ margin: "2px 0 0", fontSize: "0.74rem", color: "var(--text-muted)", fontFamily: "var(--font-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {domain}
                            </p>
                          </div>
                        </div>

                        {/* Star & Actions */}
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <button
                            onClick={() => handleTogglePin(s)}
                            title={s.pinned ? "Unpin from favorites" : "Pin to favorites"}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 5,
                              borderRadius: 6,
                              color: s.pinned ? "var(--accent-gold)" : "var(--text-muted)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Star style={{ width: 16, height: 16, fill: s.pinned ? "var(--accent-gold)" : "none" }} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            title="Edit Shortcut"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 5,
                              borderRadius: 6,
                              color: "var(--text-muted)",
                              display: "flex",
                            }}
                          >
                            <Edit3 style={{ width: 14, height: 14 }} />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            title="Delete Shortcut"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 5,
                              borderRadius: 6,
                              color: "var(--text-muted)",
                              display: "flex",
                            }}
                          >
                            <Trash2 style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      </div>

                      {/* Category Pill */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontFamily: "var(--font-heading)",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 12,
                            background: "rgba(0,0,0,0.06)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {s.category}
                        </span>
                      </div>

                      {/* Account / Username Hint Pill with 1-Click Copy */}
                      {s.username_hint && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "6px 10px",
                            borderRadius: 9,
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-color)",
                            fontSize: "0.78rem",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 }}>
                            👤 {s.username_hint}
                          </span>
                          <button
                            onClick={() => copyToClipboard(s.username_hint!, s.id + "-user")}
                            title="Copy Username/Email"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 3,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              color: copiedId === s.id + "-user" ? "#10b981" : "var(--text-muted)",
                              fontSize: "0.7rem",
                              fontFamily: "var(--font-heading)",
                            }}
                          >
                            {copiedId === s.id + "-user" ? (
                              <>
                                <Check style={{ width: 12, height: 12 }} />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy style={{ width: 12, height: 12 }} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Card Bottom: Launch Button & Copy URL */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                      <button
                        onClick={() => launchLogin(s.url)}
                        className="btn-primary"
                        style={{
                          flex: 1,
                          padding: "9px 14px",
                          fontSize: "0.84rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 7,
                        }}
                      >
                        <span>Launch Login</span>
                        <ExternalLink style={{ width: 14, height: 14 }} />
                      </button>

                      <button
                        onClick={() => copyToClipboard(s.url, s.id + "-url")}
                        title="Copy Login URL"
                        style={{
                          padding: "9px 12px",
                          borderRadius: 10,
                          border: "1px solid var(--border-color)",
                          background: "var(--bg-card)",
                          color: copiedId === s.id + "-url" ? "#10b981" : "var(--text-secondary)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: "0.78rem",
                          fontFamily: "var(--font-heading)",
                          fontWeight: 500,
                        }}
                      >
                        {copiedId === s.id + "-url" ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* List View Render */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-color)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={getFaviconUrl(s.url)}
                          alt=""
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                          style={{ width: 24, height: 24, objectFit: "contain" }}
                        />
                      </div>
                      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.title}
                          </h3>
                          {s.pinned && <Star style={{ width: 14, height: 14, fill: "var(--accent-gold)", color: "var(--accent-gold)" }} />}
                        </div>
                        <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {domain} {s.username_hint ? ` · 👤 ${s.username_hint}` : ""}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontFamily: "var(--font-heading)",
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: 12,
                          background: "rgba(0,0,0,0.06)",
                          color: "var(--text-secondary)",
                          marginRight: 10,
                        }}
                        className="hide-on-mobile"
                      >
                        {s.category}
                      </span>
                      
                      {/* Actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          onClick={() => handleTogglePin(s)}
                          title={s.pinned ? "Unpin from favorites" : "Pin to favorites"}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: s.pinned ? "var(--accent-gold)" : "var(--text-muted)" }}
                        >
                          <Star style={{ width: 15, height: 15, fill: s.pinned ? "var(--accent-gold)" : "none" }} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Shortcut"
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: "var(--text-muted)" }}
                        >
                          <Edit3 style={{ width: 15, height: 15 }} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          title="Delete Shortcut"
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: "var(--text-muted)" }}
                        >
                          <Trash2 style={{ width: 15, height: 15 }} />
                        </button>
                      </div>

                      <div style={{ width: 1, height: 24, background: "var(--border-color)", margin: "0 4px" }} />

                      <button
                        onClick={() => copyToClipboard(s.username_hint || s.url, s.id + "-copy")}
                        title="Copy Info"
                        style={{
                          padding: "8px 12px",
                          borderRadius: 10,
                          border: "1px solid var(--border-color)",
                          background: "var(--bg-card)",
                          color: copiedId === s.id + "-copy" ? "#10b981" : "var(--text-secondary)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {copiedId === s.id + "-copy" ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                      </button>

                      <button
                        onClick={() => launchLogin(s.url)}
                        className="btn-primary"
                        style={{
                          padding: "8px 16px",
                          fontSize: "0.84rem",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span>Login</span>
                        <ExternalLink style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              background: "var(--bg-card)",
              borderRadius: 22,
              border: "1px solid var(--border-color)",
              padding: "26px 28px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
              animation: "fade-in-scale 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {editingItem ? "Edit Login Shortcut" : "Add New Login Shortcut"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Service / App Name */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: "0.8rem", fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Service / App Name *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Netflix, Supabase, Work Email"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.88rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Login URL */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: "0.8rem", fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Login or Portal URL *
                </label>
                <input
                  type="text"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://netflix.com/login"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.88rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Username / Account Hint */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: "0.8rem", fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Account Identifier / Email Hint (Optional)
                </label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="e.g. personal@gmail.com or admin_user"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.88rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: "0.8rem", fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.88rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="Cloud & Dev">Cloud & Dev</option>
                  <option value="Streaming">Streaming</option>
                  <option value="Work & Productivity">Work & Productivity</option>
                  <option value="Social & Community">Social & Community</option>
                  <option value="Finance & Banking">Finance & Banking</option>
                  <option value="Personal">Personal</option>
                  <option value="__new__">+ Create New Category</option>
                </select>

                {formCategory === "__new__" && (
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category name…"
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: "9px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-input)",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.85rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </div>

              {/* Color Accents */}
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: "0.8rem", fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Color Badge
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  {COLOR_ACCENTS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormColor(c.value)}
                      title={c.label}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        border: `2.5px solid ${formColor === c.value ? "var(--accent)" : "transparent"}`,
                        background: c.dot,
                        cursor: "pointer",
                        opacity: formColor === c.value ? 1 : 0.45,
                        transition: "all 0.15s",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Pinned Checkbox */}
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.82rem", color: "var(--text-secondary)", fontFamily: "var(--font-body)", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={formPinned}
                  onChange={(e) => setFormPinned(e.target.checked)}
                />
                Pin to Favorites Shelf
              </label>

              {/* Form Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost"
                  style={{ fontSize: "0.86rem", padding: "10px 18px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ fontSize: "0.86rem", padding: "10px 22px" }}
                >
                  {editingItem ? "Update Shortcut" : "Save Shortcut"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Popular Presets Drawer / Modal ── */}
      {isPresetsOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 580,
              maxHeight: "85vh",
              background: "var(--bg-card)",
              borderRadius: 22,
              border: "1px solid var(--border-color)",
              padding: "26px 28px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
              display: "flex",
              flexDirection: "column",
              animation: "fade-in-scale 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  Popular Service Presets
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  Click to add pre-configured official login links with 1 click
                </p>
              </div>
              <button
                onClick={() => setIsPresetsOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, paddingRight: 4 }}>
              {PRESET_SERVICES.map((preset) => (
                <div
                  key={preset.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <img
                      src={getFaviconUrl(preset.url)}
                      alt=""
                      style={{ width: 22, height: 22, borderRadius: 6, objectFit: "contain", flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {preset.name}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                        {preset.category}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddPreset(preset)}
                    className="btn-primary"
                    style={{
                      padding: "5px 10px",
                      fontSize: "0.74rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <Plus style={{ width: 12, height: 12 }} />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShortcutsApp;

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StickyNote, Plus, Search, Trash2, Edit3, Lock, Unlock,
  Shield, Upload, Eye, EyeOff, X, Check, Save,
  FileText, ImageIcon, Download, Star, Clock, File,
  AlertTriangle, Key, Loader2, Hash, Database, CloudCheck, RefreshCw
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VaultItem {
  id: string;
  type: "note" | "file";
  title: string;
  content?: string;
  fileName?: string;
  fileType?: string;
  fileData?: string; // base64 data URL
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

interface EncryptedVaultRecord {
  id: string;
  type: "note" | "file";
  title: string;
  encryptedData: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const NOTE_COLORS: { label: string; value: string; dot: string; bg: string; border: string }[] = [
  { label: "Default", value: "default", dot: "#a0846e", bg: "var(--bg-card)", border: "var(--border-color)" },
  { label: "Coral",   value: "coral",   dot: "#f06449", bg: "rgba(240,100,73,0.07)", border: "rgba(240,100,73,0.22)" },
  { label: "Gold",    value: "gold",    dot: "#f7b731", bg: "rgba(247,183,49,0.07)", border: "rgba(247,183,49,0.22)" },
  { label: "Mint",    value: "mint",    dot: "#34d399", bg: "rgba(52,211,153,0.07)", border: "rgba(52,211,153,0.22)" },
  { label: "Lavender",value: "lavender",dot: "#a78bfa", bg: "rgba(167,139,250,0.07)", border: "rgba(167,139,250,0.22)" },
  { label: "Peach",   value: "peach",   dot: "#fda085", bg: "rgba(253,160,133,0.07)", border: "rgba(253,160,133,0.22)" },
];

const colorOf = (v: string) => NOTE_COLORS.find((c) => c.value === v) ?? NOTE_COLORS[0];

// ─────────────────────────────────────────────
// Crypto helpers  (AES-256-GCM + PBKDF2)
// ─────────────────────────────────────────────

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const raw = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 150_000, hash: "SHA-256" },
    raw, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
}

async function encrypt(key: CryptoKey, text: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, new TextEncoder().encode(text)
  );
  const combined = new Uint8Array(12 + buf.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(buf), 12);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(key: CryptoKey, b64: string): Promise<string> {
  const combined = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const iv   = combined.slice(0, 12);
  const data = combined.slice(12);
  const buf  = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(buf);
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtSize = (b: number) =>
  b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 ** 2).toFixed(1)} MB`;

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function NotesApp() {
  // ── section ──
  const [section, setSection] = useState<"notes" | "vault">("notes");

  // ── sync indicator ──
  const [syncStatus, setSyncStatus]     = useState<"synced" | "saving" | "error">("synced");
  const [loadingNotes, setLoadingNotes] = useState(true);

  // ── notes state ──
  const [notes, setNotes]               = useState<Note[]>([]);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [searchQ, setSearchQ]           = useState("");
  const [filterTag, setFilterTag]       = useState<string | null>(null);
  const [editing, setEditing]           = useState(false);
  const [dirty, setDirty]               = useState(false);
  const [editTitle, setEditTitle]       = useState("");
  const [editContent, setEditContent]   = useState("");
  const [editTags, setEditTags]         = useState<string[]>([]);
  const [editColor, setEditColor]       = useState("default");
  const [tagInput, setTagInput]         = useState("");

  // ── vault state ──
  const [vaultLocked, setVaultLocked]     = useState(true);
  const [vaultHasPin, setVaultHasPin]     = useState(false);
  const [vaultSalt, setVaultSalt]         = useState<string | null>(null);
  const [vaultCheckHash, setVaultCheckHash] = useState<string | null>(null);
  const [rawVaultItems, setRawVaultItems] = useState<EncryptedVaultRecord[]>([]);
  const [vaultKey, setVaultKey]           = useState<CryptoKey | null>(null);
  const [vaultItems, setVaultItems]       = useState<VaultItem[]>([]);
  const [pinInput, setPinInput]           = useState("");
  const [pinConfirm, setPinConfirm]       = useState("");
  const [pinError, setPinError]           = useState("");
  const [showPin, setShowPin]             = useState(false);
  const [vaultBusy, setVaultBusy]         = useState(false);
  const [vaultMode, setVaultMode]         = useState<"note" | null>(null);
  const [vaultEditItem, setVaultEditItem] = useState<VaultItem | null>(null);
  const [vaultTitle, setVaultTitle]       = useState("");
  const [vaultContent, setVaultContent]   = useState("");
  const [previewItem, setPreviewItem]     = useState<VaultItem | null>(null);

  const vaultFileRef = useRef<HTMLInputElement>(null);

  // ── Load notes from database API (No localStorage!) ──
  const loadNotesFromDb = useCallback(async () => {
    setLoadingNotes(true);
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.notes)) {
          setNotes(data.notes);
          if (data.notes.length > 0 && !selectedId) {
            const first = data.notes[0];
            setSelectedId(first.id);
            setEditTitle(first.title);
            setEditContent(first.content);
            setEditTags([...first.tags]);
            setEditColor(first.color);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load notes from DB:", err);
    } finally {
      setLoadingNotes(false);
    }
  }, [selectedId]);

  // ── Load vault metadata from database API (No localStorage!) ──
  const loadVaultMetaFromDb = useCallback(async () => {
    try {
      const res = await fetch("/api/vault");
      if (res.ok) {
        const data = await res.json();
        if (data.meta?.salt && data.meta?.checkHash) {
          setVaultHasPin(true);
          setVaultSalt(data.meta.salt);
          setVaultCheckHash(data.meta.checkHash);
        } else {
          setVaultHasPin(false);
        }
        if (Array.isArray(data.items)) {
          setRawVaultItems(data.items);
        }
      }
    } catch (err) {
      console.error("Failed to load vault meta:", err);
    }
  }, []);

  useEffect(() => {
    loadNotesFromDb();
    loadVaultMetaFromDb();
  }, [loadNotesFromDb, loadVaultMetaFromDb]);

  // ── derived ──
  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags))).sort();

  const filteredNotes = notes
    .filter((n) => {
      const q = searchQ.toLowerCase();
      const matchQ = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some((t) => t.includes(q));
      const matchT = !filterTag || n.tags.includes(filterTag);
      return matchQ && matchT;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  // ── note actions ──
  const flushEdit = async () => {
    if (!dirty || !selectedId) return;
    const now = new Date().toISOString();
    const updatedNote: Note = {
      ...selectedNote!,
      id: selectedId,
      title: editTitle || "Untitled Note",
      content: editContent,
      tags: editTags,
      color: editColor,
      updatedAt: now,
    };

    setNotes((prev) => prev.map((n) => (n.id === selectedId ? updatedNote : n)));
    setDirty(false);
    setSyncStatus("saving");

    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedId,
          title: updatedNote.title,
          content: updatedNote.content,
          tags: updatedNote.tags,
          color: updatedNote.color,
        }),
      });
      if (res.ok) {
        setSyncStatus("synced");
      } else {
        setSyncStatus("error");
      }
    } catch (e) {
      console.error("Save note error:", e);
      setSyncStatus("error");
    }
  };

  const selectNote = (n: Note) => {
    flushEdit();
    setSelectedId(n.id);
    setEditTitle(n.title);
    setEditContent(n.content);
    setEditTags([...n.tags]);
    setEditColor(n.color);
    setEditing(false);
    setDirty(false);
  };

  const createNote = async () => {
    flushEdit();
    const n: Note = {
      id: uid(),
      title: "Untitled Note",
      content: "",
      tags: [],
      color: "default",
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => [n, ...prev]);
    selectNote(n);
    setEditing(true);
    setSyncStatus("saving");

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(n),
      });
      if (res.ok) {
        setSyncStatus("synced");
      } else {
        setSyncStatus("error");
      }
    } catch (e) {
      console.error("Create note error:", e);
      setSyncStatus("error");
    }
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setEditing(false);
      setDirty(false);
    }
    setSyncStatus("saving");

    try {
      const res = await fetch(`/api/notes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSyncStatus("synced");
      } else {
        setSyncStatus("error");
      }
    } catch (e) {
      console.error("Delete note error:", e);
      setSyncStatus("error");
    }
  };

  const togglePin = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const newPinned = !note.pinned;

    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: newPinned } : n))
    );
    setSyncStatus("saving");

    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pinned: newPinned }),
      });
      if (res.ok) setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !editTags.includes(t)) {
      setEditTags((p) => [...p, t]);
      setDirty(true);
    }
    setTagInput("");
  };

  // ── Vault Setup (Zero localStorage: persisted to database) ──
  const setupPin = async () => {
    if (pinInput.length < 4) return setPinError("PIN must be at least 4 digits");
    if (pinInput !== pinConfirm) return setPinError("PINs do not match");
    setVaultBusy(true);
    setPinError("");

    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const saltB64 = btoa(String.fromCharCode(...salt));
      const key = await deriveKey(pinInput, salt);
      const checkHash = await encrypt(key, "muvi_ok");

      // Save to database
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setup",
          salt: saltB64,
          checkHash,
        }),
      });

      if (!res.ok) throw new Error("Database error");

      setVaultSalt(saltB64);
      setVaultCheckHash(checkHash);
      setVaultKey(key);
      setVaultLocked(false);
      setVaultHasPin(true);
      setVaultItems([]);
      setPinInput("");
      setPinConfirm("");
      setPinError("");
    } catch {
      setPinError("Setup failed. Please check network/database.");
    } finally {
      setVaultBusy(false);
    }
  };

  // ── Unlock Vault (Fetches and decrypts in memory) ──
  const unlockVault = async () => {
    if (!pinInput) return;
    setVaultBusy(true);
    setPinError("");

    try {
      // Re-fetch vault meta & encrypted records
      const metaRes = await fetch("/api/vault");
      let currentSalt = vaultSalt;
      let currentCheck = vaultCheckHash;
      let rawItems = rawVaultItems;

      if (metaRes.ok) {
        const data = await metaRes.json();
        if (data.meta?.salt && data.meta?.checkHash) {
          currentSalt = data.meta.salt;
          currentCheck = data.meta.checkHash;
          setVaultSalt(currentSalt);
          setVaultCheckHash(currentCheck);
        }
        if (Array.isArray(data.items)) {
          rawItems = data.items;
          setRawVaultItems(rawItems);
        }
      }

      if (!currentSalt || !currentCheck) {
        throw new Error("Vault not found");
      }

      const saltBytes = Uint8Array.from(atob(currentSalt), (c) => c.charCodeAt(0));
      const key = await deriveKey(pinInput, saltBytes);
      const checkDecrypted = await decrypt(key, currentCheck);

      if (checkDecrypted !== "muvi_ok") {
        throw new Error("Incorrect PIN");
      }

      // Decrypt all items
      const decryptedItems: VaultItem[] = [];
      for (const item of rawItems) {
        try {
          const payload = JSON.parse(await decrypt(key, item.encryptedData));
          decryptedItems.push({
            id: item.id,
            type: item.type,
            title: item.title,
            content: payload.content,
            fileName: item.fileName,
            fileType: item.fileType,
            fileData: payload.fileData,
            fileSize: item.fileSize,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          });
        } catch (decErr) {
          console.error("Could not decrypt item:", item.id, decErr);
        }
      }

      setVaultKey(key);
      setVaultItems(decryptedItems);
      setVaultLocked(false);
      setPinInput("");
    } catch {
      setPinError("Incorrect PIN. Please try again.");
    } finally {
      setVaultBusy(false);
    }
  };

  const lockVault = () => {
    setVaultLocked(true);
    setVaultKey(null);
    setVaultItems([]);
    setPinInput("");
    setVaultMode(null);
    setVaultEditItem(null);
    setPreviewItem(null);
  };

  const saveVaultNote = async () => {
    if (!vaultKey || !vaultTitle.trim()) return;

    const id = vaultEditItem?.id ?? uid();
    const now = new Date().toISOString();
    const created = vaultEditItem?.createdAt ?? now;

    // Encrypt content payload
    const payloadToEncrypt = JSON.stringify({
      title: vaultTitle,
      content: vaultContent,
    });
    const encryptedData = await encrypt(vaultKey, payloadToEncrypt);

    const decryptedItem: VaultItem = {
      id,
      type: "note",
      title: vaultTitle,
      content: vaultContent,
      createdAt: created,
      updatedAt: now,
    };

    // Update UI immediately
    const updated = vaultEditItem
      ? vaultItems.map((i) => (i.id === id ? decryptedItem : i))
      : [decryptedItem, ...vaultItems];
    setVaultItems(updated);

    setVaultMode(null);
    setVaultEditItem(null);
    setVaultTitle("");
    setVaultContent("");

    // Persist to database API
    try {
      await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_item",
          item: {
            id,
            type: "note",
            title: vaultTitle,
            encryptedData,
            createdAt: created,
            updatedAt: now,
          },
        }),
      });
    } catch (e) {
      console.error("Failed to save vault note to DB:", e);
    }
  };

  const deleteVaultItem = async (id: string) => {
    if (!vaultKey) return;
    setVaultItems((prev) => prev.filter((i) => i.id !== id));
    if (previewItem?.id === id) setPreviewItem(null);
    if (vaultEditItem?.id === id) {
      setVaultMode(null);
      setVaultEditItem(null);
    }

    try {
      await fetch(`/api/vault?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Failed to delete vault item from DB:", e);
    }
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!vaultKey) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Max file size for secure encrypted storage is 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const fileData = ev.target?.result as string;
      const id = uid();
      const now = new Date().toISOString();

      // Encrypt file data payload
      const encryptedData = await encrypt(
        vaultKey,
        JSON.stringify({ fileData })
      );

      const decryptedItem: VaultItem = {
        id,
        type: "file",
        title: file.name,
        fileName: file.name,
        fileType: file.type,
        fileData,
        fileSize: file.size,
        createdAt: now,
        updatedAt: now,
      };

      setVaultItems((prev) => [decryptedItem, ...prev]);

      try {
        await fetch("/api/vault", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_item",
            item: {
              id,
              type: "file",
              title: file.name,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              encryptedData,
              createdAt: now,
              updatedAt: now,
            },
          }),
        });
      } catch (err) {
        console.error("Failed to save encrypted file to DB:", err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const downloadFile = (item: VaultItem) => {
    if (!item.fileData) return;
    const a = document.createElement("a");
    a.href = item.fileData;
    a.download = item.fileName ?? "secure_file";
    a.click();
  };

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>

      {/* ── Top bar ── */}
      <div style={{ padding: "18px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 14px rgba(240,100,73,0.28)" }}>
              <StickyNote style={{ width: 18, height: 18, color: "white" }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.45rem", fontWeight: 800, color: "var(--text-primary)" }}>Notes</h1>
            </div>
          </div>

          {/* Section tabs */}
          <div style={{ display: "flex", gap: 3, background: "var(--bg-secondary)", borderRadius: 10, padding: 4, border: "1px solid var(--border-color)" }}>
            {[
              { key: "notes", icon: StickyNote, label: "My Notes" },
              { key: "vault", icon: Shield,     label: "Secure Box" },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setSection(key as "notes" | "vault")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  border: "none",
                  fontFamily: "var(--font-heading)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: section === key ? "var(--bg-card)" : "transparent",
                  color: section === key ? "var(--accent)" : "var(--text-muted)",
                  boxShadow: section === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Icon style={{ width: 13, height: 13 }} />
                {label}
              </button>
            ))}
          </div>

          {/* Cloud Database Badge */}
          <div
            title="All notes and secure files are synchronized with your Supabase database. Zero local storage is used."
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 20,
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              color: "#10b981",
              fontSize: "0.72rem",
              fontFamily: "var(--font-heading)",
              fontWeight: 500,
            }}
          >
            <Database style={{ width: 12, height: 12 }} />
            <span>Cloud Database Sync</span>
            {syncStatus === "saving" && <RefreshCw style={{ width: 10, height: 10, animation: "spin-slow 1s linear infinite" }} />}
          </div>
        </div>

        {section === "notes" && (
          <button
            onClick={createNote}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.85rem", padding: "9px 18px" }}
          >
            <Plus style={{ width: 15, height: 15 }} /> New Note
          </button>
        )}
      </div>

      {/* ═══════════════ NOTES ═══════════════ */}
      {section === "notes" && (
        <div style={{ flex: 1, display: "flex", gap: 16, padding: "16px 24px 24px", overflow: "hidden" }}>

          {/* ── List panel ── */}
          <div style={{ width: 288, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--text-muted)", pointerEvents: "none" }} />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search notes…"
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 32px",
                  borderRadius: 10,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.84rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Tag filters */}
            {allTags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                <TagPill active={!filterTag} onClick={() => setFilterTag(null)}>All</TagPill>
                {allTags.map((t) => (
                  <TagPill key={t} active={filterTag === t} onClick={() => setFilterTag((f) => f === t ? null : t)}>#{t}</TagPill>
                ))}
              </div>
            )}

            {/* Note cards */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 7 }}>
              {loadingNotes ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 8, color: "var(--text-muted)" }}>
                  <Loader2 style={{ width: 22, height: 22, animation: "spin-slow 1s linear infinite" }} />
                  <span style={{ fontSize: "0.8rem", fontFamily: "var(--font-heading)" }}>Loading database notes…</span>
                </div>
              ) : filteredNotes.length === 0 ? (
                <EmptyState icon={StickyNote} title={searchQ ? "No notes found" : "No notes yet"} sub={searchQ ? "" : 'Click "+ New Note" to get started'} />
              ) : (
                filteredNotes.map((n) => {
                  const col    = colorOf(n.color);
                  const active = n.id === selectedId;
                  return (
                    <button
                      key={n.id}
                      onClick={() => selectNote(n)}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: `1.5px solid ${active ? "var(--accent)" : col.border}`,
                        background: active ? "rgba(240,100,73,0.07)" : col.bg,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        width: "100%",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.86rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 6 }}>
                          {n.title || "Untitled"}
                        </span>
                        {n.pinned && <Star style={{ width: 11, height: 11, color: "var(--accent-gold)", flexShrink: 0 }} />}
                      </div>
                      <p style={{ margin: "0 0 8px", fontFamily: "var(--font-body)", fontSize: "0.76rem", color: "var(--text-muted)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {n.content || "No content"}
                      </p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {n.tags.slice(0, 2).map((t) => <MiniTag key={t}>#{t}</MiniTag>)}
                          {n.tags.length > 2 && <span style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>+{n.tags.length - 2}</span>}
                        </div>
                        <span style={{ fontSize: "0.66rem", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>{fmtDate(n.updatedAt)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Editor panel ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-color)", overflow: "hidden" }}>
            {!selectedNote ? (
              <EmptyState icon={StickyNote} title="Select a note" sub='or click "+ New Note" to create one' />
            ) : (
              <>
                {/* Toolbar */}
                <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Color dots */}
                    <div style={{ display: "flex", gap: 5 }}>
                      {NOTE_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => { setEditColor(c.value); setDirty(true); }}
                          title={c.label}
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            border: `2.5px solid ${editColor === c.value ? "var(--accent)" : "transparent"}`,
                            background: c.dot,
                            cursor: "pointer",
                            opacity: editColor === c.value ? 1 : 0.45,
                            transition: "all 0.15s",
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ width: 1, height: 18, background: "var(--border-color)" }} />
                    {/* Pin */}
                    <button
                      onClick={() => togglePin(selectedNote.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 10px",
                        borderRadius: 7,
                        border: "1px solid var(--border-color)",
                        background: "transparent",
                        color: selectedNote.pinned ? "var(--accent-gold)" : "var(--text-muted)",
                        fontSize: "0.76rem",
                        fontFamily: "var(--font-heading)",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      <Star style={{ width: 12, height: 12 }} />
                      {selectedNote.pinned ? "Pinned" : "Pin"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 7 }}>
                    {dirty && (
                      <button
                        onClick={() => { flushEdit(); setEditing(false); }}
                        className="btn-primary"
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", padding: "7px 14px" }}
                      >
                        <Save style={{ width: 13, height: 13 }} /> Save
                      </button>
                    )}
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="btn-ghost"
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", padding: "7px 14px" }}
                      >
                        <Edit3 style={{ width: 13, height: 13 }} /> Edit
                      </button>
                    )}
                    <button
                      onClick={() => deleteNote(selectedNote.id)}
                      title="Delete Note"
                      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid rgba(239,68,68,0.22)", background: "transparent", color: "#ef4444", cursor: "pointer" }}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>

                {/* Editor body */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 22px", gap: 12, overflow: "hidden" }}>
                  {editing ? (
                    <input
                      value={editTitle}
                      onChange={(e) => { setEditTitle(e.target.value); setDirty(true); }}
                      placeholder="Note title…"
                      style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", background: "transparent", border: "none", outline: "none", width: "100%" }}
                    />
                  ) : (
                    <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
                      {editTitle || "Untitled Note"}
                    </h2>
                  )}

                  {/* Meta */}
                  <div style={{ display: "flex", gap: 14, fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-body)", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock style={{ width: 11, height: 11 }} />{fmtDate(selectedNote.updatedAt)}</span>
                    <span>{editContent.length} chars</span>
                  </div>

                  {/* Tags row */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    {editTags.map((t) => (
                      <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: "rgba(240,100,73,0.1)", color: "var(--accent)", fontSize: "0.73rem", fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                        #{t}
                        {editing && (
                          <button
                            onClick={() => { setEditTags((p) => p.filter((x) => x !== t)); setDirty(true); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "var(--accent)" }}
                          >
                            <X style={{ width: 9, height: 9 }} />
                          </button>
                        )}
                      </span>
                    ))}
                    {editing && (
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <Hash style={{ width: 12, height: 12, color: "var(--text-muted)" }} />
                        <input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                          placeholder="add tag…"
                          style={{ padding: "2px 8px", borderRadius: 20, border: "1px dashed var(--border-hover)", background: "transparent", color: "var(--text-secondary)", fontSize: "0.73rem", fontFamily: "var(--font-body)", outline: "none", width: 80 }}
                        />
                        {tagInput && (
                          <button onClick={addTag} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", display: "flex" }}>
                            <Check style={{ width: 13, height: 13 }} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ height: 1, background: "var(--border-color)", flexShrink: 0 }} />

                  {/* Content */}
                  {editing ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => { setEditContent(e.target.value); setDirty(true); }}
                      placeholder="Start writing your note…"
                      style={{ flex: 1, resize: "none", border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "var(--text-primary)", lineHeight: 1.75 }}
                    />
                  ) : (
                    <div
                      onClick={() => setEditing(true)}
                      style={{ flex: 1, overflowY: "auto", fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "var(--text-primary)", lineHeight: 1.75, whiteSpace: "pre-wrap", cursor: "text" }}
                    >
                      {editContent || <span style={{ color: "var(--text-muted)" }}>Click to edit…</span>}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ SECURE VAULT ═══════════════ */}
      {section === "vault" && (
        <div style={{ flex: 1, display: "flex", alignItems: vaultLocked ? "center" : "flex-start", justifyContent: vaultLocked ? "center" : "flex-start", padding: vaultLocked ? 0 : "16px 24px 24px", overflow: "hidden" }}>

          {/* ── Lock screen ── */}
          {vaultLocked && (
            <div style={{ width: 440, background: "var(--bg-card)", borderRadius: 24, border: "1px solid var(--border-color)", padding: "36px 36px 28px", boxShadow: "0 8px 48px rgba(240,100,73,0.09)", animation: "fade-in-scale 0.25s ease-out" }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 4px 22px rgba(240,100,73,0.32)" }}>
                  <Shield style={{ width: 32, height: 32, color: "white" }} />
                </div>
                <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-heading)", fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)" }}>Secure Box</h2>
                <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  {vaultHasPin ? "Enter your PIN to unlock" : "Create a PIN to protect your vault"}
                </p>
              </div>

              {!vaultHasPin ? (
                /* Setup */
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <PinField label="Create PIN (min 4 digits)" value={pinInput} onChange={(v) => setPinInput(v.replace(/\D/g, "").slice(0, 8))} show={showPin} onToggleShow={() => setShowPin((s) => !s)} />
                  <PinField label="Confirm PIN" value={pinConfirm} onChange={(v) => setPinConfirm(v.replace(/\D/g, "").slice(0, 8))} show={showPin} onKeyDown={(e) => e.key === "Enter" && setupPin()} />
                  {pinError && <PinError msg={pinError} />}
                  <button
                    onClick={setupPin}
                    disabled={vaultBusy}
                    className="btn-primary"
                    style={{ marginTop: 4, fontSize: "0.9rem", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    {vaultBusy ? <Loader2 style={{ width: 16, height: 16, animation: "spin-slow 1s linear infinite" }} /> : <Key style={{ width: 16, height: 16 }} />}
                    {vaultBusy ? "Setting up…" : "Create Secure Box"}
                  </button>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-body)", userSelect: "none" }}>
                    <input type="checkbox" checked={showPin} onChange={() => setShowPin((s) => !s)} />
                    Show PIN
                  </label>
                </div>
              ) : (
                /* Unlock */
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPin ? "text" : "password"}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 8))}
                      onKeyDown={(e) => e.key === "Enter" && unlockVault()}
                      placeholder="• • • • • •"
                      maxLength={8}
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "14px 48px 14px 20px",
                        borderRadius: 12,
                        border: `1.5px solid ${pinError ? "#ef4444" : "var(--border-color)"}`,
                        background: "var(--bg-input)",
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-body)",
                        fontSize: "1.5rem",
                        letterSpacing: "0.45em",
                        textAlign: "center",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      onClick={() => setShowPin((s) => !s)}
                      style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                    >
                      {showPin ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                  {pinError && <PinError msg={pinError} />}
                  <button
                    onClick={unlockVault}
                    disabled={vaultBusy || !pinInput}
                    className="btn-primary"
                    style={{ fontSize: "0.9rem", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    {vaultBusy ? <Loader2 style={{ width: 16, height: 16, animation: "spin-slow 1s linear infinite" }} /> : <Unlock style={{ width: 16, height: 16 }} />}
                    {vaultBusy ? "Unlocking…" : "Unlock"}
                  </button>
                </div>
              )}

              <p style={{ marginTop: 20, textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-body)", lineHeight: 1.55 }}>
                🔐 Zero-Knowledge AES-256-GCM encryption · Persisted directly to Cloud Database (No Local Storage)
              </p>
            </div>
          )}

          {/* ── Unlocked vault ── */}
          {!vaultLocked && (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Vault toolbar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Unlock style={{ width: 15, height: 15, color: "white" }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Secure Box</p>
                    <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                      {vaultItems.length} item{vaultItems.length !== 1 ? "s" : ""} · AES-256-GCM Encrypted · Cloud DB Synced
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => { setVaultMode("note"); setVaultEditItem(null); setVaultTitle(""); setVaultContent(""); setPreviewItem(null); }}
                    className="btn-primary"
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", padding: "8px 14px" }}
                  >
                    <Plus style={{ width: 14, height: 14 }} /> Add Note
                  </button>
                  <button
                    onClick={() => vaultFileRef.current?.click()}
                    className="btn-ghost"
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", padding: "8px 14px" }}
                  >
                    <Upload style={{ width: 14, height: 14 }} /> Upload File
                  </button>
                  <input ref={vaultFileRef} type="file" style={{ display: "none" }} onChange={uploadFile} />
                  <button
                    onClick={lockVault}
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", padding: "8px 14px", borderRadius: 9, border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 500 }}
                  >
                    <Lock style={{ width: 14, height: 14 }} /> Lock
                  </button>
                </div>
              </div>

              {/* Two-column vault content */}
              <div style={{ flex: 1, display: "flex", gap: 16, overflow: "hidden" }}>
                {/* Item list */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {vaultItems.length === 0 ? (
                    <EmptyState icon={Shield} title="Vault is empty" sub="Add encrypted notes or upload files to save them directly to database" />
                  ) : (
                    vaultItems.map((item) => {
                      const isImg = item.fileType?.startsWith("image/");
                      return (
                        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-color)", transition: "all 0.15s" }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: item.type === "file" ? "rgba(139,92,246,0.1)" : "rgba(240,100,73,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {item.type === "file"
                              ? (isImg ? <ImageIcon style={{ width: 18, height: 18, color: "#8b5cf6" }} /> : <File style={{ width: 18, height: 18, color: "#8b5cf6" }} />)
                              : <FileText style={{ width: 18, height: 18, color: "var(--accent)" }} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "0.87rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                            <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                              {item.type === "file" ? `${item.fileType} · ${fmtSize(item.fileSize ?? 0)}` : `Note · ${(item.content ?? "").length} chars`} · {fmtDate(item.createdAt)}
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: 5 }}>
                            {item.type === "note" && (
                              <>
                                <VaultBtn icon={Eye} title="Preview" onClick={() => { setPreviewItem((p) => p?.id === item.id ? null : item); setVaultMode(null); }} />
                                <VaultBtn icon={Edit3} title="Edit" onClick={() => { setVaultMode("note"); setVaultEditItem(item); setVaultTitle(item.title); setVaultContent(item.content ?? ""); setPreviewItem(null); }} />
                              </>
                            )}
                            {item.type === "file" && (
                              <VaultBtn icon={Download} title="Download" onClick={() => downloadFile(item)} />
                            )}
                            <VaultBtn icon={Trash2} title="Delete" danger onClick={() => deleteVaultItem(item.id)} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Side panel: editor or preview */}
                {(vaultMode === "note" || previewItem) && (
                  <div style={{ width: 400, flexShrink: 0, background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", overflow: "hidden", animation: "fade-in-scale 0.2s ease-out" }}>
                    {/* Panel header */}
                    <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.87rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {vaultMode === "note" ? (vaultEditItem ? "Edit Secure Note" : "New Secure Note") : previewItem?.title}
                      </span>
                      <button
                        onClick={() => { setVaultMode(null); setPreviewItem(null); setVaultEditItem(null); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", flexShrink: 0, padding: 4 }}
                      >
                        <X style={{ width: 15, height: 15 }} />
                      </button>
                    </div>

                    {/* Panel body */}
                    {vaultMode === "note" ? (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, gap: 10, overflow: "hidden" }}>
                        <input
                          value={vaultTitle}
                          onChange={(e) => setVaultTitle(e.target.value)}
                          placeholder="Title…"
                          style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontFamily: "var(--font-heading)", fontSize: "0.9rem", fontWeight: 600, outline: "none", width: "100%", boxSizing: "border-box" }}
                        />
                        <textarea
                          value={vaultContent}
                          onChange={(e) => setVaultContent(e.target.value)}
                          placeholder="Write your secure note here…"
                          style={{ flex: 1, resize: "none", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "0.88rem", lineHeight: 1.65, outline: "none", minHeight: 180, boxSizing: "border-box" }}
                        />
                        <button
                          onClick={saveVaultNote}
                          disabled={!vaultTitle.trim()}
                          className="btn-primary"
                          style={{ fontSize: "0.85rem", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                        >
                          <Save style={{ width: 14, height: 14 }} /> {vaultEditItem ? "Update" : "Save Securely"}
                        </button>
                      </div>
                    ) : previewItem ? (
                      <>
                        <div style={{ flex: 1, padding: "16px 18px", overflowY: "auto", fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                          {previewItem.content || <span style={{ color: "var(--text-muted)" }}>No content</span>}
                        </div>
                        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border-color)", fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                          Created {fmtDate(previewItem.createdAt)}
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function TagPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "3px 10px",
        borderRadius: 20,
        border: "1px solid var(--border-color)",
        background: active ? "var(--gradient-accent)" : "transparent",
        color: active ? "white" : "var(--text-secondary)",
        fontSize: "0.72rem",
        fontFamily: "var(--font-heading)",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function MiniTag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ padding: "1px 7px", borderRadius: 20, background: "rgba(240,100,73,0.1)", color: "var(--accent)", fontSize: "0.67rem", fontFamily: "var(--font-heading)", fontWeight: 600 }}>
      {children}
    </span>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "48px 24px", color: "var(--text-muted)" }}>
      <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(240,100,73,0.07)", border: "2px dashed var(--border-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon style={{ width: 30, height: 30, color: "var(--accent)", opacity: 0.5 }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 4px", fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)" }}>{title}</p>
        {sub && <p style={{ margin: 0, fontSize: "0.8rem" }}>{sub}</p>}
      </div>
    </div>
  );
}

function PinField({ label, value, onChange, show, onToggleShow, onKeyDown }: { label?: string; value: string; onChange: (v: string) => void; show: boolean; onToggleShow?: () => void; onKeyDown?: React.KeyboardEventHandler }) {
  return (
    <div>
      {label && <label style={{ display: "block", marginBottom: 6, fontSize: "0.78rem", fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--text-secondary)" }}>{label}</label>}
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="••••••"
          maxLength={8}
          style={{
            width: "100%",
            padding: "11px 42px 11px 16px",
            borderRadius: 11,
            border: "1.5px solid var(--border-color)",
            background: "var(--bg-input)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
            fontSize: "1.1rem",
            letterSpacing: "0.3em",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {onToggleShow && (
          <button onClick={onToggleShow} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
            {show ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
          </button>
        )}
      </div>
    </div>
  );
}

function PinError({ msg }: { msg: string }) {
  return (
    <p style={{ margin: 0, color: "#ef4444", fontSize: "0.79rem", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 5 }}>
      <AlertTriangle style={{ width: 12, height: 12 }} />{msg}
    </p>
  );
}

function VaultBtn({ icon: Icon, title, danger, onClick }: { icon: React.ElementType; title: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 30,
        height: 30,
        borderRadius: 7,
        border: `1px solid ${danger ? "rgba(239,68,68,0.2)" : "var(--border-color)"}`,
        background: "transparent",
        color: danger ? "#ef4444" : "var(--text-muted)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s",
      }}
    >
      <Icon style={{ width: 13, height: 13 }} />
    </button>
  );
}

export default NotesApp;


"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Film, X, Paperclip, ImageIcon } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string, movieData?: any, fileData?: { file: File, previewUrl: string } | null) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [movieData, setMovieData] = useState<any | null>(null);
  const [fileData, setFileData] = useState<{ file: File, previewUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleAttachMovieDummy = () => {
    setMovieData({
      id: 550,
      title: "Fight Club",
      poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      release_date: "1999-10-15"
    });
    if (fileData) {
      URL.revokeObjectURL(fileData.previewUrl);
      setFileData(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFileData({ file, previewUrl });
      setMovieData(null);
    }
  };

  // Handle clipboard paste for screenshots
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const previewUrl = URL.createObjectURL(file);
            setFileData({ file, previewUrl });
            setMovieData(null);
            e.preventDefault();
            break;
          }
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !movieData && !fileData) return;
    
    await onSendMessage(content.trim(), movieData, fileData);
    setContent("");
    setMovieData(null);
    // Note: Since we are mocking uploads, we must NOT revoke the ObjectURL here,
    // otherwise the image in the chat history will break.
    setFileData(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {/* Attached Movie Preview */}
      {movieData && (
        <div className="flex items-center gap-3 p-2 rounded-lg w-fit max-w-full border pr-8 relative" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="w-10 h-14 shrink-0 rounded overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
             {movieData.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w92${movieData.poster_path}`} alt="poster" className="w-full h-full object-cover" />
             ) : (
                <Film size={16} className="text-[var(--text-muted)]" />
             )}
          </div>
          <div className="flex flex-col min-w-0">
             <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Attached Movie</span>
             <span className="text-sm font-medium truncate text-[var(--text-primary)]">{movieData.title}</span>
          </div>
          <button 
            type="button"
            onClick={() => setMovieData(null)}
            className="absolute top-2 right-2 p-1 rounded-full transition-colors hover:bg-[var(--bg-card)]"
          >
            <X size={14} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
          </button>
        </div>
      )}

      {/* Attached File/Image Preview */}
      {fileData && (
        <div className="flex items-center gap-3 p-2 rounded-lg w-fit max-w-full border pr-8 relative" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="w-14 h-14 shrink-0 rounded overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
             {fileData.file.type.startsWith('image/') ? (
                <img src={fileData.previewUrl} alt="preview" className="w-full h-full object-cover" />
             ) : (
                <Paperclip size={20} className="text-[var(--text-muted)]" />
             )}
          </div>
          <div className="flex flex-col min-w-0">
             <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Attached File</span>
             <span className="text-sm font-medium truncate text-[var(--text-primary)]">{fileData.file.name}</span>
          </div>
          <button 
            type="button"
            onClick={() => {
              URL.revokeObjectURL(fileData.previewUrl);
              setFileData(null);
            }}
            className="absolute top-2 right-2 p-1 rounded-full transition-colors hover:bg-[var(--bg-card)]"
          >
            <X size={14} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 relative rounded-xl border px-3 py-2 shadow-sm focus-within:ring-1 transition-all" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', ['--tw-ring-color' as any]: 'var(--accent)' }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach Image/File (or paste screenshot)"
          className="p-2 shrink-0 rounded-full transition-colors mb-0.5 text-[var(--text-muted)] hover:text-[var(--accent)]"
          disabled={disabled}
        >
          <ImageIcon size={20} />
        </button>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileSelect} 
        />

        <button
          type="button"
          onClick={handleAttachMovieDummy}
          title="Attach Movie (Demo)"
          className="p-2 shrink-0 rounded-full transition-colors mb-0.5 text-[var(--text-muted)] hover:text-[var(--accent)]"
          disabled={disabled}
        >
          <Film size={20} />
        </button>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          className="min-h-[40px] max-h-[160px] w-full resize-none bg-transparent py-2 px-1 focus:outline-none text-sm leading-relaxed text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          rows={1}
        />

        <button
          type="submit"
          disabled={disabled || (!content.trim() && !movieData && !fileData)}
          className="p-2 shrink-0 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 btn-primary hover:shadow-md"
          style={{ padding: '8px' }}
        >
          <Send size={18} className={disabled ? "opacity-50" : ""} />
        </button>
      </div>
    </form>
  );
}

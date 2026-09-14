"use client";

import { ChatMessageData } from "@/types/chat";
import { Film, FileText } from "lucide-react";
// Assumes date-fns is available or we can use standard Intl.DateTimeFormat
// I will use Intl.DateTimeFormat to avoid needing a new dependency right now.

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const timeString = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(message.created_at));

  // Placeholder for user avatar if profile info isn't joined
  const avatarFallback = message.user?.user_metadata?.full_name?.charAt(0) || "U";
  const userName = message.user?.user_metadata?.full_name || `User ${message.user_id.substring(0, 4)}`;

  return (
    <div className="group flex gap-4 w-full hover:bg-[var(--bg-card)] p-2 rounded-xl transition-all">
      {/* Avatar */}
      <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold shadow-sm" style={{ background: 'var(--gradient-accent)' }}>
        {message.user?.user_metadata?.avatar_url ? (
          <img 
            src={message.user.user_metadata.avatar_url} 
            alt={userName} 
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          avatarFallback
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-semibold text-sm text-[var(--text-primary)]">{userName}</span>
          <span className="text-xs text-[var(--text-muted)]">{timeString}</span>
        </div>
        
        <p className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Image Attachment */}
        {message.attachment_url && message.attachment_type === 'image' && (
          <div className="mt-3 max-w-sm rounded-lg overflow-hidden border shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
            <img src={message.attachment_url} alt="Attached Image" className="w-full h-auto object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity" />
          </div>
        )}
        
        {/* File Attachment */}
        {message.attachment_url && message.attachment_type === 'file' && (
          <div className="mt-3 max-w-sm rounded-lg border p-3 flex items-center gap-3 bg-[var(--bg-card)] shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
            <div className="w-10 h-10 rounded bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
              <FileText className="text-[var(--text-muted)]" size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-[var(--text-primary)] truncate">Attached Document</span>
              <a href={message.attachment_url} target="_blank" rel="noreferrer" className="text-xs hover:underline mt-0.5" style={{ color: 'var(--accent)' }}>Download</a>
            </div>
          </div>
        )}

        {/* Movie Card Snippet */}
        {message.movie_data && (
          <div className="mt-3 max-w-sm rounded-lg border overflow-hidden flex transition-all hover:shadow-md cursor-pointer" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
             {message.movie_data.poster_path ? (
               <img 
                 src={`https://image.tmdb.org/t/p/w200${message.movie_data.poster_path}`} 
                 alt={message.movie_data.title}
                 className="w-20 h-auto object-cover"
               />
             ) : (
               <div className="w-20 flex items-center justify-center shrink-0" style={{ background: 'var(--bg-secondary)' }}>
                 <Film className="h-8 w-8 text-[var(--text-muted)] opacity-50" />
               </div>
             )}
             <div className="p-3 flex flex-col justify-center">
               <h4 className="font-semibold text-sm line-clamp-1 text-[var(--text-primary)]">{message.movie_data.title}</h4>
               {message.movie_data.release_date && (
                 <p className="text-xs text-[var(--text-muted)] mt-1">
                   {message.movie_data.release_date.substring(0, 4)}
                 </p>
               )}
               <p className="text-xs font-medium mt-1 hover:underline" style={{ color: 'var(--accent)' }}>
                 View Details
               </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

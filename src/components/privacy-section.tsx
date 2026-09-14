"use client";

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function PrivacySection() {
  const [isPublic, setIsPublic] = useState(false);

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Control who sees your library and manage your local data footprint.
        </p>
      </div>

      <div className="space-y-6">
        {/* Visibility */}
        <div className="group relative flex items-center justify-between p-6 rounded-2xl border border-border/50 bg-background/50 hover:bg-card/80 transition-all duration-300">
          {/* Subtle hover glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
          
          <div className="pr-6 relative z-10">
            <h5 className={`font-medium flex items-center gap-2 mb-1.5 transition-colors duration-300 ${isPublic ? 'text-accent' : 'text-foreground'}`}>
              {isPublic ? <Eye className="w-5 h-5 text-accent" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
              Library Visibility
            </h5>
            <p className="text-sm text-muted-foreground">
              {isPublic 
                ? "Your library is public. Anyone can view your shared collections."
                : "Your library is private. Only you can see your collections."}
            </p>
          </div>
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`relative z-10 inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
              isPublic ? 'shadow-[0_0_10px_var(--accent-glow)]' : 'bg-muted hover:bg-muted/80'
            }`}
            style={isPublic ? { background: 'var(--gradient-accent)' } : undefined}
            role="switch"
            aria-checked={isPublic}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
                isPublic ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

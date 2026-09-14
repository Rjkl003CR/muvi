"use client";

import { useState } from 'react';
import { Eye, EyeOff, Shield, ShieldCheck, Lock, Globe } from 'lucide-react';

export function PrivacySection() {
  const [isPublic, setIsPublic] = useState(false);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Control who sees your library and manage your local data footprint.
      </p>

      {/* Visibility Card */}
      <div 
        className={`group relative flex items-center justify-between p-6 rounded-2xl border transition-all duration-500 overflow-hidden ${
          isPublic 
            ? 'border-accent/30 shadow-[0_0_25px_var(--accent-glow)]' 
            : 'border-border/50 hover:border-accent/20'
        }`}
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Animated background glow */}
        <div 
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            isPublic ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
          }`}
          style={{ 
            background: 'radial-gradient(ellipse at 30% 50%, var(--accent-glow), transparent 70%)' 
          }}
        />

        {/* Animated gradient sweep on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
          style={{ animation: 'gradient-slide 4s ease infinite', backgroundSize: '200% 100%' }}
        />
        
        <div className="pr-6 relative z-10 flex items-start gap-4">
          {/* Animated Icon */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
            isPublic 
              ? 'shadow-[0_0_20px_var(--accent-glow)]' 
              : 'bg-secondary border border-border/50 group-hover:border-accent/30'
          }`}
            style={isPublic ? { background: 'var(--gradient-accent)' } : undefined}
          >
            <div className="transition-transform duration-500 ease-out" style={{ transform: isPublic ? 'scale(1.1) rotate(0deg)' : 'scale(1) rotate(0deg)' }}>
              {isPublic 
                ? <Globe className="w-5 h-5 text-white" /> 
                : <Lock className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
              }
            </div>
          </div>

          <div>
            <h5 className={`font-semibold text-base flex items-center gap-2 mb-1 transition-colors duration-300 ${isPublic ? 'text-accent' : 'text-foreground'}`}>
              Library Visibility
              {/* Status badge */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-500 ${
                isPublic 
                  ? 'text-white shadow-[0_0_10px_var(--accent-glow)]'
                  : 'bg-secondary text-muted-foreground border border-border/50'
              }`}
                style={isPublic ? { background: 'var(--gradient-accent)' } : undefined}
              >
                {isPublic ? <><ShieldCheck className="w-3 h-3" /> Public</> : <><Shield className="w-3 h-3" /> Private</>}
              </span>
            </h5>
            <p className="text-sm text-muted-foreground leading-relaxed transition-all duration-300">
              {isPublic 
                ? "Your library is public. Anyone can view your shared collections."
                : "Your library is private. Only you can see your collections."}
            </p>
          </div>
        </div>

        {/* Enhanced Toggle Switch */}
        <button
          onClick={() => setIsPublic(!isPublic)}
          className={`relative z-10 inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
            isPublic 
              ? 'border-transparent shadow-[0_0_15px_var(--accent-glow)]' 
              : 'border-border/50 bg-secondary hover:border-accent hover:shadow-[0_0_10px_var(--accent-glow)] hover:bg-secondary/80'
          }`}
          style={isPublic ? { background: 'var(--gradient-accent)' } : undefined}
          role="switch"
          aria-checked={isPublic}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-all duration-300 ease-in-out ${
              isPublic ? 'translate-x-6 scale-90' : 'translate-x-0 scale-100'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

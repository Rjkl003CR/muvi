"use client";

import { Cloud } from 'lucide-react';

export default function StorageSettingsPage() {
  const used = 8.5;
  const total = 15;
  const percentage = (used / total) * 100;

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h3 className="text-3xl font-bold leading-tight tracking-tight bg-clip-text text-transparent pb-1" style={{ backgroundImage: 'var(--gradient-accent)' }}>Storage Quota</h3>
      </div>

      <div className="max-w-2xl relative">
        {/* Glow behind card */}
        <div className="absolute inset-0 bg-accent/10 blur-3xl rounded-[3rem] -z-10 animate-pulse-glow" />

        {/* Progress Bar Chart Card */}
        <div className="relative p-10 glass-card gradient-border-card animate-fade-in group">

          {/* Subtle mesh overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--accent-glow),_transparent_50%)] opacity-50 pointer-events-none transition-opacity group-hover:opacity-100 duration-500" />

          <div className="relative flex items-center gap-6 mb-12">
            <div className="p-5 text-white rounded-2xl shadow-[inset_0_0_0_1px_var(--accent-glow)] group-hover:scale-105 transition-transform duration-500" style={{ background: 'var(--gradient-accent)' }}>
              <Cloud className="w-10 h-10 drop-shadow-md" />
            </div>
            <div>
              <h4 className="text-2xl font-semibold">Cloud Storage</h4>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--accent)' }}></span>
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--accent)' }}></span>
                </span>
                Analyzing usage in real-time
              </p>
            </div>
          </div>

          <div className="relative space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-4xl font-bold text-foreground drop-shadow-sm">{used} <span className="text-xl text-muted-foreground font-medium">GB</span></span>
                <span className="text-sm text-muted-foreground ml-3 uppercase tracking-wider font-semibold">Used</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold">{total} <span className="text-sm text-muted-foreground">GB</span></span>
                <span className="text-xs text-muted-foreground block uppercase tracking-wider font-semibold mt-1">Total Quota</span>
              </div>
            </div>

            <div className="relative flex h-5 w-full overflow-hidden rounded-full bg-secondary shadow-inner p-0.5">
              <div
                className="relative h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_var(--accent-glow)]"
                style={{ width: `${percentage}%`, background: 'var(--gradient-accent)' }}
              >
                {/* Shine effect inside the bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-[200%] animate-[shimmer_2s_infinite]" />
              </div>
            </div>

            <div className="flex justify-between text-sm font-semibold pt-2 text-muted-foreground">
              <span className="text-accent">{percentage.toFixed(1)}% Consumed</span>
              <span>{(total - used).toFixed(1)} GB Remaining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useContext, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { ColorThemeContext } from '../../../components/theme-provider';

export default function PreferencesSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useContext(ColorThemeContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const palettes = [
    { id: 'theme-midnight-teal', name: 'Midnight Teal', gradient: 'linear-gradient(135deg, #0d9488, #06b6d4)' },
    { id: 'theme-emerald-matrix', name: 'Emerald Matrix', gradient: 'linear-gradient(135deg, #059669, #10b981)' },
    { id: 'theme-toxic-hazard', name: 'Toxic Hazard', gradient: 'linear-gradient(135deg, #16a34a, #4ade80)' },
    { id: 'theme-cyber-violet', name: 'Neon Cyber Violet', gradient: 'linear-gradient(135deg, #9333ea, #d946ef)' },
    { id: 'theme-arctic-frost', name: 'Arctic Frost', gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)' },
    { id: 'theme-bubblegum-pop', name: 'Bubblegum Pop', gradient: 'linear-gradient(135deg, #db2777, #f472b6)' },
    { id: 'theme-plasma-core', name: 'Plasma Core', gradient: 'linear-gradient(135deg, #7e22ce, #f43f5e)' },
    { id: 'theme-sapphire-surge', name: 'Sapphire Surge', gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)' },
    { id: 'theme-nebula-glow', name: 'Nebula Glow', gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
    { id: 'theme-synthwave-sunset', name: 'Synthwave Sunset', gradient: 'linear-gradient(135deg, #d946ef, #f97316)' },
    { id: 'theme-neon-glacier', name: 'Neon Glacier', gradient: 'linear-gradient(135deg, #0891b2, #22d3ee)' },
    { id: 'theme-crimson-abyss', name: 'Crimson Abyss', gradient: 'linear-gradient(135deg, #dc2626, #ef4444)' },
    { id: 'theme-ruby-pink', name: 'Ruby Pink', gradient: 'linear-gradient(135deg, #e11d48, #f43f5e)' },
    { id: 'theme-inferno-red', name: 'Inferno Red', gradient: 'linear-gradient(135deg, #b91c1c, #ef4444)' },
    { id: 'theme-blood-orange', name: 'Blood Orange', gradient: 'linear-gradient(135deg, #dc2626, #f97316)' },
    { id: 'theme-solar-flare', name: 'Solar Flare', gradient: 'linear-gradient(135deg, #ea580c, #eab308)' },
    { id: 'theme-atomic-tangerine', name: 'Atomic Tangerine', gradient: 'linear-gradient(135deg, #ea580c, #fdba74)' },
    { id: 'theme-molten-magma', name: 'Molten Magma', gradient: 'linear-gradient(135deg, #ea580c, #fb923c)' },
    { id: 'theme-lava-burst', name: 'Lava Burst', gradient: 'linear-gradient(135deg, #c2410c, #f97316)' },
    { id: 'theme-neon-tangerine', name: 'Neon Tangerine', gradient: 'linear-gradient(135deg, #ea580c, #fb923c)' },
    { id: 'theme-golden-blaze', name: 'Golden Blaze', gradient: 'linear-gradient(135deg, #b45309, #f59e0b)' },
    { id: 'theme-sunrise-burst', name: 'Sunrise Burst', gradient: 'linear-gradient(135deg, #f97316, #facc15)' },
    { id: 'theme-ember-glow', name: 'Ember Glow', gradient: 'linear-gradient(135deg, #92400e, #fbbf24)' },
    { id: 'theme-electric-amber', name: 'Electric Amber', gradient: 'linear-gradient(135deg, #d97706, #fde047)' }
  ];

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-3xl font-bold leading-tight tracking-tight bg-clip-text text-transparent pb-1" style={{ backgroundImage: 'var(--gradient-accent)' }}>Theme</h3>
      </div>

      <div className="max-w-3xl relative">
        <div className="relative p-8 glass-card gradient-border-card animate-fade-in group">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--accent-glow),_transparent_50%)] opacity-30 pointer-events-none transition-opacity group-hover:opacity-100 duration-500" />
          <div className="relative z-10 space-y-4">
            <div>
              <h4 className="text-lg font-medium">Color Palette & Mode</h4>
              <p className="text-sm text-muted-foreground">Choose a dynamic neon color set and select your preferred mode.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {palettes.map((palette) => (
                <div
                  key={palette.id}
                  onClick={() => setColorTheme(palette.id)}
                  className={`relative flex items-start gap-4 p-5 rounded-2xl border text-left transition-all cursor-pointer ${colorTheme === palette.id
                    ? 'border-accent bg-accent/5 shadow-[0_4px_24px_var(--accent-glow)]'
                    : 'border-border/50 bg-card hover:border-accent/50 hover:bg-accent/5 hover:-translate-y-1 hover:shadow-lg'
                    }`}
                >
                  <div
                    className="w-12 h-12 rounded-full flex-shrink-0 shadow-inner mt-1"
                    style={{ background: palette.gradient }}
                  />
                  <div className="flex-1">
                    <h5 className={`font-medium ${colorTheme === palette.id ? 'text-accent' : 'text-foreground'}`}>
                      {palette.name}
                    </h5>

                    {/* Integrated Light/Dark toggles for active theme */}
                    <div
                      className={`grid grid-cols-2 gap-2 overflow-hidden transition-all duration-300 ease-in-out ${colorTheme === palette.id ? 'mt-4 max-h-20 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setTheme('light')}
                        className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-xs font-medium transition-colors ${mounted && theme === 'light'
                          ? 'bg-accent text-white border-accent shadow-[0_0_10px_var(--accent-glow)]'
                          : 'bg-background hover:bg-secondary hover:border-accent hover:shadow-[0_0_10px_var(--accent-glow)] hover:text-accent transition-all duration-300 text-muted-foreground border-border/50'
                          }`}
                      >
                        <Sun className="w-3.5 h-3.5" /> Light
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-xs font-medium transition-colors ${mounted && theme === 'dark'
                          ? 'bg-accent text-white border-accent shadow-[0_0_10px_var(--accent-glow)]'
                          : 'bg-background hover:bg-secondary hover:border-accent hover:shadow-[0_0_10px_var(--accent-glow)] hover:text-accent transition-all duration-300 text-muted-foreground border-border/50'
                          }`}
                      >
                        <Moon className="w-3.5 h-3.5" /> Dark
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    {
      id: 'theme-coral',
      name: 'Coral Delight',
      description: 'Warm sunset orange and pink.',
      gradient: 'linear-gradient(135deg, #f06449, #f7b731)'
    },
    {
      id: 'theme-crimson',
      name: 'Crimson Blood',
      description: 'Deep ruby and vibrant cherry red.',
      gradient: 'linear-gradient(135deg, #e60000, #b30000)'
    },
    {
      id: 'theme-cyberpunk',
      name: 'Cyberpunk',
      description: 'High-contrast cyan and neon purple.',
      gradient: 'linear-gradient(135deg, #00f0ff, #bc13fe)'
    },
    {
      id: 'theme-synthwave',
      name: 'Synthwave',
      description: 'Deep violet and vibrant pink.',
      gradient: 'linear-gradient(135deg, #ff007f, #7000ff)'
    },
    {
      id: 'theme-acid',
      name: 'Acid Neon',
      description: 'Vibrant toxic greens.',
      gradient: 'linear-gradient(135deg, #39ff14, #bfff00)'
    },
    {
      id: 'theme-ocean',
      name: 'Ocean Breeze',
      description: 'Refreshing cerulean and sky blue.',
      gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)'
    },
    {
      id: 'theme-forest',
      name: 'Forest Canopy',
      description: 'Deep emerald and mint green.',
      gradient: 'linear-gradient(135deg, #10b981, #34d399)'
    },
    {
      id: 'theme-slate',
      name: 'Slate Minimal',
      description: 'Monochrome professional greys.',
      gradient: 'linear-gradient(135deg, #64748b, #94a3b8)'
    },
    {
      id: 'theme-amethyst',
      name: 'Amethyst',
      description: 'Rich royal purple.',
      gradient: 'linear-gradient(135deg, #8b5cf6, #c084fc)'
    },
    {
      id: 'theme-sunset',
      name: 'Sunset Orange',
      description: 'Warm amber and deep orange.',
      gradient: 'linear-gradient(135deg, #f97316, #fbbf24)'
    },
    {
      id: 'theme-emerald',
      name: 'Emerald Jewel',
      description: 'Bright vivid emerald green.',
      gradient: 'linear-gradient(135deg, #059669, #10b981)'
    },
    {
      id: 'theme-sapphire',
      name: 'Sapphire Deep',
      description: 'Deep ocean blues.',
      gradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6)'
    },
    {
      id: 'theme-ruby',
      name: 'Ruby Rose',
      description: 'Deep rose and red.',
      gradient: 'linear-gradient(135deg, #be123c, #f43f5e)'
    },
    {
      id: 'theme-gold',
      name: 'Golden Hour',
      description: 'Radiant yellow and gold.',
      gradient: 'linear-gradient(135deg, #ca8a04, #facc15)'
    },
    {
      id: 'theme-lavender',
      name: 'Lavender Mist',
      description: 'Soft and calming lavender.',
      gradient: 'linear-gradient(135deg, #a78bfa, #c4b5fd)'
    }
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
                className={`relative flex items-start gap-4 p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                  colorTheme === palette.id
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
                  <p className="text-xs text-muted-foreground mt-0.5">{palette.description}</p>
                  
                  {/* Integrated Light/Dark toggles for active theme */}
                  <div 
                    className={`grid grid-cols-2 gap-2 overflow-hidden transition-all duration-300 ease-in-out ${
                      colorTheme === palette.id ? 'mt-4 max-h-20 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-xs font-medium transition-colors ${
                        mounted && theme === 'light' 
                          ? 'bg-accent text-white border-accent shadow-[0_0_10px_var(--accent-glow)]' 
                          : 'bg-background hover:bg-secondary hover:border-accent hover:shadow-[0_0_10px_var(--accent-glow)] hover:text-accent transition-all duration-300 text-muted-foreground border-border/50'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" /> Light
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-xs font-medium transition-colors ${
                        mounted && theme === 'dark' 
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

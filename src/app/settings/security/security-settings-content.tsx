"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ResetPasswordForm } from '../../../components/reset-password-form';
import { PrivacySection } from '../../../components/privacy-section';

export function SecuritySettingsContent() {
  const [openSection, setOpenSection] = useState<'password' | 'privacy' | null>(null);

  const toggleSection = (section: 'password' | 'privacy') => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="grid gap-8 max-w-3xl">
      {/* Change Password Card */}
      <div className={`relative glass-card gradient-border-card animate-fade-in group transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_0_25px_var(--accent-glow)] hover:border-accent/30 ${openSection === 'password' ? 'shadow-[0_0_20px_var(--accent-glow)] border-accent/20' : ''}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--accent-glow),_transparent_50%)] opacity-0 pointer-events-none transition-opacity group-hover:opacity-60 duration-500" style={openSection === 'password' ? { opacity: 0.4 } : undefined} />
        
        <button 
          onClick={() => toggleSection('password')}
          className="w-full flex items-center justify-between p-8 relative z-10 text-left focus:outline-none"
        >
          <h4 className="text-xl font-semibold flex items-center gap-2 transition-colors duration-300 group-hover:text-accent">
            <span className="w-1.5 h-6 bg-accent rounded-full inline-block transition-all duration-300 group-hover:h-8 group-hover:shadow-[0_0_8px_var(--accent-glow)]"></span>
            Change Password
          </h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium transition-colors hover:text-accent">
            {openSection === 'password' ? (
              <>Show Less <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>Show More <ChevronDown className="w-4 h-4" /></>
            )}
          </div>
        </button>

        <div className={`relative z-10 px-8 transition-all duration-500 ease-in-out overflow-hidden ${openSection === 'password' ? 'max-h-[1000px] opacity-100 pb-8' : 'max-h-0 opacity-0 pb-0'}`}>
          <ResetPasswordForm />
        </div>
      </div>

      {/* Privacy Section Card */}
      <div className={`relative glass-card gradient-border-card animate-fade-in group transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_0_25px_var(--accent-glow)] hover:border-accent/30 ${openSection === 'privacy' ? 'shadow-[0_0_20px_var(--accent-glow)] border-accent/20' : ''}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--accent-glow),_transparent_50%)] opacity-0 pointer-events-none transition-opacity group-hover:opacity-60 duration-500" style={openSection === 'privacy' ? { opacity: 0.4 } : undefined} />
        
        <button 
          onClick={() => toggleSection('privacy')}
          className="w-full flex items-center justify-between p-8 relative z-10 text-left focus:outline-none"
        >
          <h4 className="text-xl font-semibold flex items-center gap-2 transition-colors duration-300 group-hover:text-accent">
            <span className="w-1.5 h-6 bg-accent rounded-full inline-block transition-all duration-300 group-hover:h-8 group-hover:shadow-[0_0_8px_var(--accent-glow)]"></span>
            Privacy Settings
          </h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium transition-colors hover:text-accent">
            {openSection === 'privacy' ? (
              <>Show Less <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>Show More <ChevronDown className="w-4 h-4" /></>
            )}
          </div>
        </button>

        <div className={`relative z-10 px-8 transition-all duration-500 ease-in-out overflow-hidden ${openSection === 'privacy' ? 'max-h-[1000px] opacity-100 pb-8' : 'max-h-0 opacity-0 pb-0'}`}>
          <PrivacySection />
        </div>
      </div>
    </div>
  );
}

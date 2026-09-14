import { ResetPasswordForm } from '../../../components/reset-password-form';
import { PrivacySection } from '../../../components/privacy-section';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security & Privacy | Muvi',
  description: 'Manage your Muvi account security and privacy',
};

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h3 className="text-3xl font-bold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-pink pb-1">Security Settings</h3>
      </div>
      
      <div className="grid gap-8 max-w-3xl">
        {/* Change Password Card */}
        <div className="relative p-8 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-card hover:shadow-card-hover transition-all duration-500 overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--accent-glow),_transparent_50%)] opacity-30 pointer-events-none transition-opacity group-hover:opacity-100 duration-500" />
          <h4 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-accent rounded-full inline-block"></span>
            Change Password
          </h4>
          <div className="relative z-10">
            <ResetPasswordForm />
          </div>
        </div>

        {/* Privacy Section Card */}
        <div className="relative p-8 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-card hover:shadow-card-hover transition-all duration-500 overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--accent-glow),_transparent_50%)] opacity-30 pointer-events-none transition-opacity group-hover:opacity-100 duration-500" />
          <h4 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-accent rounded-full inline-block"></span>
            Privacy Settings
          </h4>
          <div className="relative z-10">
            <PrivacySection />
          </div>
        </div>
      </div>
    </div>
  );
}

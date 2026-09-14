import { ProfileForm } from '../../../components/profile-form';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile | Muvi',
  description: 'Manage your Muvi profile',
};

export default function ProfilePage() {
  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h3 className="text-3xl font-bold leading-tight tracking-tight bg-clip-text text-transparent pb-1" style={{ backgroundImage: 'var(--gradient-accent)' }}>Profile</h3>
      </div>
      <div className="max-w-3xl relative">
        <div className="absolute inset-0 bg-accent/10 blur-3xl rounded-[3rem] -z-10 animate-pulse-glow" />
        <div className="relative p-8 glass-card gradient-border-card animate-fade-in group">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--accent-glow),_transparent_50%)] opacity-30 pointer-events-none transition-opacity group-hover:opacity-100 duration-500" />
          <div className="relative z-10">
            <ProfileForm />
          </div>
        </div>
      </div>
    </div>
  );
}

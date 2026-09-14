import { SecuritySettingsContent } from './security-settings-content';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security & Privacy | Muvi',
  description: 'Manage your Muvi account security and privacy',
};

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h3 className="text-3xl font-bold leading-tight tracking-tight bg-clip-text text-transparent pb-1" style={{ backgroundImage: 'var(--gradient-accent)' }}>Security & Privacy</h3>
      </div>
      
      <SecuritySettingsContent />
    </div>
  );
}

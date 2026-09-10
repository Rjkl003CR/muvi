import { ProfileForm } from '../../../components/profile-form';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile | Muvi',
  description: 'Manage your Muvi profile',
};

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Public Profile</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This is how others will see you on Muvi.
        </p>
      </div>
      <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
        <ProfileForm />
      </div>
    </div>
  );
}

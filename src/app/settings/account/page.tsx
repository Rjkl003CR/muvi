import { ResetPasswordForm } from '../../../components/reset-password-form';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Settings | Muvi',
  description: 'Manage your Muvi account and security',
};

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Account & Security</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Manage your password and security preferences.
        </p>
      </div>
      
      <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
        <h4 className="text-lg font-medium mb-4">Change Password</h4>
        <ResetPasswordForm />
      </div>
    </div>
  );
}

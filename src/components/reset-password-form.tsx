'use client';

import { useState } from 'react';
import { Loader2, KeyRound } from 'lucide-react';

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const validatePasswordPolicy = (password: string) => {
    // 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setIsLoading(false);
      return;
    }

    if (!validatePasswordPolicy(newPassword)) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.' });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <label htmlFor="current" className="text-sm font-medium leading-none">
          Current Password
        </label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          <input
            id="current"
            type="password"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="new" className="text-sm font-medium leading-none">
          New Password
        </label>
        <input
          id="new"
          type="password"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <p className="text-[10px] text-muted-foreground">
          Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirm" className="text-sm font-medium leading-none">
          Confirm New Password
        </label>
        <input
          id="confirm"
          type="password"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {message.text && (
        <div className={`p-3 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
          ) : (
            'Update Password'
          )}
        </button>
      </div>
    </form>
  );
}

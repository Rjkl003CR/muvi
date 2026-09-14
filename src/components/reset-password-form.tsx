'use client';

import { useState } from 'react';
import { Loader2, KeyRound, CheckCircle2 } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <div className="space-y-2">
        <label htmlFor="current" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Current Password
        </label>
        <div className="relative">
          <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
          <input
            id="current"
            type="password"
            required
            className="input-glow pl-11"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="new" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          New Password
        </label>
        <input
          id="new"
          type="password"
          required
          className="input-glow"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        {newPassword && (
          <div className="pt-2">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary shadow-inner">
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  newPassword.length < 5
                    ? 'w-1/4 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                    : !validatePasswordPolicy(newPassword)
                    ? 'w-2/4 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                    : 'w-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                }`}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {validatePasswordPolicy(newPassword) ? (
                <span className="text-green-500 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Strong password!</span>
              ) : (
                <span>Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.</span>
              )}
            </p>
          </div>
        )}
        {!newPassword && (
          <p className="text-xs text-muted-foreground pt-1">
            Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirm" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Confirm New Password
        </label>
        <input
          id="confirm"
          type="password"
          required
          className="input-glow"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
          {message.text}
        </div>
      )}

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center"
          style={{ background: 'var(--gradient-accent)' }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Updating...</span>
          ) : (
            'Update Password'
          )}
        </button>
      </div>
    </form>
  );
}

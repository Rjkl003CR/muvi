'use client';

import { useState, useEffect } from 'react';
import { Camera, Loader2 } from 'lucide-react';

export function ProfileForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [message, setMessage] = useState('');

  // Fetch initial profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setName(data.user.name || '');
            setAvatarUrl(data.user.avatar_url || '');
          }
        }
      } catch (e) {
        console.error('Failed to fetch profile', e);
      } finally {
        setIsFetching(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar_url: avatarUrl }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setMessage(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      setMessage('Image must be under 1MB.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file (JPG, PNG, or GIF).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAvatarUrl(base64);
      setMessage('');
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Avatar Section */}
      <div className="flex items-center space-x-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center border-[3px] border-accent/20 bg-accent/10 shadow-[0_0_20px_var(--accent-glow)] transition-all duration-500 group-hover:border-accent">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-accent font-semibold">
                {name ? name.charAt(0).toUpperCase() : '?'}
              </span>
            )}
          </div>
          {/* Avatar Upload Overlay */}
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
            <Camera className="w-6 h-6" />
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </label>
        </div>
        <div>
          <h4 className="text-lg font-medium text-foreground">Profile Picture</h4>
          <p className="text-sm text-muted-foreground mt-1">JPG, GIF or PNG. 1MB max.</p>
        </div>
      </div>

      <div className="space-y-3 max-w-md">
        <label htmlFor="name" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Display Name
        </label>
        <input
          id="name"
          className="input-glow"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="text-xs text-muted-foreground pt-1">
          This is your public display name. It can be real or a pseudonym.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium max-w-md border ${message.includes('success') ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
          {message}
        </div>
      )}

      <div className="flex justify-start pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex items-center justify-center"
          style={{ background: 'var(--gradient-accent)' }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
}

import Link from 'next/link';
import { User, Settings as SettingsIcon } from 'lucide-react';
import React from 'react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-r border-border/50 bg-card p-6 md:min-h-screen">
        <h2 className="text-2xl font-bold text-foreground mb-8">Account</h2>
        <nav className="flex flex-col space-y-2">
          <Link
            href="/settings/profile"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
          >
            <User className="w-5 h-5 text-muted-foreground group-hover:text-accent-foreground" />
            <span className="font-medium">Profile</span>
          </Link>
          <Link
            href="/settings/account"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
          >
            <SettingsIcon className="w-5 h-5 text-muted-foreground group-hover:text-accent-foreground" />
            <span className="font-medium">Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

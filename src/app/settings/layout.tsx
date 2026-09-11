import React from 'react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: '40px 24px 80px',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}

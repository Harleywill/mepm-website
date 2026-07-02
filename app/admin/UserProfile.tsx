'use client';

import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

interface UserInfo {
  username: string;
  role: string;
}

export default function UserProfile() {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setUser({ username: data.username, role: data.role });
        }
      })
      .catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <div
      style={{
        padding: '14px 12px',
        borderTop: '1px solid rgba(255,255,255,.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255,255,255,.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,.6)',
          flex: 'none',
        }}
      >
        <User size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 13,
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {user.username}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'rgba(255,255,255,.5)',
            textTransform: 'capitalize',
            marginTop: 2,
          }}
        >
          {user.role}
        </div>
      </div>
    </div>
  );
}

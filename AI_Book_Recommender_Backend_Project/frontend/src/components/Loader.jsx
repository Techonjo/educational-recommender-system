import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loader({ text = 'Searching Open Library...' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '5rem 2rem', gap: '1.25rem',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 var(--accent-glow); }
          60%  { box-shadow: 0 0 0 14px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>

      <div style={{
        width: '52px', height: '52px', borderRadius: '50%',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-highlight)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse-ring 2s ease-in-out infinite',
      }}>
        <Loader2
          size={24}
          color="var(--accent-color)"
          style={{ animation: 'spin 1.4s linear infinite' }}
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
          {text}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          This may take a moment
        </p>
      </div>
    </div>
  );
}

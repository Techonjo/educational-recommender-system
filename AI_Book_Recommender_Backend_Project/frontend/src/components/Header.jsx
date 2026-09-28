import React, { useState } from 'react';
import { BookOpen, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

export default function Header() {
  const { user, logout } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <header style={{
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-color)',
        padding: '0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '60px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-color)',
              padding: '0.45rem',
              borderRadius: '8px',
              display: 'flex',
              border: '1px solid rgba(99,102,241,0.2)',
            }}>
              <BookOpen size={18} strokeWidth={2} />
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Gideon <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Books</span>
            </span>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a
              href="https://openlibrary.org"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color var(--transition)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              Open Library
            </a>

            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }} />

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={14} color="var(--accent-color)" />
                  {user.name.split(' ')[0]}
                </span>
                <button 
                  onClick={logout}
                  className="btn" 
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
                >
                  <LogOut size={12} />
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthOpen(true)}
                className="btn btn-primary" 
                style={{ padding: '0.4rem 1rem', fontSize: '0.8125rem' }}
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}

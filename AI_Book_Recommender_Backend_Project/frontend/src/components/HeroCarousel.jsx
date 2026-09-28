import React, { useState, useEffect, useCallback } from 'react';
import { Search, ArrowRight, Brain, Network, Code2, Database, Shield, Cpu } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    icon: Brain,
    topic: 'Artificial Intelligence',
    headline: 'Master the Minds of Machines',
    description: 'Explore neural networks, machine learning theory, and the algorithms shaping the future of computing.',
    color: '#6366f1',
    glow: 'rgba(99,102,241,0.12)',
    books: ['Pattern Recognition', 'Deep Learning', 'Reinforcement Learning'],
  },
  {
    id: 2,
    icon: Network,
    topic: 'Computer Networks',
    headline: 'Connect the World, Byte by Byte',
    description: 'From TCP/IP fundamentals to modern distributed systems — build your networking foundation.',
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.12)',
    books: ['TCP/IP Illustrated', 'Computer Networking', 'Network Programming'],
  },
  {
    id: 3,
    icon: Code2,
    topic: 'Software Engineering',
    headline: 'Build Systems That Last',
    description: 'Design patterns, clean architecture, and the principles behind industry-grade software.',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.12)',
    books: ['Clean Code', 'The Pragmatic Programmer', 'Design Patterns'],
  },
  {
    id: 4,
    icon: Database,
    topic: 'Data Structures & Algorithms',
    headline: 'The Foundation of All Computing',
    description: 'Master sorting, searching, trees, graphs, and the algorithmic thinking every developer needs.',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.12)',
    books: ['Introduction to Algorithms', 'Algorithms 4th Ed.', 'Algorithm Design'],
  },
  {
    id: 5,
    icon: Shield,
    topic: 'Cybersecurity',
    headline: 'Defend the Digital World',
    description: 'Cryptography, penetration testing, secure design — build robust defences against modern threats.',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.12)',
    books: ['The Web Application Hacker\'s Handbook', 'Hacking: The Art of Exploitation', 'Security Engineering'],
  },
  {
    id: 6,
    icon: Cpu,
    topic: 'Operating Systems',
    headline: 'The Software Beneath Everything',
    description: 'Processes, memory management, file systems, and concurrency — how OSes manage the machine.',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.12)',
    books: ['Modern Operating Systems', 'Operating System Concepts', 'The Linux Programming Interface'],
  },
];

export default function HeroCarousel({ onSearch }) {
  const [active, setActive] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = useCallback((idx) => {
    if (isAnimating || idx === active) return;
    setIsAnimating(true);
    setTimeout(() => {
      setActive(idx);
      setIsAnimating(false);
    }, 250);
  }, [active, isAnimating]);

  const next = useCallback(() => goTo((active + 1) % SLIDES.length), [active, goTo]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = SLIDES[active];
  const Icon = slide.icon;

  return (
    <div style={{
      position: 'relative',
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: '20px',
      overflow: 'hidden',
      marginBottom: '3.5rem',
      minHeight: '340px',
    }}>
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-60px',
        width: '320px', height: '320px', borderRadius: '50%',
        background: slide.glow,
        filter: 'blur(60px)',
        transition: 'background 0.6s ease',
        pointerEvents: 'none',
      }} />

      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: '4px',
        background: `linear-gradient(to bottom, transparent, ${slide.color}, transparent)`,
        transition: 'background 0.5s ease',
      }} />

      {/* Content */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '3rem',
        padding: '3rem 3rem 3rem 3.5rem',
        opacity: isAnimating ? 0 : 1,
        transform: isAnimating ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
      }}>
        {/* Text side */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Category badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.3rem 0.75rem',
            backgroundColor: 'var(--bg-surface-2)',
            border: `1px solid ${slide.color}33`,
            borderRadius: '20px',
            fontSize: '0.75rem', fontWeight: 600,
            color: slide.color,
            marginBottom: '1.25rem',
            letterSpacing: '0.03em',
          }}>
            <Icon size={13} />
            {slide.topic}
          </div>

          <h2 style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
            color: 'var(--text-primary)',
          }}>
            {slide.headline}
          </h2>

          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '1.75rem',
            maxWidth: '480px',
          }}>
            {slide.description}
          </p>

          <button
            className="btn btn-primary"
            style={{ gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.9375rem' }}
            onClick={() => onSearch(slide.topic)}
          >
            Explore {slide.topic}
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Featured books visual */}
        <div style={{
          display: 'flex', gap: '0.75rem', alignItems: 'flex-end',
          flexShrink: 0,
        }}
          className="hero-books"
        >
          {slide.books.map((title, i) => (
            <div key={i} style={{
              width: '70px',
              height: `${130 + i * 15}px`,
              borderRadius: '4px',
              backgroundColor: 'var(--bg-surface-2)',
              border: `1px solid ${slide.color}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0.5rem',
              boxShadow: `3px 3px 0 0 ${slide.color}18`,
              transform: `rotate(${(i - 1) * 2}deg)`,
              transition: 'all 0.4s ease',
            }}>
              <span style={{
                writingMode: 'vertical-rl', textOrientation: 'mixed',
                fontSize: '0.6rem', fontWeight: 600,
                color: slide.color,
                opacity: 0.85,
                textAlign: 'center',
              }}>
                {title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar: dots + slide counter */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 3.5rem 1.25rem',
        borderTop: '1px solid var(--border-color)',
      }}>
        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === active ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                border: 'none', cursor: 'pointer',
                backgroundColor: i === active ? slide.color : 'var(--border-highlight)',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Counter */}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {String(active + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
        </span>
      </div>

      {/* CSS for responsive hiding of books */}
      <style>{`
        @media (max-width: 700px) {
          .hero-books { display: none !important; }
        }
      `}</style>
    </div>
  );
}

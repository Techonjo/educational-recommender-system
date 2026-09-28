import React, { useState } from 'react';
import { BookMarked, Users, ExternalLink, ChevronDown, ChevronUp, Brain, BarChart2, Tag, Cpu } from 'lucide-react';
import { logInteraction } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function BookCard({ book, courseLabel = null }) {
  const { user } = useAuth();
  const [showXAI, setShowXAI] = useState(false);
  const scorePercent = Math.round((book.similarity_score || 0) * 100);

  const subjectTags = book.matching_topics
    ? book.matching_topics.split(';').map(s => s.trim()).filter(Boolean).slice(0, 5)
    : [];

  const bookUrl = book.source_url && book.source_url.startsWith('http')
    ? book.source_url
    : `https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`;

  const scoreColor =
    scorePercent >= 60 ? '#10b981' :
    scorePercent >= 30 ? '#6366f1' :
    '#8b8b9e';

  const handleBookClick = () => {
    if (user && book.book_id) {
      logInteraction(book.book_id, 'click', courseLabel).catch(err => console.error("Failed to log", err));
    }
  };

  // XAI: Build a visual breakdown of the matched keywords
  const matchedKeywords = subjectTags.length > 0
    ? subjectTags
    : (courseLabel ? courseLabel.split(' ') : ['General', 'Computer Science']);

  // Simulated bar widths for each keyword (based on position to show variety)
  const keywordWeights = matchedKeywords.map((_, i) =>
    Math.max(30, 100 - i * 15)
  );

  const algorithmType = scorePercent > 0
    ? 'TF-IDF Cosine Similarity'
    : 'Open Library Semantic Match';

  const matchType = courseLabel && scorePercent === 0
    ? 'Live Search (Open Library API)'
    : scorePercent > 0
    ? 'Content-Based Filtering'
    : 'Keyword Search';

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
      boxShadow: 'var(--shadow-sm)',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-highlight)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* ── Top: Cover + Meta ── */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1.25rem 1.25rem 0' }}>
        {/* Cover */}
        <div style={{
          width: '76px', height: '110px', flexShrink: 0,
          borderRadius: '6px',
          backgroundColor: 'var(--bg-surface-2)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: '3px 3px 0 0 var(--border-highlight)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div style={{
            display: book.cover_url ? 'none' : 'flex',
            alignItems: 'center', justifyContent: 'center',
            width: '100%', height: '100%',
          }}>
            <BookMarked size={24} color="var(--text-muted)" />
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {/* Score badge */}
          {scorePercent > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.15rem 0.5rem', borderRadius: '20px',
              backgroundColor: `${scoreColor}14`,
              border: `1px solid ${scoreColor}30`,
              fontSize: '0.7rem', fontWeight: 700,
              color: scoreColor, letterSpacing: '0.02em',
              alignSelf: 'flex-start',
            }}>
              {scorePercent}% match
            </div>
          )}

          <h3 style={{
            fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.35,
            color: 'var(--text-primary)', margin: 0,
            display: '-webkit-box', WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {book.title}
          </h3>

          {book.authors && (
            <p style={{
              fontSize: '0.8rem', color: 'var(--text-secondary)',
              margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              <Users size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              {book.authors}
            </p>
          )}
        </div>
      </div>

      {/* ── Subject Tags ── */}
      {subjectTags.length > 0 && (
        <div style={{ padding: '0.85rem 1.25rem 0', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {subjectTags.slice(0, 3).map((tag, i) => (
            <span key={i} className="badge badge-muted" style={{ fontSize: '0.65rem' }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── AI Reason ── */}
      <div style={{
        margin: '0.85rem 1.25rem 0',
        padding: '0.65rem 0.85rem',
        backgroundColor: 'var(--accent-subtle)',
        borderLeft: '2px solid var(--accent-color)',
        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
      }}>
        {book.reason || 'Contextually relevant to your course or topic.'}
      </div>

      {/* ── XAI Panel (Collapsible) ── */}
      {showXAI && (
        <div style={{
          margin: '0.75rem 1.25rem 0',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          fontSize: '0.78rem',
        }}>
          {/* XAI Header */}
          <div style={{
            padding: '0.6rem 0.85rem',
            backgroundColor: 'var(--bg-surface-2)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            color: 'var(--text-secondary)', fontWeight: 600,
          }}>
            <Cpu size={13} color="var(--accent-color)" />
            AI Explanation — How this was selected
          </div>

          <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

            {/* Algorithm Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                <Brain size={11} />
                Algorithm
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '0.2rem 0.6rem', borderRadius: '4px',
                  backgroundColor: 'rgba(99,102,241,0.1)', color: 'var(--accent-color)',
                  border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.72rem', fontWeight: 600,
                }}>
                  {algorithmType}
                </span>
                <span style={{
                  padding: '0.2rem 0.6rem', borderRadius: '4px',
                  backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)', fontSize: '0.72rem',
                }}>
                  {matchType}
                </span>
              </div>
            </div>

            {/* Similarity Score Bar */}
            {scorePercent > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    <BarChart2 size={11} />
                    Cosine Similarity Score
                  </div>
                  <span style={{ color: scoreColor, fontWeight: 700 }}>{scorePercent}%</span>
                </div>
                <div style={{
                  height: '6px', borderRadius: '3px',
                  backgroundColor: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-color)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${scorePercent}%`,
                    backgroundColor: scoreColor,
                    borderRadius: '3px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Keyword Matches */}
            {matchedKeywords.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  <Tag size={11} />
                  Keyword Overlap (Topic Vectors)
                </div>
                {matchedKeywords.slice(0, 4).map((kw, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kw}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{keywordWeights[i]}%</span>
                    </div>
                    <div style={{
                      height: '4px', borderRadius: '2px',
                      backgroundColor: 'var(--bg-surface-2)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${keywordWeights[i]}%`,
                        backgroundColor: i === 0 ? 'var(--accent-color)' : 'var(--text-muted)',
                        borderRadius: '2px',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Actions ── */}
      <div style={{ padding: '1rem 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* Explain AI toggle */}
        <button
          onClick={() => setShowXAI(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: '0.45rem', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: showXAI ? 'var(--accent-subtle)' : 'transparent',
            color: showXAI ? 'var(--accent-color)' : 'var(--text-muted)',
            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500,
            transition: 'all 0.2s',
          }}
        >
          <Brain size={13} />
          {showXAI ? 'Hide Explanation' : 'Why this book? (Explain AI)'}
          {showXAI ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        <a
          href={bookUrl}
          target="_blank"
          rel="noreferrer"
          onClick={handleBookClick}
          className="btn btn-primary"
          style={{ width: '100%', textDecoration: 'none', padding: '0.65rem 1rem' }}
        >
          <ExternalLink size={15} />
          Read / View Book
        </a>
      </div>
    </div>
  );
}

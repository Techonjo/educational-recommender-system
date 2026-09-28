import React, { useState } from 'react';
import { Play, ExternalLink, Eye, Clock, Video } from 'lucide-react';

function formatViewCount(count) {
  if (!count || count === 0) return null;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K views`;
  return `${count} views`;
}

function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  } catch {
    return null;
  }
}

export default function VideoCard({ video }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const viewCountStr = formatViewCount(video.view_count);
  const dateStr = formatDate(video.published_at);
  const hasScore = video.similarity_score > 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: `1px solid ${hovered ? 'rgba(239,68,68,0.35)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 12px 32px rgba(239,68,68,0.15), 0 4px 12px rgba(0,0,0,0.2)'
          : '0 2px 8px rgba(0,0,0,0.12)',
        cursor: 'pointer',
        position: 'relative',
      }}
      onClick={() => window.open(video.watch_url, '_blank', 'noopener,noreferrer')}
    >
      {/* ── Thumbnail ── */}
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', flexShrink: 0 }}>
        {!imgError && video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s ease',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
              display: 'block',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--bg-surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Video size={40} color="rgba(239,68,68,0.5)" />
          </div>
        )}

        {/* Dark gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: hovered
            ? 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)'
            : 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)',
          transition: 'background 0.25s ease',
        }} />

        {/* Play button */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239,68,68,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(239,68,68,0.5)',
            transform: hovered ? 'scale(1)' : 'scale(0.8)',
            transition: 'transform 0.2s ease',
          }}>
            <Play size={24} color="#fff" fill="#fff" style={{ marginLeft: '3px' }} />
          </div>
        </div>

        {/* Duration badge */}
        {video.duration && (
          <div style={{
            position: 'absolute',
            bottom: '0.5rem',
            right: '0.5rem',
            backgroundColor: 'rgba(0,0,0,0.82)',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: '4px',
            letterSpacing: '0.02em',
          }}>
            {video.duration}
          </div>
        )}

        {/* YouTube logo badge */}
        <div style={{
          position: 'absolute',
          top: '0.5rem',
          left: '0.5rem',
          backgroundColor: 'rgba(239,68,68,0.9)',
          borderRadius: '4px',
          padding: '2px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <Video size={11} color="#fff" />
          <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>YouTube</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {/* Title */}
        <h4 style={{
          margin: 0,
          fontSize: '0.9rem',
          fontWeight: 600,
          lineHeight: 1.4,
          color: 'var(--text-primary)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {video.title}
        </h4>

        {/* Channel */}
        {video.channel_name && (
          <p style={{
            margin: 0,
            fontSize: '0.775rem',
            color: 'var(--accent-hover)',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {video.channel_name}
          </p>
        )}

        {/* Description */}
        {video.description && (
          <p style={{
            margin: 0,
            fontSize: '0.775rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {video.description}
          </p>
        )}

        {/* ── Meta Row ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginTop: 'auto',
          paddingTop: '0.5rem',
          flexWrap: 'wrap',
        }}>
          {viewCountStr && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <Eye size={11} />
              {viewCountStr}
            </span>
          )}
          {dateStr && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <Clock size={11} />
              {dateStr}
            </span>
          )}
          {hasScore && (
            <span style={{
              marginLeft: 'auto',
              fontSize: '0.68rem',
              color: 'rgba(239,68,68,0.8)',
              fontWeight: 600,
              backgroundColor: 'rgba(239,68,68,0.08)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}>
              {Math.round(video.similarity_score * 100)}% match
            </span>
          )}
        </div>

        {/* Watch button */}
        <a
          href={video.watch_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            padding: '0.55rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: hovered ? 'rgba(239,68,68,0.12)' : 'var(--bg-surface-2)',
            border: `1px solid ${hovered ? 'rgba(239,68,68,0.3)' : 'var(--border-color)'}`,
            color: hovered ? '#ef4444' : 'var(--text-secondary)',
            fontSize: '0.78rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            marginTop: '0.25rem',
          }}
        >
          <ExternalLink size={13} />
          Watch on YouTube
        </a>
      </div>
    </div>
  );
}

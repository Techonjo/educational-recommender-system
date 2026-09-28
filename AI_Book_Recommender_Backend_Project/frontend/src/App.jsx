import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import HeroCarousel from './components/HeroCarousel';
import CourseSelector from './components/CourseSelector';
import BookCard from './components/BookCard';
import VideoCard from './components/VideoCard';
import Loader from './components/Loader';
import { getCourses, getRecommendations, searchBooks, getPersonalizedRecommendations, getVideoRecommendations } from './api/client';
import { Search, BookOpen, AlertCircle, ChevronRight, Library, BookMarked, Users, Sparkles, MessageCircle, Video, TvMinimalPlay, Play, Key } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import OnboardingModal from './components/OnboardingModal';

const MODE = { COURSE: 'course', SEARCH: 'search', FOR_YOU: 'foryou', VIDEOS: 'videos' };

export default function App() {
  const [mode, setMode] = useState(MODE.SEARCH);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeLabel, setActiveLabel] = useState('');
  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);
  const { user } = useAuth();
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [fabHovered, setFabHovered] = useState(false);

  // ── Video state ────────────────────────────────────────────────
  const [videos, setVideos] = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [videoQuery, setVideoQuery] = useState('');
  const [requiresApiKey, setRequiresApiKey] = useState(false);
  const videoResultsRef = useRef(null);
  
  useEffect(() => {
    if (user && !localStorage.getItem('onboardingCompleted')) {
      setShowOnboarding(true);
    }
  }, [user]);

  useEffect(() => {
    getCourses().then(setCourses).catch(() =>
      setError('Could not connect to the backend. Make sure the server is running on port 8000.')
    );
  }, []);

  const scrollToResults = () => {
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const runLiveSearch = async (query) => {
    if (!query || query.trim().length < 2) return;
    setMode(MODE.SEARCH);
    setSelectedCourse(null);
    setSearchQuery(query.trim());
    setIsLoading(true);
    setError(null);
    setRecommendations([]);
    setActiveLabel(query.trim());
    scrollToResults();
    try {
      const data = await searchBooks(query.trim(), 10);
      if (data.success) setRecommendations(data.recommendations);
      else setError('No results found. Try a different topic.');
    } catch {
      setError('Search failed. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseSelect = async (course) => {
    setSelectedCourse(course);
    setIsLoading(true);
    setError(null);
    setRecommendations([]);
    setActiveLabel(course.course_title);
    scrollToResults();
    try {
      const data = await getRecommendations(course.course_id, 10);
      if (data.success) setRecommendations(data.recommendations);
    } catch {
      setError('Failed to fetch recommendations. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    runLiveSearch(searchQuery);
  };

  const runPersonalized = async () => {
    setMode(MODE.FOR_YOU);
    setSelectedCourse(null);
    setSearchQuery('');
    setIsLoading(true);
    setError(null);
    setRecommendations([]);
    setActiveLabel('Personalized For You');
    scrollToResults();
    try {
      const data = await getPersonalizedRecommendations();
      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch {
      setError('Failed to fetch personalized recommendations. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (m) => {
    if (m === MODE.FOR_YOU) {
      runPersonalized();
      return;
    }
    setMode(m);
    setRecommendations([]);
    setError(null);
    setActiveLabel('');
    setSelectedCourse(null);
    setSearchQuery('');
    if (m === MODE.SEARCH) setTimeout(() => searchInputRef.current?.focus(), 50);
    if (m === MODE.VIDEOS) {
      setVideos([]);
      setVideoError(null);
      setRequiresApiKey(false);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  };

  const runVideoSearch = async (query) => {
    if (!query || query.trim().length < 2) return;
    const q = query.trim();
    setVideoQuery(q);
    setVideoLoading(true);
    setVideoError(null);
    setVideos([]);
    setRequiresApiKey(false);
    setTimeout(() => videoResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    try {
      const data = await getVideoRecommendations(q, 10);
      if (data.requires_api_key) {
        setRequiresApiKey(true);
      } else if (data.success && data.videos?.length > 0) {
        setVideos(data.videos);
      } else {
        setVideoError(data.message || 'No videos found. Try a different topic.');
      }
    } catch {
      setVideoError('Could not fetch videos. Check your connection and try again.');
    } finally {
      setVideoLoading(false);
    }
  };

  const handleVideoSearchSubmit = (e) => {
    e.preventDefault();
    runVideoSearch(searchQuery);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      {showOnboarding && (
        <OnboardingModal onComplete={async (topics, profile) => {
          setShowOnboarding(false);
          // Immediately show recommendations based on selected topics and industry
          setMode(MODE.FOR_YOU);
          setSelectedCourse(null);
          setSearchQuery('');
          setIsLoading(true);
          setError(null);
          setRecommendations([]);
          const label = topics.slice(0, 3).join(', ');
          setActiveLabel(label);
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          try {
            // Pick the primary topic to avoid an overly restrictive query that yields 0 results
            const query = topics.length > 0 ? topics[0] : (profile?.industry || 'Science');
            
            const data = await searchBooks(query, 20);
            if (data.success && data.recommendations.length > 0) {
              setRecommendations(data.recommendations);
            } else {
              // fallback to personalized endpoint
              const pData = await getPersonalizedRecommendations();
              if (pData.success) setRecommendations(pData.recommendations);
            }
          } catch {
            setError('Could not fetch recommendations. Please try again.');
          } finally {
            setIsLoading(false);
          }
        }} />
      )}

      {/* ── Floating Interaction Button (always visible when logged in) ── */}
      {user && !showOnboarding && (
        <button
          onClick={() => setShowOnboarding(true)}
          onMouseEnter={() => setFabHovered(true)}
          onMouseLeave={() => setFabHovered(false)}
          title="Update my interests"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: fabHovered ? '0.6rem' : '0',
            padding: fabHovered ? '0.8rem 1.25rem' : '0.9rem',
            borderRadius: '3rem',
            border: '1px solid rgba(99,102,241,0.4)',
            backgroundColor: 'var(--accent-color)',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(99,102,241,0.45)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maxWidth: fabHovered ? '220px' : '48px',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <MessageCircle size={20} style={{ flexShrink: 0 }} />
          <span style={{
            opacity: fabHovered ? 1 : 0,
            transition: 'opacity 0.2s ease',
            overflow: 'hidden',
          }}>
            Update My Interests
          </span>
        </button>
      )}

      <main style={{ flex: 1, padding: '2.5rem 0 5rem' }}>
        <div className="container">

          {/* ── Hero Carousel ── */}
          <HeroCarousel onSearch={runLiveSearch} />

          {/* ── Stats Bar ── */}
          <div className="grid-3-col" style={{
            backgroundColor: 'var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            marginBottom: '3rem',
            border: '1px solid var(--border-color)',
          }}>
            {[
              { icon: <BookMarked size={18} color="var(--accent-color)" />, value: 'Millions', label: 'Books Indexed' },
              { icon: <Library size={18} color="#10b981" />, value: 'Open Access', label: 'Free to Read' },
              { icon: <Users size={18} color="#f59e0b" />, value: 'All Fields', label: 'Global Knowledge' },
            ].map((stat, i) => (
              <div key={i} style={{
                backgroundColor: 'var(--bg-surface)',
                padding: '1.25rem 1.5rem',
                display: 'flex', alignItems: 'center', gap: '0.85rem',
              }}>
                <div style={{
                  padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Mode Tabs ── */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { key: MODE.SEARCH, label: 'Search Any Topic', icon: <Search size={14} /> },
              { key: MODE.COURSE, label: 'Browse Collections', icon: <BookOpen size={14} /> },
              ...(user ? [{ key: MODE.FOR_YOU, label: 'For You', icon: <Sparkles size={14} /> }] : []),
              { key: MODE.VIDEOS, label: 'Video Recommendations', icon: <TvMinimalPlay size={14} /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => switchMode(tab.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none', cursor: 'pointer',
                  fontSize: '0.8125rem', fontWeight: mode === tab.key ? 600 : 400,
                  backgroundColor: mode === tab.key
                    ? (tab.key === MODE.FOR_YOU ? 'rgba(99, 102, 241, 0.15)'
                      : tab.key === MODE.VIDEOS ? 'rgba(239, 68, 68, 0.12)'
                      : 'var(--bg-surface)')
                    : 'transparent',
                  color: mode === tab.key
                    ? (tab.key === MODE.FOR_YOU ? 'var(--accent-color)'
                      : tab.key === MODE.VIDEOS ? '#ef4444'
                      : 'var(--text-primary)')
                    : 'var(--text-secondary)',
                  boxShadow: mode === tab.key && tab.key !== MODE.FOR_YOU && tab.key !== MODE.VIDEOS ? 'var(--shadow-sm)' : 'none',
                  outline: mode === tab.key
                    ? (tab.key === MODE.FOR_YOU ? '1px solid var(--accent-subtle)'
                      : tab.key === MODE.VIDEOS ? '1px solid rgba(239,68,68,0.3)'
                      : '1px solid var(--border-color)')
                    : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Search / Selector Control ── */}
          <div style={{ marginBottom: '3rem' }}>
            {(mode === MODE.SEARCH || mode === MODE.VIDEOS) && (
              <form
                onSubmit={mode === MODE.VIDEOS ? handleVideoSearchSubmit : handleSearchSubmit}
                style={{ display: 'flex', gap: '0.5rem', maxWidth: '620px' }}
              >
                <div style={{ position: 'relative', flex: 1 }}>
                  {mode === MODE.VIDEOS
                    ? <Video size={17} color="rgba(239,68,68,0.7)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    : <Search size={17} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  }
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="input-field"
                    placeholder={
                      mode === MODE.VIDEOS
                        ? 'e.g. "Machine Learning", "World War II", "Python Tutorial"...'
                        : 'e.g. "World History", "Astrophysics", "Psychology"...'
                    }
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2.75rem', fontSize: '0.9375rem' }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={(mode === MODE.VIDEOS ? videoLoading : isLoading) || searchQuery.trim().length < 2}
                  style={{
                    whiteSpace: 'nowrap', flexShrink: 0,
                    ...(mode === MODE.VIDEOS ? {
                      backgroundColor: '#ef4444',
                      borderColor: '#ef4444',
                    } : {})
                  }}
                >
                  {mode === MODE.VIDEOS ? 'Find Videos' : 'Search'}
                  <ChevronRight size={15} />
                </button>
              </form>
            )}

            {mode === MODE.COURSE && (
              <div style={{ maxWidth: '480px' }}>
                <CourseSelector
                  courses={courses}
                  selectedCourse={selectedCourse}
                  onSelectCourse={handleCourseSelect}
                />
              </div>
            )}
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              padding: '1rem 1.25rem', marginBottom: '2rem',
              backgroundColor: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.18)',
              borderRadius: 'var(--radius-md)',
              color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.875rem', maxWidth: '620px',
            }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* ── Results ── */}
          <div ref={resultsRef}>
            <hr className="divider" style={{ marginBottom: '2.5rem' }} />

            {/* ── VIDEO MODE ────────────────────────────── */}
            {mode === MODE.VIDEOS && (
              <div ref={videoResultsRef}>
                {/* API Key setup prompt */}
                {requiresApiKey && !videoLoading && (
                  <div style={{
                    padding: '2rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    backgroundColor: 'rgba(239,68,68,0.05)',
                    maxWidth: '640px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Key size={20} color="#ef4444" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          YouTube API Key Required
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          A free key gives you 10,000 requests/day
                        </p>
                      </div>
                    </div>
                    <ol style={{ margin: '0 0 1.25rem 1rem', padding: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 2 }}>
                      <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: '#ef4444' }}>console.cloud.google.com</a></li>
                      <li>Create or select a project → enable <strong style={{ color: 'var(--text-primary)' }}>YouTube Data API v3</strong></li>
                      <li>Go to <strong style={{ color: 'var(--text-primary)' }}>Credentials → Create API Key</strong></li>
                      <li>Create a <code style={{ backgroundColor: 'var(--bg-surface-2)', padding: '1px 5px', borderRadius: '3px' }}>.env</code> file in the project root:</li>
                    </ol>
                    <pre style={{
                      backgroundColor: 'var(--bg-surface-2)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 1rem',
                      fontSize: '0.8rem',
                      color: '#ef4444',
                      margin: '0 0 1rem 0',
                      overflowX: 'auto',
                    }}>
                      YOUTUBE_API_KEY=your_api_key_here
                    </pre>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Then restart the backend server. It&apos;s completely free!
                    </p>
                  </div>
                )}

                {videoLoading && (
                  <Loader text={`Searching YouTube for "${videoQuery}"`} />
                )}

                {videoError && !videoLoading && (
                  <div style={{
                    padding: '1rem 1.25rem', marginBottom: '2rem',
                    backgroundColor: 'rgba(239,68,68,0.07)',
                    border: '1px solid rgba(239,68,68,0.18)',
                    borderRadius: 'var(--radius-md)',
                    color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.875rem', maxWidth: '620px',
                  }}>
                    <AlertCircle size={17} style={{ flexShrink: 0 }} />
                    {videoError}
                  </div>
                )}

                {!videoLoading && videos.length > 0 && (
                  <div className="animate-fade-up">
                    <div className="flex-between" style={{
                      marginBottom: '1.75rem',
                    }}>
                      <div>
                        <h3 style={{ fontSize: '1.375rem', fontWeight: 700, margin: '0 0 0.3rem 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Video size={22} color="#ef4444" />
                          Video Recommendations
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
                          AI-ranked YouTube videos for{' '}
                          <span style={{ color: '#ef4444', fontWeight: 500 }}>"{videoQuery}"</span>
                          {' '}&mdash; sorted by ML relevance score.
                        </p>
                      </div>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0, paddingLeft: '1rem' }}>
                        {videos.length} video{videos.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '1.25rem',
                    }}>
                      {videos.map((video, idx) => (
                        <div
                          key={`${video.video_id}-${idx}`}
                          className="animate-fade-up"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <VideoCard video={video} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!videoLoading && videos.length === 0 && !videoError && !requiresApiKey && (
                  <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-secondary)' }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%',
                      backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 1.5rem auto',
                    }}>
                      <Play size={28} color="rgba(239,68,68,0.6)" />
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.4rem' }}>
                      Search for video recommendations
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                      Enter any topic above — "Machine Learning", "World History", "Python"...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── BOOK / COURSE / FOR YOU MODE ──────────── */}
            {mode !== MODE.VIDEOS && (
              <>
                {isLoading && (
                  <Loader text={`Searching Open Library for "${activeLabel}"`} />
                )}

                {!isLoading && recommendations.length > 0 && (
                  <div className="animate-fade-up">
                    <div className="flex-between" style={{
                      marginBottom: '1.75rem',
                    }}>
                      <div>
                        <h3 style={{ fontSize: '1.375rem', fontWeight: 700, margin: '0 0 0.3rem 0', letterSpacing: '-0.02em' }}>
                          Recommended Books
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
                          Results for{' '}
                          <span style={{ color: 'var(--accent-hover)', fontWeight: 500 }}>"{activeLabel}"</span>
                          {' '}&mdash; sourced live from Open Library.
                        </p>
                      </div>
                      <span style={{
                        fontSize: '0.8125rem', color: 'var(--text-muted)',
                        fontWeight: 500, flexShrink: 0, paddingLeft: '1rem',
                      }}>
                        {recommendations.length} result{recommendations.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '1.25rem',
                    }}>
                      {recommendations.map((book, idx) => (
                        <div
                          key={`${book.book_id}-${idx}`}
                          className="animate-fade-up"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <BookCard book={book} courseLabel={activeLabel} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isLoading && recommendations.length === 0 && !error && (
                  <div style={{
                    textAlign: 'center', padding: '5rem 2rem',
                    color: 'var(--text-secondary)',
                  }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%',
                      backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 1.5rem auto',
                    }}>
                      <Library size={28} color="var(--text-muted)" />
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.4rem' }}>
                      {mode === MODE.SEARCH ? 'Enter a topic and hit Search' : 'Select a collection above'}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                      {mode === MODE.SEARCH
                        ? 'Try any subject — "World History", "Astrophysics", "Psychology"'
                        : 'Choose a curated collection from the dropdown to get recommendations'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface)',
        padding: '1.5rem 0',
      }}>
        <div className="container" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1rem',
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Gideon Books &mdash; Powered by{' '}
            <a href="https://openlibrary.org" target="_blank" rel="noreferrer"
              style={{ color: 'var(--accent-hover)', textDecoration: 'none' }}>
              Open Library
            </a>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            AI-Powered &middot; All Fields of Study &middot; Open Access Books
          </span>
        </div>
      </footer>
    </div>
  );
}

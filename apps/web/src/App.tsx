import React, { useState, useCallback } from 'react';
import {
  MediaProvider,
  useMediaSearch,
  useMediaVideoSearch,
  useMediaEvent,
  usePexelsClient,
  PexelsPhoto,
  PexelsVideo,
} from 'media-react';
import { useGrid, useLightbox, useReelSwiper } from 'media-ui-react';
// Add Vite client import.meta typing
declare global {
  interface ImportMeta {
    readonly env: Record<string, string | undefined>;
  }
}

// Inline zero-dependency SVG Icons for Web Showcase
const Search = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const GridIcon = ({ size = 20, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);

const Film = ({ size = 20, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18M17 3v18M3 7.5h4M3 12h18M3 16.5h4M17 7.5h4M17 16.5h4" />
  </svg>
);

const X = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const ChevronLeft = ({ size = 20, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRight = ({ size = 20, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const Download = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

const Terminal = ({ size = 20, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" /><line x1="12" x2="20" y1="19" y2="19" />
  </svg>
);

// ==========================================
// MAIN WEB SHOWCASE APPLICATION
// ==========================================

function MediaShowcase() {
  const client = usePexelsClient();
  const [searchQuery, setSearchQuery] = useState('nature');
  const [activeTab, setActiveTab] = useState<'grid' | 'reel'>('grid');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [eventLogs, setEventLogs] = useState<Array<{ id: string; type: string; details: string; timestamp: string }>>([]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Subscribe to SDK events in real-time
  useMediaEvent('view', (payload: any) => {
    const photo = payload.media as PexelsPhoto;
    setEventLogs((prev) => [
      {
        id: Math.random().toString(),
        type: 'view',
        details: `Viewed photo #${photo.id} by ${photo.photographer}`,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 49),
    ]);
  });

  useMediaEvent('download', (payload: any) => {
    const photo = payload.media as PexelsPhoto;
    setEventLogs((prev) => [
      {
        id: Math.random().toString(),
        type: 'download',
        details: `Downloaded photo #${photo.id} (${payload.quality || 'original'})`,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 49),
    ]);
  });

  // Fetch media using React SDK state wrapper
  const { data, loading, error, hasMore, loadMore } = useMediaSearch(searchQuery, { perPage: 16 });

  // ------------------------------------------
  // Headless UI Hook 1: useGrid
  // ------------------------------------------
  const { getContainerProps, getItemProps, getSentinelProps } = useGrid({
    fetchNextPage: loadMore,
    hasNextPage: hasMore,
    isLoading: loading,
  });

  // ------------------------------------------
  // Headless UI Hook 2: useLightbox
  // ------------------------------------------
  const {
    isOpen: isLightboxOpen,
    activeIndex: lightboxIndex,
    open: openLightbox,
    close: closeLightbox,
    next: nextLightbox,
    prev: prevLightbox,
    getOverlayProps,
    getContentProps,
    getCloseButtonProps,
    getNextButtonProps,
    getPrevButtonProps,
  } = useLightbox({
    totalItems: data.length,
    onIndexChange: (idx) => {
      if (data[idx]) {
        client.emit('view', { media: data[idx], timestamp: Date.now() });
      }
    },
  });

  // Handler for item click
  const handleItemClick = useCallback(
    (photo: PexelsPhoto, index: number) => {
      openLightbox(index);
      client.emit('view', { media: photo, timestamp: Date.now() });
    },
    [openLightbox, client]
  );

  const handleDownload = useCallback(
    (photo: PexelsPhoto, e: React.MouseEvent) => {
      e.stopPropagation();
      client.emit('download', { media: photo, quality: 'large2x', timestamp: Date.now() });
      window.open(photo.src.original, '_blank');
    },
    [client]
  );

  // Fetch video results for Reel Swiper
  const { data: videoData, loading: videoLoading } = useMediaVideoSearch(searchQuery, { perPage: 10 });
  const activeMediaList = videoData.length > 0 ? videoData : data;

  // ------------------------------------------
  // Headless UI Hook 3: useReelSwiper
  // ------------------------------------------
  const {
    activeIndex: reelIndex,
    next: nextReel,
    prev: prevReel,
    getContainerProps: getReelContainerProps,
    getSlideProps: getReelSlideProps,
  } = useReelSwiper({
    itemCount: activeMediaList.length,
    onIndexChange: (idx) => {
      if (activeMediaList[idx]) {
        client.emit('view', { media: activeMediaList[idx], timestamp: Date.now() });
      }
    },
  });

  const activePhoto = data[lightboxIndex];

  return (
    <div className="app-container">
      {/* Header Shell */}
      <header className="app-header">
        <div className="brand-badge">
          <div className="brand-logo">P</div>
          <div>
            <h1 className="brand-title">Pexels Media Explorer</h1>
            <p className="brand-subtitle">
              Framework-Agnostic Core SDK + Headless UI Component Library
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="mode-tabs">
            <button
              className={`tab-btn ${activeTab === 'grid' ? 'active' : ''}`}
              onClick={() => setActiveTab('grid')}
            >
              <GridIcon size={16} />
              Photos Grid
            </button>
            <button
              className={`tab-btn ${activeTab === 'reel' ? 'active' : ''}`}
              onClick={() => setActiveTab('reel')}
            >
              <Film size={16} />
              Video Reels
            </button>
          </div>

          <a
            href="/sdk-docs.html"
            target="_blank"
            rel="noreferrer"
            className="tab-btn"
            style={{ textDecoration: 'none', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa' }}
          >
            📘 SDK Docs
          </a>
          <a
            href="/ui-docs.html"
            target="_blank"
            rel="noreferrer"
            className="tab-btn"
            style={{ textDecoration: 'none', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80' }}
          >
            🎨 UI Component Docs
          </a>

          <button
            onClick={toggleTheme}
            className="tab-btn"
            title="Toggle Light / Dark Mode"
            style={{
              padding: '8px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-main)', cursor: 'pointer'
            }}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      {/* Search Bar Section */}
      <section className="search-section">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search photos and videos (e.g. ocean, nature, architecture, city)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Error state alert */}
      {error && (
        <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 12, color: '#fca5a5' }}>
          <strong>SDK Error:</strong> {error.message}
        </div>
      )}

      {/* Tab 1: Infinite Grid View */}
      {activeTab === 'grid' && (
        <main {...getContainerProps({ className: 'media-grid' })}>
          {data.map((photo, index) => (
            <article
              key={photo.id}
              {...getItemProps(index, {
                className: 'media-card',
                onClick: () => handleItemClick(photo, index),
              })}
            >
              <img src={photo.src.medium} alt={photo.alt || photo.photographer} loading="lazy" />
              <div className="media-card-overlay">
                <p className="media-photographer">📷 {photo.photographer}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    className="lightbox-btn"
                    style={{ padding: '6px 12px', borderRadius: 6, fontSize: '12px', gap: 4 }}
                    onClick={(e) => handleDownload(photo, e)}
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
            </article>
          ))}

          {/* Infinite Scroll Intersection Observer Sentinel */}
          <div {...getSentinelProps({ style: { gridColumn: '1 / -1', height: 40, textAlign: 'center' } })}>
            {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading more media...</p>}
          </div>
        </main>
      )}

      {/* Tab 2: Vertical Reel Swiper View (Pexels Video API Integration) */}
      {activeTab === 'reel' && activeMediaList.length > 0 && (
        <div {...getReelContainerProps({ className: 'reel-container' })}>
          <div className="reel-track" style={{ transform: `translateY(-${reelIndex * 100}%)` }}>
            {activeMediaList.map((item, index) => {
              const slideProps = getReelSlideProps(index, { className: 'reel-slide' });
              const isActive = index === reelIndex;
              const isVideo = 'video_files' in item;
              const videoFile = isVideo ? (item as PexelsVideo).video_files.find(f => f.quality === 'hd' || f.quality === 'sd') || (item as PexelsVideo).video_files[0] : null;

              return (
                <div key={item.id} {...slideProps}>
                  {isVideo && videoFile ? (
                    <video
                      src={videoFile.link}
                      poster={(item as PexelsVideo).image}
                      autoPlay={isActive}
                      loop
                      muted
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      ref={(el) => {
                        if (el) {
                          if (isActive) el.play().catch(() => {});
                          else el.pause();
                        }
                      }}
                    />
                  ) : (
                    <img src={(item as PexelsPhoto).src.large2x} alt={(item as PexelsPhoto).alt} />
                  )}
                  <div className="reel-overlay">
                    <h3 style={{ color: 'white', fontSize: 17, fontWeight: 700 }}>
                      {isVideo ? `🎬 Video #${item.id} (${(item as PexelsVideo).duration}s)` : (item as PexelsPhoto).alt || 'Pexels Photo'}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                      Creator: {isVideo ? (item as PexelsVideo).user.name : (item as PexelsPhoto).photographer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="reel-nav-controls">
            <button className="lightbox-btn" onClick={() => prevReel()} disabled={reelIndex === 0} title="Previous Video (Arrow Up)">
              <ChevronLeft style={{ transform: 'rotate(90deg)' }} />
            </button>
            <span style={{ color: 'white', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>
              {reelIndex + 1} / {activeMediaList.length}
            </span>
            <button className="lightbox-btn" onClick={() => nextReel()} disabled={reelIndex === activeMediaList.length - 1} title="Next Video (Arrow Down)">
              <ChevronRight style={{ transform: 'rotate(90deg)' }} />
            </button>
          </div>
        </div>
      )}

      {/* Headless Lightbox Overlay Modal */}
      {isLightboxOpen && activePhoto && (
        <div {...getOverlayProps({ className: 'lightbox-overlay' })}>
          <div {...getContentProps({ className: 'lightbox-content glass-panel' })}>
            <div className="lightbox-image-wrapper">
              <img src={activePhoto.src.large2x} alt={activePhoto.alt} />
            </div>

            <div className="lightbox-toolbar">
              <button {...getPrevButtonProps({ className: 'lightbox-btn' })}>
                <ChevronLeft size={20} />
              </button>

              <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
                {lightboxIndex + 1} of {data.length} — {activePhoto.photographer}
              </span>

              <button {...getNextButtonProps({ className: 'lightbox-btn' })}>
                <ChevronRight size={20} />
              </button>

              <button
                className="lightbox-btn"
                style={{ background: 'var(--accent-color)' }}
                onClick={(e) => handleDownload(activePhoto, e)}
              >
                <Download size={18} />
              </button>

              <button {...getCloseButtonProps({ className: 'lightbox-btn' })}>
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time SDK Analytics Event Drawer */}
      <footer className="analytics-drawer">
        <div className="analytics-header">
          <span><Terminal size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> SDK Event Emitter Console</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{eventLogs.length} events logged</span>
        </div>

        <div className="analytics-log-list">
          {eventLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No events logged yet. Interact with grid items or download media.</p>
          ) : (
            eventLogs.map((log) => (
              <div key={log.id} className="log-item">
                <span className="log-timestamp" style={{ color: 'var(--text-muted)' }}>{log.timestamp}</span>
                <span className={`log-tag ${log.type}`}>{log.type.toUpperCase()}</span>
                <span style={{ color: 'var(--text-primary)' }}>{log.details}</span>
              </div>
            ))
          )}
        </div>
      </footer>
    </div>
  );
}

// Wrapper with Provider & API Key management
export default function App() {
  // Put your Pexels API key below inside DEFAULT_PEXELS_KEY if desired
  const DEFAULT_PEXELS_KEY = 'LApSiC3bYjDkGqh4JPpXbGVhihfaIkCNI6eIbvfQUUqPsUNcIiuOTel3';

  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('PEXELS_API_KEY') || import.meta.env.VITE_PEXELS_KEY || DEFAULT_PEXELS_KEY || '';
  });
  const [keyInput, setKeyInput] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(!apiKey);

  const saveKey = (newKey: string) => {
    const trimmed = newKey.trim();
    if (trimmed) {
      localStorage.setItem('PEXELS_API_KEY', trimmed);
      setApiKey(trimmed);
      setShowKeyModal(false);
    }
  };

  return (
    <div>
      {/* API Key Banner / Modal if Key is missing or invalid */}
      {(!apiKey || showKeyModal) && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div style={{
            background: '#161b22', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16,
            padding: 32, maxWidth: 480, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ color: 'white', fontSize: 20, marginBottom: 8 }}>🔑 Enter Pexels API Key</h2>
            <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>
              The Pexels demo key expired (401 Unauthorized). Please paste your free Pexels API key below to enable live search.
            </p>
            <input
              type="text"
              placeholder="Paste your free Pexels API key here..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', background: '#0d1117', border: '1px solid #30363d',
                borderRadius: 8, color: 'white', fontFamily: 'inherit', fontSize: 14, outline: 'none', marginBottom: 16
              }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
              <a
                href="https://www.pexels.com/api/"
                target="_blank"
                rel="noreferrer"
                style={{ padding: '10px 16px', color: '#60a5fa', fontSize: 14, textDecoration: 'none', fontWeight: 600, marginRight: 'auto' }}
              >
                Get Free Key (30s) ↗
              </a>
              <button
                onClick={() => setShowKeyModal(false)}
                style={{
                  padding: '10px 16px', background: 'rgba(255,255,255,0.1)', color: '#d1d5db', border: '1px solid #30363d',
                  borderRadius: 8, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => saveKey(keyInput)}
                style={{
                  padding: '10px 20px', background: '#6366f1', color: 'white', border: 'none',
                  borderRadius: 8, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Save & Start
              </button>
            </div>
          </div>
        </div>
      )}

      <MediaProvider apiKey={apiKey || 'DEMO_KEY_FALLBACK'} key={apiKey}>
        <MediaShowcase />
      </MediaProvider>

      {/* Floating Key Settings Trigger */}
      <button
        onClick={() => setShowKeyModal(true)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 900, background: '#161b22', border: '1px solid #30363d',
          color: '#f3f4f6', padding: '8px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: 6
        }}
      >
        🔑 Key Settings
      </button>
    </div>
  );
}

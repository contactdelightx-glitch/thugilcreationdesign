import { useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { VolumeHighIcon, VolumeOffIcon, PlayIcon, PauseIcon } from '@hugeicons/core-free-icons';

// the introduction video
const VIDEO = 'https://thugilcreation.b-cdn.net/intro.mp4';

export default function Discover() {
  const ref = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  // start (muted) when the section scrolls into view, pause when it leaves
  useEffect(() => {
    const v = ref.current;
    if (!v) return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.35 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const toggleSound = () => { const v = ref.current; v.muted = !v.muted; setMuted(v.muted); if (v.paused) v.play().catch(() => {}); };
  const togglePlay = () => { const v = ref.current; if (v.paused) v.play().catch(() => {}); else v.pause(); };

  return (
    <section className="discover" aria-labelledby="discover-title">
      <div className="discover-inner">
        <div className="discover-text">
          <span className="eyebrow">Our story</span>
          <h2 id="discover-title">Discover Thugil Creation</h2>
          <p>Watch our introduction video to learn more about our premium digital saree designs and craftsmanship.</p>
          <p>Explore our collection of exclusive digital saree designs crafted with precision and creativity.</p>
          <dl className="discover-stats">
            <div><dd>2000+</dd><dt>Designs</dt></div>
            <div><dd>20+</dd><dt>Artisans</dt></div>
          </dl>
        </div>

        <div className="discover-video">
          <video ref={ref} src={VIDEO} muted loop playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} aria-label="Thugil Creation introduction video" />
          <div className="video-controls">
            <button type="button" onClick={togglePlay} aria-label={playing ? 'Pause video' : 'Play video'}><HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={20} strokeWidth={1.8} /></button>
            <button type="button" className={muted ? 'sound off' : 'sound'} onClick={toggleSound} aria-label={muted ? 'Turn sound on' : 'Turn sound off'} aria-pressed={!muted}>
              <HugeiconsIcon icon={muted ? VolumeOffIcon : VolumeHighIcon} size={20} strokeWidth={1.8} />
              <span>{muted ? 'Tap for sound' : 'Sound on'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

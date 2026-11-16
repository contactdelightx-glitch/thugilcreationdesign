import { useEffect, useRef, useState } from 'react';

const SKIP = 10; // seconds

/**
 * Plays a course video. The streams are HLS (.m3u8): Safari plays them natively, other browsers use hls.js
 * (loaded only when a video is actually opened). A change of `url` switches to the new video.
 *   resumeAt     start from this second
 *   skipOnly     the progress bar cannot be dragged or clicked: the only way to move is the left / right arrow keys,
 *                which skip 10 seconds. While a lesson is unfinished, skipping cannot go past the furthest
 *                point already watched by more than 10 seconds.
 *   furthest     the furthest second already watched
 *   finished     the lesson is already done (skipping forward is then free)
 *   onTime       ({ time, duration }) while playing
 *   onPause      ({ time, duration }) when paused or finished
 */
export default function VideoPlayer({ url, poster, autoPlay = true, resumeAt = 0, furthest = 0, finished = false, skipOnly = false, onTime, onPause, onEnded }) {
  const videoRef = useRef(null);
  const [state, setState] = useState('loading'); // loading | ready | error
  const keep = useRef({});
  keep.current = { resumeAt, furthest, finished, skipOnly, onTime, onPause, onEnded };
  const maxSeen = useRef(0);
  const lastGood = useRef(0);
  const allow = useRef(false); // true while one of our own jumps is in progress

  useEffect(() => {
    const v = videoRef.current;
    let hls;
    let gone = false;
    maxSeen.current = keep.current.furthest || 0;
    lastGood.current = 0;
    allow.current = false;
    setState('loading');
    const fail = () => !gone && setState('error');
    const ready = () => {
      if (gone) return;
      setState('ready');
      const at = keep.current.resumeAt;
      if (at > 3 && v.duration && at < v.duration - 3) { allow.current = true; v.currentTime = at; lastGood.current = at; }
      if (autoPlay) v.play().catch(() => {}); // a blocked autoplay still leaves the controls
    };
    const info = () => ({ time: v.currentTime, duration: v.duration || 0 });
    const onTimeUpdate = () => {
      if (!v.seeking && !allow.current) { lastGood.current = v.currentTime; maxSeen.current = Math.max(maxSeen.current, v.currentTime); }
      keep.current.onTime?.(info());
    };
    // anything that is not one of our own jumps (dragging or clicking the bar) is put back where it was
    const onSeeking = () => {
      if (!keep.current.skipOnly || allow.current) return;
      if (Math.abs(v.currentTime - lastGood.current) > 2) v.currentTime = lastGood.current;
    };
    const onSeeked = () => { if (allow.current) { allow.current = false; lastGood.current = v.currentTime; } };
    const onPaused = () => keep.current.onPause?.(info());
    const onEnd = () => { keep.current.onPause?.(info()); keep.current.onEnded?.(); };
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('seeking', onSeeking);
    v.addEventListener('seeked', onSeeked);
    v.addEventListener('pause', onPaused);
    v.addEventListener('ended', onEnd);

    if (!/\.m3u8(\?|$)/i.test(url) || v.canPlayType('application/vnd.apple.mpegurl')) {
      v.src = url;
      v.addEventListener('loadeddata', ready, { once: true });
      v.addEventListener('error', fail, { once: true });
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (gone) return;
        if (!Hls.isSupported()) return fail();
        hls = new Hls();
        hls.on(Hls.Events.MANIFEST_PARSED, () => v.addEventListener('loadeddata', ready, { once: true }));
        hls.on(Hls.Events.ERROR, (_e, data) => data.fatal && fail());
        hls.loadSource(url);
        hls.attachMedia(v);
      }).catch(fail);
    }
    return () => {
      gone = true;
      v.removeEventListener('timeupdate', onTimeUpdate); v.removeEventListener('seeking', onSeeking); v.removeEventListener('seeked', onSeeked);
      v.removeEventListener('pause', onPaused); v.removeEventListener('ended', onEnd);
      if (hls) hls.destroy();
      v.pause(); v.removeAttribute('src'); v.load();
    };
  }, [url, autoPlay]);

  function skip(by) {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    let target = v.currentTime + by;
    if (by > 0 && !keep.current.finished) target = Math.min(target, maxSeen.current + SKIP); // an unfinished lesson cannot be skipped through
    target = Math.max(0, Math.min(target, v.duration - 0.5));
    allow.current = true;
    v.currentTime = target;
    setTimeout(() => { allow.current = false; }, 1500); // safety: never leave the gate open
  }

  const onKeyDown = (e) => {
    if (!skipOnly) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); skip(SKIP); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); skip(-SKIP); }
  };

  return (
    <div className="video-wrap" onKeyDown={onKeyDown}>
      <div className="video-stage">
        <video ref={videoRef} controls playsInline poster={poster || undefined} controlsList="nodownload noplaybackrate" disablePictureInPicture={skipOnly} />
        {state === 'loading' && <div className="video-msg">Loading the video…</div>}
        {state === 'error' && <div className="video-msg error">This video couldn’t be played right now. Please try again in a moment.</div>}
      </div>
    </div>
  );
}

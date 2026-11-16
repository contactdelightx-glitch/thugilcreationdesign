import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlayCircleIcon, ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, Book02Icon, LockIcon, Tick02Icon, StarIcon, Message01Icon, Cancel01Icon, SentIcon, Certificate01Icon, Download04Icon, ComputerIcon } from '@hugeicons/core-free-icons';
import { fetchLearn, fetchMyCourses, saveProgress, saveCourseReview, fetchMyDoubts, askDoubt, requestCertificate, downloadCertificate } from '../api';
import VideoPlayer from '../components/VideoPlayer';

const mins = (sec) => { const m = Math.round(sec / 60); return m < 60 ? `${Math.max(m, 1)} min` : `${Math.floor(m / 60)} hr ${m % 60 ? `${m % 60} min` : ''}`.trim(); };
const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
const day = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ---- the list of the shopper's own courses ----
function MyCourses({ user, onNavigate, onLogin }) {
  const [state, setState] = useState({ loading: true, items: [], error: '' });
  useEffect(() => {
    if (!user) { setState({ loading: false, items: [], error: 'login' }); return undefined; }
    let live = true;
    fetchMyCourses().then((r) => live && setState({ loading: false, items: r.data, error: '' })).catch((e) => live && setState({ loading: false, items: [], error: e.status === 401 ? 'login' : e.message }));
    return () => { live = false; };
  }, [user]);
  const { loading, items, error } = state;
  return (
    <main className="purch-wrap">
      <h1 className="purch-title">My learning</h1>
      {error === 'login' && <div className="designs-msg"><p>Log in to see your courses.</p><button type="button" className="btn-solid purch-btn" onClick={onLogin}>Log in</button></div>}
      {error && error !== 'login' && <p className="designs-msg error">Couldn’t load your courses ({error}).</p>}
      {!loading && !error && items.length === 0 && <div className="designs-msg"><p>You haven’t enrolled in a course yet.</p><button type="button" className="btn-solid purch-btn" onClick={() => onNavigate('Courses')}>Browse courses</button></div>}
      <div className="course-grid">
        {items.map((c) => (
          <article key={c.course_id} className="course-card">
            <div className="course-thumb">
              {c.thumbnail_url ? <img src={c.thumbnail_url} alt="" referrerPolicy="no-referrer" /> : <div className="course-thumb-fallback"><HugeiconsIcon icon={Book02Icon} size={44} strokeWidth={1.2} /></div>}
            </div>
            <div className="course-body">
              <h3>{c.title}</h3>
              {c.expires_at && <span className="course-by">Access until {day(c.expires_at)}</span>}
              <button type="button" className="btn-solid course-view" onClick={() => onNavigate('Learn', c.course_id)}>Continue learning</button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

// ---- doubt support: a floating chat with the instructor ----
const hhmm = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
const dayLabel = (iso) => {
  const d = new Date(iso); const t = new Date();
  const same = (a, b) => a.toDateString() === b.toDateString();
  const y = new Date(); y.setDate(t.getDate() - 1);
  return same(d, t) ? 'Today' : same(d, y) ? 'Yesterday' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

function DoubtChat({ courseId, lesson }) {
  const enabled = true; // this component is only shown to students whose package includes doubt support
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ loading: enabled, items: [], error: '' });
  const [text, setText] = useState('');
  const [aboutLesson, setAboutLesson] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [seen, setSeen] = useState(() => { try { return Number(localStorage.getItem(`thugil-seen-${courseId}`)) || 0; } catch { return 0; } });
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Looks for new messages. `quiet` refreshes (the 5-second ones) show nothing: no loading text, the window only changes when something is new,
  // and a failed refresh keeps what is already on screen.
  const load = useCallback((quiet = false) => fetchMyDoubts(courseId)
    .then((r) => setState((st) => (quiet && JSON.stringify(st.items) === JSON.stringify(r.data) ? st : { loading: false, items: r.data, error: '' })))
    .catch((e) => { if (!quiet) setState({ loading: false, items: [], error: e.message }); }), [courseId]);
  useEffect(() => { if (enabled) load(); }, [enabled, load]);
  // every 5 seconds while the page is on screen (open or closed, so the unread badge stays current)
  useEffect(() => {
    if (!enabled) return undefined;
    const tick = () => document.visibilityState === 'visible' && load(true);
    const t = setInterval(tick, 5000);
    document.addEventListener('visibilitychange', tick); // catch up the moment the tab is shown again
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', tick); };
  }, [enabled, load]);

  // oldest first, like a chat: each question, then the reply to it
  const messages = useMemo(() => [...state.items].reverse().flatMap((d) => [
    { key: `q${d.id}`, from: 'me', text: d.question, at: d.created_at, lesson: d.lesson, pending: d.status === 'pending' },
    ...(d.answer ? [{ key: `a${d.id}`, from: 'them', text: d.answer, at: d.answered_at || d.created_at }] : []),
  ]), [state.items]);

  const replies = state.items.filter((d) => d.answer).length;
  const unread = Math.max(0, replies - seen);
  const markSeen = () => { setSeen(replies); try { localStorage.setItem(`thugil-seen-${courseId}`, String(replies)); } catch { /* private mode */ } };

  useEffect(() => { if (open) { markSeen(); setTimeout(() => endRef.current?.scrollIntoView({ block: 'end' }), 50); } }, [open, messages.length, replies]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function send(e) {
    e?.preventDefault();
    const q = text.trim();
    if (q.length < 5) { setError('Please write your question (at least 5 characters).'); return; }
    setBusy(true);
    setError('');
    try {
      const d = await askDoubt(courseId, q, aboutLesson ? lesson.id : null);
      setState((st) => ({ ...st, items: [d, ...st.items] }));
      setText('');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); inputRef.current?.focus(); }
  }

  let lastDay = '';
  return (
    <>
      {!open && (
        <button type="button" className="chat-fab" onClick={() => setOpen(true)} aria-label={unread ? `Ask your instructor, ${unread} new ${unread === 1 ? 'reply' : 'replies'}` : 'Ask your instructor'}>
          <HugeiconsIcon icon={Message01Icon} size={26} strokeWidth={1.6} />
          <span className="chat-fab-text">Ask instructor</span>
          {unread > 0 && <span className="chat-badge">{unread}</span>}
        </button>
      )}

      {open && (
        <section className="chat-win" role="dialog" aria-label="Chat with your instructor">
          <header className="chat-head">
            <span className="chat-avatar" aria-hidden="true">T</span>
            <div><strong>Your instructor</strong><small>Replies appear here</small></div>
            <button type="button" className="icon-close" aria-label="Close chat" onClick={() => setOpen(false)}><HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.6} /></button>
          </header>

          {(
            <>
              <div className="chat-body" aria-live="polite">
                {state.loading && <p className="chat-note">Loading your messages…</p>}
                {state.error && <p className="chat-note error">Couldn’t load your messages ({state.error}).</p>}
                {!state.loading && !state.error && messages.length === 0 && (
                  <div className="chat-empty">
                    <HugeiconsIcon icon={Message01Icon} size={30} strokeWidth={1.5} />
                    <strong>Stuck on something?</strong>
                    <p>Ask your question below. Your instructor will reply here.</p>
                  </div>
                )}
                {messages.map((m) => {
                  const label = dayLabel(m.at);
                  const showDay = label !== lastDay;
                  lastDay = label;
                  return (
                    <div key={m.key}>
                      {showDay && <div className="chat-day"><span>{label}</span></div>}
                      <div className={`bubble-row ${m.from}`}>
                        <div className={`bubble ${m.from}`}>
                          {m.lesson && <span className="bubble-tag">{m.lesson}</span>}
                          <p>{m.text}</p>
                          <time dateTime={m.at}>{hhmm(m.at)}</time>
                        </div>
                      </div>
                      {m.pending && <div className="bubble-row me"><span className="bubble-wait">Waiting for a reply…</span></div>}
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <form className="chat-compose" onSubmit={send}>
                {aboutLesson && <div className="chat-chip">About: <strong>{lesson.title}</strong><button type="button" aria-label="Don’t attach this lesson" onClick={() => setAboutLesson(false)}><HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={2} /></button></div>}
                {!aboutLesson && <button type="button" className="chat-chip add" onClick={() => setAboutLesson(true)}>+ About this lesson</button>}
                {error && <p className="chat-note error" role="alert">{error}</p>}
                <div className="chat-input">
                  <textarea ref={inputRef} rows={1} maxLength={1000} placeholder="Type your question…" aria-label="Your question" value={text}
                    onChange={(e) => { setText(e.target.value); setError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
                  <button type="submit" className="chat-send" disabled={busy || !text.trim()} aria-label="Send question"><HugeiconsIcon icon={SentIcon} size={20} strokeWidth={1.7} /></button>
                </div>
              </form>
            </>
          )}
        </section>
      )}
    </>
  );
}

// ---- software: what the course needs, where to get it and how to install it ----
const PLATFORM = { 'multi-platform': 'Windows, Mac and Linux', windows: 'Windows', mac: 'Mac', macos: 'Mac', linux: 'Linux', web: 'In the browser' };
// the admin writes the steps as lines, often starting with "*" or "-" or a number: those become a numbered list
function installSteps(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const bullet = /^([*•-]|\d+[.)])\s+/;
  return lines.map((l) => ({ text: l.replace(bullet, ''), step: bullet.test(l) }));
}

function SoftwareSection({ software }) {
  const [open, setOpen] = useState({});
  if (!software || software.length === 0) return null;
  return (
    <section className="soft-section" aria-labelledby="soft-title">
      <div className="soft-head">
        <span className="soft-icon"><HugeiconsIcon icon={ComputerIcon} size={22} strokeWidth={1.5} /></span>
        <div><h3 id="soft-title">Software for this course</h3><p>Download it and follow the steps to install it on your computer.</p></div>
      </div>
      <ul className="soft-list">
        {software.map((x) => {
          const steps = [...installSteps(x.description), ...installSteps(x.installation_instructions)];
          const on = Boolean(open[x.id]);
          return (
            <li key={x.id} className="soft-item">
              <div className="soft-top">
                <div className="soft-title">
                  <strong>{x.name}</strong>
                  <span className="soft-meta">
                    <span className={`soft-chip${x.is_required ? ' req' : ''}`}>{x.is_required ? 'Required' : 'Optional'}</span>
                    {x.platform && <span>{PLATFORM[String(x.platform).toLowerCase()] || x.platform}</span>}
                    {x.version && <span>Version {x.version}</span>}
                  </span>
                </div>
                {x.download_url && (
                  <a className="btn-solid soft-download" href={x.download_url} target="_blank" rel="noopener noreferrer"><HugeiconsIcon icon={Download04Icon} size={18} strokeWidth={1.7} /> Download</a>
                )}
              </div>
              {steps.length > 0 && (
                <>
                  <button type="button" className="soft-toggle" aria-expanded={on} onClick={() => setOpen((o) => ({ ...o, [x.id]: !o[x.id] }))}>
                    <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={1.8} className="chev" /> How to install
                  </button>
                  {on && (
                    <ol className="soft-steps">
                      {steps.map((st, i) => <li key={i} className={st.step ? '' : 'note'}>{st.text}</li>)}
                    </ol>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---- certificate: request it at 80%, download it once the instructor has approved ----
function CertificateModal({ course, user, cert, onSent, onClose }) {
  const [title, setTitle] = useState('Ms.');
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => {
    const prev = document.activeElement;
    firstRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await requestCertificate(course.id, { title, full_name: name, delivery_email: email });
      onSent(r);
      setSent(true);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return createPortal(
    <div className="modal-wrap">
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="modal cert-modal" role="dialog" aria-modal="true" aria-labelledby="certm-title">
        <button type="button" className="icon-close modal-x" aria-label="Close" onClick={onClose}><HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} /></button>
        {sent ? (
          <div className="cert-done">
            <span className="cert-medal ok"><HugeiconsIcon icon={Tick02Icon} size={34} strokeWidth={2.2} /></span>
            <h2 id="certm-title">Request sent</h2>
            <p>Your instructor will check your course and approve your certificate. When it is ready you can download it here, on this page.</p>
            <button type="button" className="btn-solid" onClick={onClose}>Continue learning</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <span className="cert-medal"><HugeiconsIcon icon={Certificate01Icon} size={34} strokeWidth={1.4} /></span>
            <h2 id="certm-title">You’ve completed {cert.required}% of the course!</h2>
            <p className="cert-lead">Request your certificate. Your instructor will approve it, then you can download it from this page. Check the spelling: it is printed exactly as you write it.</p>

            <div className="cert-row">
              <label className="field cert-title-field"><span>Title</span>
                <select value={title} onChange={(e) => setTitle(e.target.value)} className="cert-select">{['Mr.', 'Ms.', 'Mrs.', 'Dr.'].map((t) => <option key={t}>{t}</option>)}</select>
              </label>
              <label className="field cert-name-field"><span>Name on the certificate</span>
                <input ref={firstRef} className="cert-input" type="text" required maxLength={80} placeholder="Full name in English letters" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} />
              </label>
            </div>
            <label className="field"><span>Send updates to this email</span>
              <input className="cert-input" type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} />
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="review-actions">
              <button type="button" className="btn-line" onClick={onClose}>Maybe later</button>
              <button type="submit" className="btn-solid" disabled={busy}>{busy ? 'Sending…' : 'Request certificate'}</button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

function CertificateSection({ course, cert, percent, onRequest }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const status = cert.status;
  const eligible = percent >= cert.required;

  async function download() {
    setBusy(true);
    setError('');
    try { await downloadCertificate(course.id); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  // approved: a certificate-style card with the details and the download
  if (status === 'issued') {
    return (
      <section className="cert-ready" aria-labelledby="certs-title">
        <div className="cert-ready-top">
          <span className="cert-medal small ok"><HugeiconsIcon icon={Tick02Icon} size={26} strokeWidth={2.2} /></span>
          <div className="cert-ready-title">
            <h3 id="certs-title">Your certificate is ready</h3>
            <p>Approved by your instructor{cert.issued_at ? <> · Issued on <strong>{day(cert.issued_at)}</strong></> : ''}</p>
          </div>
          <button type="button" className="btn-solid cert-download" disabled={busy} onClick={download}><HugeiconsIcon icon={Download04Icon} size={20} strokeWidth={1.7} /> {busy ? 'Preparing…' : 'Download'}</button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </section>
    );
  }

  return (
    <section className={`cert-card ${status || (eligible ? 'ready' : 'locked')}`} aria-labelledby="certs-title">
      <span className="cert-medal small"><HugeiconsIcon icon={Certificate01Icon} size={26} strokeWidth={1.5} /></span>
      <div className="cert-card-body">
        <h3 id="certs-title">Your certificate</h3>
        {status === 'requested' ? (
          <p>Your request was sent{cert.requested_at ? ` on ${day(cert.requested_at)}` : ''}. We are waiting for your instructor to approve it. You can download it here as soon as it is ready.</p>
        ) : eligible ? (
          <>
            <p>You have finished {percent}% of the course, so you can request your certificate now.</p>
            <button type="button" className="btn-solid" onClick={onRequest}>Request certificate</button>
          </>
        ) : (
          <>
            <p>Finish {cert.required}% of the course to request your certificate. You are at {percent}%.</p>
            <div className="cp-bar cert-bar" role="progressbar" aria-valuemin={0} aria-valuemax={cert.required} aria-valuenow={Math.min(percent, cert.required)}><i style={{ width: `${Math.min(100, (percent / cert.required) * 100)}%` }} /></div>
          </>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </section>
  );
}

// ---- the student's review of the course ----
const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function CourseReview({ courseId, mine, onSaved }) {
  const [editing, setEditing] = useState(!mine);
  const [rating, setRating] = useState(mine ? mine.rating : 0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState(mine && mine.review_text ? mine.review_text : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!rating) { setError('Please choose a star rating.'); return; }
    setBusy(true);
    setError('');
    try {
      const r = await saveCourseReview(courseId, rating, text.trim());
      onSaved(r);
      setEditing(false);
      setSaved(true);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const shown = hover || rating;
  return (
    <section className="course-review" aria-labelledby="cr-title">
      <h3 id="cr-title">{mine ? 'Your review of this course' : 'Rate this course'}</h3>
      {!editing && mine ? (
        <div className="cr-saved">
          <span className="mini-stars" aria-label={`You rated ${mine.rating} out of 5`}>{[1, 2, 3, 4, 5].map((n) => <HugeiconsIcon key={n} icon={StarIcon} size={20} strokeWidth={1.4} className={n <= mine.rating ? 'on' : ''} />)}</span>
          {mine.review_text && <p>{mine.review_text}</p>}
          <p className="cr-thanks">{saved ? 'Thank you! Your review has been submitted.' : 'You have reviewed this course.'}</p>
          <button type="button" className="btn-line" onClick={() => { setRating(mine.rating); setText(mine.review_text || ''); setSaved(false); setEditing(true); }}>Edit review</button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <p className="cr-sub">Tell other students what you think. Your rating helps them choose.</p>
          <div className="star-pick" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
                className={n <= shown ? 'on' : ''} onMouseEnter={() => setHover(n)} onClick={() => { setRating(n); setError(''); }}>
                <HugeiconsIcon icon={StarIcon} size={34} strokeWidth={1.4} />
              </button>
            ))}
            <span className="star-word">{WORDS[shown]}</span>
          </div>
          <label className="field">
            <span>Your review <em>(optional)</em></span>
            <textarea className="review-text" rows={4} maxLength={1000} placeholder="What did you like about this course?" value={text} onChange={(e) => setText(e.target.value)} />
            <small className="review-count">{text.length}/1000</small>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="review-actions">
            {mine && <button type="button" className="btn-line" onClick={() => { setEditing(false); setError(''); }}>Cancel</button>}
            <button type="submit" className="btn-solid" disabled={busy}>{busy ? 'Submitting…' : mine ? 'Save changes' : 'Submit review'}</button>
          </div>
        </form>
      )}
    </section>
  );
}

// ---- one course: the player, the progress and the lesson list ----
const UNLOCK_AT = 60; // % of a lesson that has to be watched before the next one opens

function Classroom({ courseId, user, onNavigate }) {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const [current, setCurrent] = useState(0); // index in the flat list of lessons
  const [open, setOpen] = useState({});
  const cur = useRef({ id: null, time: 0, duration: 0, sentDone: false, lastSent: 0 });
  const picked = useRef(false);
  const [certModal, setCertModal] = useState(false);

  const load = useCallback(() => fetchLearn(courseId), [courseId]);

  useEffect(() => {
    let live = true;
    picked.current = false;
    setState({ loading: true, data: null, error: '' });
    load()
      .then((data) => live && setState({ loading: false, data, error: '' }))
      .catch((e) => live && setState({ loading: false, data: null, error: e.status === 403 ? 'noaccess' : e.status === 401 ? 'login' : e.message }));
    return () => { live = false; };
  }, [load]);

  const certNow = state.data && state.data.certificate;
  const canRequest = Boolean(certNow && certNow.status === null && state.data.progress.percent >= certNow.required);
  useEffect(() => { if (canRequest) setCertModal(true); }, [canRequest, courseId]); // every visit, until the request is sent
  // a waiting request: look for the instructor's approval every 10 seconds, quietly
  const waitingCert = Boolean(certNow && certNow.status === 'requested');
  useEffect(() => {
    if (!waitingCert) return undefined;
    const t = setInterval(() => document.visibilityState === 'visible' && load().then((d) => setState((st) => (st.data ? { ...st, data: { ...st.data, certificate: d.certificate } } : st))).catch(() => {}), 10000);
    return () => clearInterval(t);
  }, [waitingCert, load]);

  const lessons = useMemo(() => (state.data ? state.data.sections.flatMap((x, si) => x.videos.map((v) => ({ ...v, section: si }))) : []), [state.data]);
  const lesson = lessons[current];

  // first visit: carry on from the first lesson that is not finished
  useEffect(() => {
    if (!lessons.length || picked.current) return;
    picked.current = true;
    const at = lessons.findIndex((l) => !l.done);
    const i = at === -1 ? 0 : at;
    setCurrent(i);
    setOpen({ [lessons[i].section]: true });
  }, [lessons]);

  // a new lesson starts its own tally
  useEffect(() => {
    if (!lesson) return;
    cur.current = { id: lesson.id, time: 0, duration: lesson.duration_seconds || 0, sentDone: lesson.done, lastSent: Date.now() };
  }, [lesson?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // save the position now (used when pausing, switching lesson, leaving the page)
  const flush = useCallback(async () => {
    const c = cur.current;
    if (!c.id || !c.duration || c.time < 1) return null;
    c.lastSent = Date.now();
    const res = await saveProgress(courseId, c.id, c.time, c.duration);
    if (res) {
      setState((st) => st.data && ({ ...st, data: { ...st.data, progress: res.progress, sections: st.data.sections.map((x) => ({ ...x, videos: x.videos.map((v) => (String(v.id) === String(c.id) ? { ...v, done: res.done, watched_percent: Math.max(v.watched_percent, res.watched_percent) } : v)) })) } }));
      if (res.next_unlocked) load().then((data) => setState({ loading: false, data, error: '' })).catch(() => {}); // brings in the link of the lesson that just opened
    }
    return res;
  }, [courseId, load]);

  const onTime = useCallback(({ time, duration }) => {
    const c = cur.current;
    if (!c.id) return;
    c.time = time;
    if (duration) c.duration = duration;
    const now = c.duration ? Math.min(100, Math.round((time / c.duration) * 100)) : 0;
    if (!c.sentDone && now >= UNLOCK_AT) { c.sentDone = true; flush(); } // reached 60%: save at once so the next lesson opens
    else if (Date.now() - c.lastSent > 10000) flush();
  }, [flush]);

  // leaving the page or the tab: keep what was watched
  useEffect(() => {
    const hide = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', flush);
    return () => { document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', flush); flush(); };
  }, [flush]);

  const select = async (i) => {
    if (!lessons[i] || lessons[i].locked) return;
    await flush();
    setCurrent(i);
    setOpen((o) => ({ ...o, [lessons[i].section]: true }));
    document.querySelector('.learn-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (state.loading) return <main className="learn-wrap"><div className="cd-inner"><div className="cd-skeleton" aria-hidden="true"><i /><i /><i /></div></div></main>;
  if (!state.data) {
    return (
      <main className="learn-wrap"><div className="cd-inner">
        <div className="designs-msg">
          <p>{state.error === 'noaccess' ? 'You are not enrolled in this course, or your access has ended.' : state.error === 'login' ? 'Please log in to continue learning.' : `Couldn’t load the course (${state.error}).`}</p>
          <button type="button" className="btn-solid purch-btn" onClick={() => onNavigate('Courses', state.error === 'noaccess' ? courseId : undefined)}>{state.error === 'noaccess' ? 'View the course' : 'Back to courses'}</button>
        </div>
      </div></main>
    );
  }

  const { course, sections, enrollment, progress } = state.data;
  const next = lessons[current + 1];
  const canNext = Boolean(lesson && lesson.done && next && !next.locked);
  let n = -1;
  return (
    <main className="learn-wrap">
      <div className="learn-head">
        <div className="cd-inner">
          <button type="button" className="back-link" onClick={() => onNavigate('Learn')}><HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={1.6} /> My learning</button>
          <h1>{course.title}</h1>
          <div className="course-progress" role="group" aria-label="Course progress">
            <div className="cp-top">
              <strong>{progress.percent}% complete</strong>
              <span>{progress.completed} of {progress.total} lessons finished{enrollment.expires_at ? ` · access until ${day(enrollment.expires_at)}` : ''}</span>
            </div>
            <div className="cp-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}><i style={{ width: `${progress.percent}%` }} /></div>
          </div>
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="cd-inner"><p className="designs-msg">The lessons for this course are being prepared. Please check back soon.</p></div>
      ) : (
        <div className="cd-inner learn-grid">
          <div className="learn-main">
            <div className="learn-player">
              <VideoPlayer
                key={lesson.id} url={lesson.url} poster={lesson.poster}
                resumeAt={lesson.resume_seconds} furthest={lesson.furthest_seconds} finished={lesson.done} skipOnly
                onTime={onTime} onPause={() => flush()}
                onEnded={() => { if (next && !next.locked && lesson.done) select(current + 1); }}
              />
            </div>

            <div className="learn-now">
              <div>
                <span className="video-kicker">Lesson {current + 1} of {lessons.length}</span>
                <h2>{lesson.title}</h2>
              </div>
              <div className="learn-nav">
                <button type="button" className="btn-line" disabled={current === 0} onClick={() => select(current - 1)}><HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.8} /> Previous</button>
                <button type="button" className="btn-solid" disabled={!canNext} onClick={() => select(current + 1)} title={!next ? 'This is the last lesson' : canNext ? '' : `Watch ${UNLOCK_AT}% of this lesson to unlock the next one`}>
                  {!canNext && next && <HugeiconsIcon icon={LockIcon} size={15} strokeWidth={1.8} />}Next <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={1.8} />
                </button>
              </div>
            </div>

            {lesson.description && <p className="learn-desc">{lesson.description}</p>}

            <SoftwareSection software={state.data.software} />

            {state.data.certificate && <CertificateSection course={course} cert={state.data.certificate} percent={progress.percent} onRequest={() => setCertModal(true)} />}

            <CourseReview courseId={courseId} mine={state.data.my_review} onSaved={(r) => setState((st) => ({ ...st, data: { ...st.data, my_review: r } }))} />
          </div>

          <aside className="learn-list" aria-label="Course content">
            <h3>Course content</h3>
            {sections.map((sec, si) => (
              <div key={`${sec.title}-${si}`} className="learn-section">
                <button type="button" className="cd-section-head" aria-expanded={Boolean(open[si])} onClick={() => setOpen((o) => ({ ...o, [si]: !o[si] }))}>
                  <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={1.8} className="chev" />
                  <span className="cd-section-title">{sec.title}</span>
                  <span className="cd-section-meta">{sec.videos.filter((v) => v.done).length}/{sec.videos.length}</span>
                </button>
                {open[si] && (
                  <ul className="learn-lessons">
                    {sec.videos.map((v) => { n += 1; const idx = n; return (
                      <li key={v.id}>
                        <button type="button" className={`${idx === current ? 'on' : ''}${v.locked ? ' locked' : ''}`} disabled={v.locked} onClick={() => select(idx)} aria-current={idx === current ? 'true' : undefined} title={v.locked ? 'Finish the earlier lessons to open this one' : ''}>
                          <HugeiconsIcon icon={v.locked ? LockIcon : v.done ? Tick02Icon : PlayCircleIcon} size={18} strokeWidth={v.done ? 2 : 1.5} className={v.done ? 'tick' : ''} />
                          <span className="lesson-title">{v.title}</span>
                          {v.duration_seconds > 0 && <span className="lesson-time">{clock(v.duration_seconds)}</span>}
                        </button>
                      </li>
                    ); })}
                  </ul>
                )}
              </div>
            ))}
          </aside>
        </div>
      )}

      {certModal && state.data.certificate && <CertificateModal course={course} user={user} cert={state.data.certificate} onClose={() => setCertModal(false)} onSent={(r) => setState((st) => ({ ...st, data: { ...st.data, certificate: { ...st.data.certificate, ...r } } }))} />}

      {lesson && state.data.doubt_support && <DoubtChat key={courseId} courseId={courseId} lesson={lesson} />}
    </main>
  );
}

export default function Learn({ courseId, user, onNavigate, onLogin }) {
  if (!courseId) return <MyCourses user={user} onNavigate={onNavigate} onLogin={onLogin} />;
  if (!user) {
    return <main className="learn-wrap"><div className="cd-inner"><div className="designs-msg"><p>Please log in to continue learning.</p><button type="button" className="btn-solid purch-btn" onClick={onLogin}>Log in</button></div></div></main>;
  }
  return <Classroom courseId={courseId} user={user} onNavigate={onNavigate} />;
}

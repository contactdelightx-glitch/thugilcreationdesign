import { useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon, ArrowDown01Icon, PlayCircleIcon, Clock01Icon, LanguageSquareIcon, UserGroupIcon, StarIcon,
  CheckmarkCircle02Icon, Certificate01Icon, Calendar03Icon, Call02Icon, Book02Icon, ViewIcon, ArrowUpRight01Icon, Cancel01Icon, ArrowRight01Icon, Tick02Icon, SparklesIcon, PlayIcon, File02Icon, Shield01Icon, Share08Icon,
} from '@hugeicons/core-free-icons';
import { fetchCourse, fetchAccess, startCourseCheckout, verifyCoursePayment, loadRazorpay } from '../api';
import VideoPlayer from '../components/VideoPlayer';

const money = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const mins = (sec) => {
  const m = Math.round(sec / 60);
  if (m < 60) return `${Math.max(m, 1)} min`;
  return `${Math.floor(m / 60)} hr${Math.floor(m / 60) === 1 ? '' : 's'}${m % 60 ? ` ${m % 60} min` : ''}`;
};
const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
const generic = (name) => !name || /^instructor$/i.test(name.trim());
const when = (iso) => new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
const PHONE = '+91 8838008499';
const SAMPLE_CERTIFICATE = 'https://academy.thugilcreation.com/assets/TCC%20SAMPLE-BH39TftE.pdf';

function Stars({ value }) {
  return (
    <span className="stars" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => <HugeiconsIcon key={n} icon={StarIcon} size={16} strokeWidth={1.5} className={n <= Math.round(value) ? 'on' : ''} />)}
    </span>
  );
}

// the sample certificate: a big viewer on larger screens, a new tab on phones (phones show embedded PDFs badly)
function openCertificate(setOpen) {
  if (window.innerWidth <= 720) window.open(SAMPLE_CERTIFICATE, '_blank', 'noopener,noreferrer');
  else setOpen(true);
}

function CertificateSample({ onView }) {
  return (
    <section className="cd-card cd-cert" aria-labelledby="cert-h">
      <span className="cert-icon"><HugeiconsIcon icon={Certificate01Icon} size={34} strokeWidth={1.3} /></span>
      <div className="cert-text">
        <h2 id="cert-h">Earn a certificate</h2>
        <p>Choose a package with the certificate and receive a certificate from ThugilCreation when you complete the course. See what it looks like.</p>
      </div>
      <button type="button" className="btn-solid cert-btn" onClick={onView}><HugeiconsIcon icon={ViewIcon} size={18} strokeWidth={1.6} /> View sample certificate</button>
    </section>
  );
}

function CertificateViewer({ onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="modal-wrap">
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="modal pdf-modal" role="dialog" aria-modal="true" aria-label="Sample certificate">
        <header className="pdf-head">
          <strong>Sample certificate</strong>
          <a className="pdf-newtab" href={SAMPLE_CERTIFICATE} target="_blank" rel="noopener noreferrer">Open in new tab <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} strokeWidth={1.8} /></a>
          <button ref={closeRef} type="button" className="icon-close" aria-label="Close" onClick={onClose}><HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} /></button>
        </header>
        <iframe className="pdf-frame" title="Sample certificate" src={`${SAMPLE_CERTIFICATE}#toolbar=0&navpanes=0`} />
      </div>
    </div>
  );
}

// The free demo video, in a pop-up
function PreviewPlayer({ preview, title, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="modal-wrap">
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="modal video-modal" role="dialog" aria-modal="true" aria-label={`${title}: course preview`}>
        <header className="video-modal-head">
          <div><span className="video-kicker">Course preview</span><strong>{preview.title}</strong></div>
          <button ref={closeRef} type="button" className="icon-close" aria-label="Close" onClick={onClose}><HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} /></button>
        </header>
        <VideoPlayer url={preview.url} poster={preview.poster} />
      </div>
    </div>
  );
}

// What each package includes (the price of each comes from the server with the course)
const PACKAGE_TEXT = {
  basic: { tagline: 'Learn at your own pace', cert: false, doubt: false, mentor: false },
  standard: { tagline: 'Perfect for verified certification', cert: true, doubt: false, mentor: false },
  pro: { tagline: 'For full instructor doubt support', cert: true, doubt: true, mentor: false, popular: true },
  elite: { tagline: 'Ultimate 1-on-1 live mentoring', cert: true, doubt: true, mentor: true },
};
function packagesFor(c, priced) {
  const months = c.duration_months > 0 ? `${c.duration_months} months access & updates` : 'Access & updates';
  return priced.map((p) => {
    const t = PACKAGE_TEXT[p.key];
    return {
      key: p.key, name: p.name, price: p.price, tagline: t.tagline, popular: t.popular,
      features: [
        { text: 'Full core video lectures', on: true },
        { text: months, on: true },
        { text: 'Verified professional certificate', on: t.cert },
        { text: 'Priority doubt support', note: 'Text support by chat box', on: t.doubt },
        { text: '1-on-1 live mentorship', note: 'Connected by scheduled call', on: t.mentor },
      ],
    };
  });
}

function PackagesModal({ course, priced, user, onNeedLogin, onSessionExpired, onEnrolled, onClose }) {
  const closeRef = useRef(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const packages = packagesFor(course, priced);

  async function buy(p) {
    if (!user) return onNeedLogin();
    setBusy(p.key);
    setError('');
    try {
      await loadRazorpay();
      const session = await startCourseCheckout(course.id, p.key);
      const rzp = new window.Razorpay({
        key: session.keyId, amount: session.amount, currency: session.currency, order_id: session.orderId,
        name: 'ThugilCreation', description: `${course.title} · ${p.name} package`,
        prefill: { name: user.full_name || '', email: user.email || '', contact: user.phone || '' },
        theme: { color: '#751423' },
        modal: { ondismiss: () => setBusy('') },
        handler: async (r) => {
          try {
            const done = await verifyCoursePayment(r);
            onEnrolled(done.enrollmentId);
          } catch (err) {
            setError(`${err.message} Payment id: ${r.razorpay_payment_id}`);
            setBusy('');
          }
        },
      });
      rzp.on('payment.failed', (r) => { setError(r?.error?.description || 'The payment failed. You have not been charged. Please try again.'); setBusy(''); });
      rzp.open();
    } catch (err) {
      if (err.status === 401) return onSessionExpired();
      setError(err.message);
      setBusy('');
    }
  }

  useEffect(() => {
    const prev = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [onClose]);

  return (
    <div className="modal-wrap">
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="modal pkg-modal" role="dialog" aria-modal="true" aria-labelledby="pkg-title">
        <button ref={closeRef} type="button" className="icon-close modal-x" aria-label="Close" onClick={onClose}><HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} /></button>
        <div className="pkg-head">
          <span className="pkg-eyebrow">Choose your package</span>
          <h2 id="pkg-title">{course.title}</h2>
          <p>Pick the package that suits you. You can start learning as soon as you enrol.</p>
        </div>

        <div className="pkg-grid">
          {packages.map((p) => (
            <article key={p.key} className={`pkg${p.popular ? ' popular' : ''}`}>
              <div className="pkg-top">
                <h3>{p.name}</h3>
                {p.popular && <span className="pkg-badge"><HugeiconsIcon icon={SparklesIcon} size={13} strokeWidth={1.8} /> Most popular</span>}
              </div>
              <div className="pkg-price"><strong>{money(p.price)}</strong><small>Per course / user</small></div>
              <p className="pkg-tag">{p.tagline}</p>
              <ul className="pkg-features">
                {p.features.map((x) => (
                  <li key={x.text} className={x.on ? '' : 'off'}>
                    <span className="pkg-mark"><HugeiconsIcon icon={x.on ? Tick02Icon : Cancel01Icon} size={13} strokeWidth={2.2} /></span>
                    <span className="pkg-text">{x.text}{x.note && <small>{x.note}</small>}</span>
                  </li>
                ))}
              </ul>
              <button type="button" className="pkg-select" disabled={Boolean(busy)} onClick={() => buy(p)}>
                {busy === p.key ? 'Opening payment…' : user ? `Select ${p.name}` : 'Log in to buy'} <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={1.8} />
              </button>
            </article>
          ))}
        </div>

        <p className="pkg-foot">All packages are non-refundable.</p>

        {error && <p className="pkg-soon error" role="alert">{error}</p>}
      </div>
    </div>
  );
}

export default function CourseDetail({ id, onNavigate, user, onNeedLogin, onSessionExpired }) {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const [open, setOpen] = useState({ 0: true }); // which sections of the syllabus are open
  const [more, setMore] = useState(false); // the full description
  const [packagesOpen, setPackagesOpen] = useState(false);
  const [enrolled, setEnrolled] = useState(false); // is the logged-in shopper already learning this course?
  useEffect(() => {
    setEnrolled(false);
    if (!user) return undefined;
    let live = true;
    fetchAccess(id).then((r) => live && setEnrolled(r.enrolled)).catch(() => {});
    return () => { live = false; };
  }, [id, user]);
  const [certOpen, setCertOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [thumbBroken, setThumbBroken] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let live = true;
    setState({ loading: true, data: null, error: '' });
    setOpen({ 0: true });
    fetchCourse(id).then((data) => live && setState({ loading: false, data, error: '' })).catch((e) => live && setState({ loading: false, data: null, error: e.status === 404 ? 'notfound' : e.message }));
    return () => { live = false; };
  }, [id]);

  const back = <button type="button" className="back-link" onClick={() => onNavigate('Courses')}><HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={1.6} /> All courses</button>;

  if (state.loading) return <main className="cd-wrap"><div className="cd-inner">{back}<div className="cd-skeleton" aria-hidden="true"><i /><i /><i /></div></div></main>;
  if (!state.data) {
    return (
      <main className="cd-wrap"><div className="cd-inner">{back}
        <p className="designs-msg">{state.error === 'notfound' ? 'This course isn’t available. It may have been removed.' : `Couldn’t load the course (${state.error}). Please try again.`}</p>
      </div></main>
    );
  }

  const { course: c, learningPoints, sections, preview, packages: priced } = state.data;
  const certExtra = c.certificate_with_price > c.price;
  const desc = c.description || '';
  const long = desc.length > 420;
  const allOpen = sections.length > 0 && sections.every((_, i) => open[i]);
  const toggleAll = () => setOpen(allOpen ? {} : Object.fromEntries(sections.map((_, i) => [i, true])));

  return (
    <main className="cd-wrap">
      <header className="cd-head">
        <div className="cd-inner">
          {back}
          <div className="cd-head-text">
            {c.category && <span className="course-cat static">{c.category}</span>}
            <h1>{c.title}</h1>
            <p className={`cd-desc${long && !more ? ' clamp' : ''}`}>{desc}</p>
            {long && <button type="button" className="text-link" onClick={() => setMore((m) => !m)}>{more ? 'Show less' : 'Read more'}</button>}
            <ul className="cd-facts">
              {c.review_count > 0 && <li><Stars value={c.avg_rating} /><strong>{Number(c.avg_rating).toFixed(1)}</strong> <span>({c.review_count} {c.review_count === 1 ? 'review' : 'reviews'})</span></li>}
              {c.students > 0 && <li><HugeiconsIcon icon={UserGroupIcon} size={18} strokeWidth={1.5} />{c.students} students</li>}
              {c.language && <li><HugeiconsIcon icon={LanguageSquareIcon} size={18} strokeWidth={1.5} />{c.language}</li>}
              {!generic(c.instructor_name) && <li>By <strong>{c.instructor_name}</strong></li>}
            </ul>
          </div>
        </div>
      </header>

      <div className="cd-inner cd-grid">
        <div className="cd-main">
          {learningPoints.length > 0 && (
            <section className="cd-card" aria-labelledby="learn-h">
              <h2 id="learn-h">What you’ll learn</h2>
              <ul className="cd-learn">
                {learningPoints.map((t) => <li key={t}><HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} strokeWidth={1.6} />{t}</li>)}
              </ul>
            </section>
          )}

          {sections.length > 0 && (
            <section className="cd-card" aria-labelledby="content-h">
              <div className="cd-row">
                <div>
                  <h2 id="content-h">Course content</h2>
                  <p className="cd-sub">{sections.length} sections · {c.videos} lessons · {mins(c.duration_seconds)} in total</p>
                </div>
                <button type="button" className="text-link" onClick={toggleAll}>{allOpen ? 'Collapse all' : 'Expand all'}</button>
              </div>
              <div className="cd-syllabus">
                {sections.map((s, i) => (
                  <div key={`${s.title}-${i}`} className="cd-section">
                    <button type="button" className="cd-section-head" aria-expanded={Boolean(open[i])} onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}>
                      <HugeiconsIcon icon={ArrowDown01Icon} size={18} strokeWidth={1.8} className="chev" />
                      <span className="cd-section-title">{s.title}</span>
                      <span className="cd-section-meta">{s.videos.length} {s.videos.length === 1 ? 'lesson' : 'lessons'}{s.duration_seconds > 0 ? ` · ${mins(s.duration_seconds)}` : ''}</span>
                    </button>
                    {open[i] && (
                      <ul className="cd-lessons">
                        {s.videos.length === 0 && <li className="empty">No lessons in this section yet.</li>}
                        {s.videos.map((v, j) => (
                          <li key={`${v.title}-${j}`}>
                            <HugeiconsIcon icon={PlayCircleIcon} size={18} strokeWidth={1.5} />
                            <span className="lesson-title">{v.title}</span>
                            {v.is_free_preview && <span className="preview-pill">Free preview</span>}
                            {v.duration_seconds > 0 && <span className="lesson-time">{clock(v.duration_seconds)}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {certExtra && <CertificateSample onView={() => openCertificate(setCertOpen)} />}
        </div>

        <aside className="cd-buy">
          <div className="cd-buy-card">
            <button type="button" className="cd-preview" onClick={() => (preview ? setPlaying(true) : document.getElementById('content-h')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))} aria-label={preview ? 'Play the course preview video' : 'Preview this course: see what is inside'}>
              {c.thumbnail_url && !thumbBroken
                ? <img src={c.thumbnail_url} alt="" referrerPolicy="no-referrer" onError={() => setThumbBroken(true)} />
                : <span className="course-thumb-fallback"><HugeiconsIcon icon={Book02Icon} size={44} strokeWidth={1.2} /></span>}
              <span className="cd-preview-shade" />
              <span className="cd-play"><HugeiconsIcon icon={PlayIcon} size={30} strokeWidth={1.5} /></span>
              <span className="cd-preview-label">Preview this course</span>
            </button>

            <div className="cd-buy-body">
              <div className="cd-price"><strong>{c.price > 0 ? money(c.price) : 'Free'}</strong></div>
              {certExtra && <p className="cd-addon">Certification add-on available</p>}
              {enrolled
                ? <button type="button" className="btn-solid enrol" onClick={() => onNavigate('Learn', c.id)}>Start learning</button>
                : <button type="button" className="btn-solid enrol" onClick={() => setPackagesOpen(true)}>Buy now</button>}

              <h3 className="cd-inc-title">This course includes:</h3>
              <ul className="cd-includes">
                {c.duration_months > 0 && <li><HugeiconsIcon icon={Clock01Icon} size={20} strokeWidth={1.5} /><span>{c.duration_months} Months Access (Starts from purchase)</span></li>}
                {c.resources > 0 && <li><HugeiconsIcon icon={File02Icon} size={20} strokeWidth={1.5} /><span>Professional resources</span></li>}
                {certExtra && (
                  <li className="cert-line">
                    <HugeiconsIcon icon={Certificate01Icon} size={20} strokeWidth={1.5} />
                    <span>Certificate (Earn at 70% progress)</span>
                    <button type="button" className="inc-link" onClick={() => openCertificate(setCertOpen)}>Preview</button>
                  </li>
                )}
                <li><HugeiconsIcon icon={Shield01Icon} size={20} strokeWidth={1.5} /><span>Full access</span></li>
              </ul>

              <button type="button" className="cd-share" onClick={async () => {
                const url = window.location.href;
                try {
                  if (navigator.share) await navigator.share({ title: c.title, url });
                  else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2000); }
                } catch { /* sharing was cancelled */ }
              }}><HugeiconsIcon icon={Share08Icon} size={18} strokeWidth={1.6} /> {shared ? 'Link copied' : 'Share'}</button>
            </div>
          </div>
        </aside>
      </div>
      {packagesOpen && <PackagesModal course={c} priced={priced} user={user} onNeedLogin={() => { setPackagesOpen(false); onNeedLogin(); }} onSessionExpired={() => { setPackagesOpen(false); onSessionExpired(); }} onEnrolled={(enrollmentId) => { setPackagesOpen(false); onNavigate('Enrolled', enrollmentId); }} onClose={() => setPackagesOpen(false)} />}
      {certOpen && <CertificateViewer onClose={() => setCertOpen(false)} />}
      {playing && preview && <PreviewPlayer preview={preview} title={c.title} onClose={() => setPlaying(false)} />}
    </main>
  );
}

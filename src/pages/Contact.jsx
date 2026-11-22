import { useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ImageUploadIcon, Cancel01Icon, CheckmarkCircle02Icon, Call02Icon, Mail01Icon, UserIcon, ArrowLeft01Icon, ArrowRight01Icon, Clock01Icon, Calendar03Icon, Task01Icon } from '@hugeicons/core-free-icons';
import { sendDesignRequest, fetchDesignPackages, fetchDesignSubscription, startPackageCheckout, verifyPackagePayment, fetchMyDesignWorks, downloadWorkFile, loadRazorpay } from '../api';

const MAX_FILES = 2;
const MAX_MB = 5;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const money = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const day = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const dueDay = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
// the steps of a work, in order; each work shows how far it has got
const STEPS = [['new', 'Received'], ['contacted', 'Contacted'], ['in_progress', 'In progress'], ['review', 'Ready for review'], ['done', 'Delivered']];
const STEP_NAME = Object.fromEntries(STEPS);

function WorkForm({ user, onSent, onSessionExpired }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', requirement: '', notes: '' });
  const [files, setFiles] = useState([]); // [{ file, url }]
  const [errors, setErrors] = useState({});
  const [picError, setPicError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const pick = useRef(null);

  // a logged-in visitor does not have to type their name and email again
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: f.name || user.full_name || '', email: f.email || user.email || '', phone: f.phone || user.phone || '' }));
  }, [user]);
  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  function addPictures(list) {
    setPicError('');
    const room = MAX_FILES - files.length;
    const add = [];
    for (const f of Array.from(list)) {
      if (!OK_TYPES.includes(f.type)) { setPicError('Pictures must be JPG, PNG or WEBP files.'); continue; }
      if (f.size > MAX_MB * 1024 * 1024) { setPicError(`“${f.name}” is larger than ${MAX_MB} MB.`); continue; }
      if (add.length >= room) { setPicError(`You can attach at most ${MAX_FILES} pictures.`); break; }
      add.push({ file: f, url: URL.createObjectURL(f) });
    }
    if (add.length) setFiles((x) => [...x, ...add]);
    if (pick.current) pick.current.value = '';
  }
  const removePicture = (i) => { setPicError(''); setFiles((x) => { URL.revokeObjectURL(x[i].url); return x.filter((_, n) => n !== i); }); };

  function check() {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your name';
    if (form.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a valid phone number';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (form.requirement.trim().length < 10) e.requirement = 'Tell us what you need (at least 10 characters)';
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    const e = check();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await sendDesignRequest({ ...form, files: files.map((f) => f.file) });
      setSent(true);
      window.scrollTo({ top: 0 });
      onSent?.();
    } catch (err) {
      if (err.status === 401) return onSessionExpired?.();
      setErrors({ ...err.fields, form: err.message });
    } finally { setBusy(false); }
  }

  function again() {
    files.forEach((f) => URL.revokeObjectURL(f.url));
    setFiles([]); setErrors({}); setPicError('');
    setForm({ name: user?.full_name || '', phone: user?.phone || '', email: user?.email || '', requirement: '', notes: '' });
    setSent(false);
  }

  if (sent) {
    return (
      <div className="contact-done">
        <span className="done-tick"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={44} strokeWidth={1.5} /></span>
        <h1>Work sent</h1>
        <p>Thank you. Our designer has your work and will call or write to you soon. You can follow its progress under <strong>My works</strong>. We also sent a copy to <strong>{form.email}</strong>.</p>
        <button type="button" className="btn-plain" onClick={again}>Send another work</button>
      </div>
    );
  }

  return (
    <>
      <form className="contact-form" onSubmit={submit} noValidate>
        <div className="contact-col">
          <label className="field">Your name
            <span className={`input-icon${errors.name ? ' bad' : ''}`}><HugeiconsIcon icon={UserIcon} size={18} strokeWidth={1.5} /><input value={form.name} onChange={set('name')} autoComplete="name" placeholder="Your full name" /></span>
            {errors.name && <em className="form-error">{errors.name}</em>}
          </label>

          <label className="field">Phone number
            <span className={`input-icon${errors.phone ? ' bad' : ''}`}><HugeiconsIcon icon={Call02Icon} size={18} strokeWidth={1.5} /><input value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" /></span>
            {errors.phone && <em className="form-error">{errors.phone}</em>}
          </label>

          <label className="field">Email
            <span className={`input-icon${errors.email ? ' bad' : ''}`}><HugeiconsIcon icon={Mail01Icon} size={18} strokeWidth={1.5} /><input type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" /></span>
            {errors.email && <em className="form-error">{errors.email}</em>}
          </label>

          <div className="field">
            <span>Pictures <em>(optional, up to {MAX_FILES}, {MAX_MB} MB each)</em></span>
            <div className="contact-pics">
              {files.map((f, i) => (
                <div key={f.url} className="contact-pic">
                  <img src={f.url} alt={`Attached picture ${i + 1}`} />
                  <button type="button" aria-label={`Remove picture ${i + 1}`} onClick={() => removePicture(i)}><HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} /></button>
                </div>
              ))}
              {files.length < MAX_FILES && (
                <button type="button" className="contact-add" onClick={() => pick.current?.click()}
                  onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addPictures(e.dataTransfer.files); }}>
                  <HugeiconsIcon icon={ImageUploadIcon} size={24} strokeWidth={1.4} />
                  <span>Add a picture</span>
                </button>
              )}
            </div>
            <input ref={pick} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => addPictures(e.target.files)} />
            {picError && <em className="form-error">{picError}</em>}
          </div>
        </div>

        <div className="contact-col">
          <label className="field grow">What do you need?
            <textarea className={errors.requirement ? 'bad' : ''} rows={6} maxLength={2000} value={form.requirement} onChange={set('requirement')} placeholder="For example: a pallu design with peacocks and a zari border for a wedding saree." />
            {errors.requirement && <em className="form-error">{errors.requirement}</em>}
          </label>

          <label className="field"><span>Notes <em>(optional)</em></span>
            <textarea rows={4} maxLength={2000} value={form.notes} onChange={set('notes')} placeholder="Colours, size, deadline, budget, or anything else we should know." />
          </label>

          {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
          <button type="submit" className="btn-solid contact-send" disabled={busy}>{busy ? 'Sending…' : 'Send my work'}</button>
        </div>
      </form>
    </>
  );
}

// ---------------------------------------------------------------- packages

function PackageList({ packages, onChoose, busyId, user }) {
  const row = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  // the arrows are only live when there is more to see in that direction
  const measure = () => {
    const el = row.current;
    if (el) setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };
  useEffect(() => { measure(); window.addEventListener('resize', measure); return () => window.removeEventListener('resize', measure); }, [packages]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (dir) => row.current?.scrollBy({ left: dir * Math.min(row.current.clientWidth * 0.8, 640), behavior: 'smooth' });

  if (!packages) return <p className="designs-msg">Loading the packages…</p>;
  if (!packages.length) return <p className="designs-msg">Packages are coming soon. Please check back shortly.</p>;
  return (
    <section className="dpk-section" aria-label="Packages">
      <div className="dpk-bar">
        <span>{plural(packages.length, 'package')} · swipe or use the arrows</span>
        <span className="dpk-arrows">
          <button type="button" aria-label="Previous packages" disabled={edge.start} onClick={() => go(-1)}><HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={1.8} /></button>
          <button type="button" aria-label="Next packages" disabled={edge.end} onClick={() => go(1)}><HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={1.8} /></button>
        </span>
      </div>
      <div className="dpk-row" ref={row} onScroll={measure} tabIndex={0}>
        {packages.map((p) => (
          <article key={p.id} className={`dpk${p.is_popular ? ' popular' : ''}`}>
            <header className="dpk-head">
              {p.is_popular && <span className="dpk-badge">★ Most popular</span>}
              <div className="dpk-top">
                <h3>{p.name}</h3>
                {p.cost_percent < 100 && <span className="dpk-save">{100 - p.cost_percent}% less</span>}
              </div>
              {p.description && <p className="dpk-line">{p.description}</p>}
              <div className="dpk-price"><strong>{p.price === 0 ? 'Free' : money(p.price)}</strong><span>to join</span></div>
              <p className="dpk-cost">Work costs only <strong>{p.cost_percent}%</strong> of the normal price</p>
            </header>
            <div className="dpk-body">
              <ul className="dpk-facts">
                <li><HugeiconsIcon icon={Clock01Icon} size={20} strokeWidth={1.5} /><span><strong>{plural(p.delivery_days, 'day')}</strong> to finish each work</span></li>
                <li><HugeiconsIcon icon={Calendar03Icon} size={20} strokeWidth={1.5} /><span>Valid for <strong>{plural(p.validity_days, 'day')}</strong></span></li>
                <li><HugeiconsIcon icon={Task01Icon} size={20} strokeWidth={1.5} /><span>{p.max_requests ? <><strong>{plural(p.max_requests, 'work')}</strong> included</> : <><strong>Any number</strong> of works</>}</span></li>
              </ul>
              {p.details && <ul className="dpk-details">{p.details.split('\n').map((t) => t.trim()).filter(Boolean).map((t) => <li key={t}>{t}</li>)}</ul>}
              <button type="button" className="btn-solid" disabled={busyId !== null} onClick={() => onChoose(p)}>
                {busyId === p.id ? 'Opening payment…' : user ? `Choose ${p.name}` : 'Log in to choose'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ progress

const fileSize = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

function WorkFiles({ workId, files }) {
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState('');
  const get = async (f) => {
    setBusy(f.id); setErr('');
    try { await downloadWorkFile(workId, f); } catch (e) { setErr(e.message); } finally { setBusy(null); }
  };
  return (
    <div className="u-files">
      {files.map((f) => (
        <button key={f.id} type="button" className="u-file" onClick={() => get(f)} disabled={busy === f.id}>
          <span className="u-file-name">{f.name}</span><small>{fileSize(f.size)}</small><strong>{busy === f.id ? 'Downloading…' : 'Download'}</strong>
        </button>
      ))}
      {err && <span className="field-error">{err}</span>}
    </div>
  );
}

function MyWorks({ works }) {
  if (!works) return <p className="designs-msg">Loading your works…</p>;
  if (!works.length) return <p className="designs-msg">You have not sent any work yet. Use <strong>Give work</strong> to send your first one.</p>;
  return (
    <div className="works">
      {works.map((w) => {
        const at = STEPS.findIndex(([k]) => k === w.status);
        const late = w.status !== 'done' && w.due_date && new Date(`${w.due_date}T23:59:59`) < new Date();
        return (
          <article key={w.id} className="work">
            <header>
              <div>
                <h3>{w.requirement.length > 120 ? `${w.requirement.slice(0, 120)}…` : w.requirement}</h3>
                <p className="muted">Sent {day(w.created_at)}{w.package_name ? ` · ${w.package_name} package` : ''}</p>
              </div>
              <span className={`work-state s-${w.status}`}>{STEP_NAME[w.status]}</span>
            </header>

            <ol className="stepper" aria-label="Progress">
              {STEPS.map(([k, label], i) => (
                <li key={k} className={i < at ? 'past' : i === at ? 'now' : ''}><span className="dot">{i < at ? '✓' : i + 1}</span><span className="lbl">{label}</span></li>
              ))}
            </ol>

            <dl className="work-facts">
              {w.due_date && <div><dt>{w.status === 'done' ? 'Was due' : 'Due by'}</dt><dd className={late ? 'late' : ''}>{dueDay(w.due_date)}{late ? ' · running late' : ''}</dd></div>}
              {w.quoted_price != null && <div><dt>Your price</dt><dd>{money(w.quoted_price)}{w.cost_percent && w.cost_percent < 100 && w.normal_cost ? <small> ({w.cost_percent}% of {money(w.normal_cost)})</small> : null}</dd></div>}
              {w.image_count > 0 && <div><dt>Pictures</dt><dd>{w.image_count} sent</dd></div>}
            </dl>

            <ul className="updates">
              {[...w.updates].reverse().map((u, i) => (
                <li key={i}><span className="u-when">{day(u.created_at)}</span><strong>{STEP_NAME[u.status]}</strong>{u.message && <span className="u-msg">{u.message}</span>}{u.files?.length > 0 && <WorkFiles workId={w.id} files={u.files} />}</li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------------- page

export default function Contact({ user, onLogin, onSessionExpired }) {
  const [packages, setPackages] = useState(null);
  const [sub, setSub] = useState(undefined); // undefined = not known yet, null = no package
  const [works, setWorks] = useState(null);
  const [tab, setTab] = useState('give'); // give | works
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { fetchDesignPackages().then((r) => setPackages(r.data)).catch(() => setPackages([])); }, []);
  const loadSub = () => fetchDesignSubscription().then((r) => setSub(r.subscription)).catch((e) => { if (e.status === 401) onSessionExpired?.(); else setSub(null); });
  const loadWorks = () => fetchMyDesignWorks().then((r) => setWorks(r.data)).catch(() => setWorks([]));
  useEffect(() => { if (user) { setSub(undefined); loadSub(); loadWorks(); } else { setSub(null); setWorks(null); } }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function choose(p) {
    if (!user) return onLogin?.();
    setBusyId(p.id); setError('');
    try {
      const session = await startPackageCheckout(p.id);
      if (session.free) { await loadSub(); setBusyId(null); return; }
      await loadRazorpay();
      const rzp = new window.Razorpay({
        key: session.keyId, amount: session.amount, currency: session.currency, order_id: session.orderId,
        name: 'ThugilCreation', description: `${p.name} package`,
        prefill: { name: user.full_name || '', email: user.email || '', contact: user.phone || '' },
        theme: { color: '#751423' },
        modal: { ondismiss: () => setBusyId(null) },
        handler: async (r) => {
          try { await verifyPackagePayment(r); await loadSub(); setTab('give'); }
          catch (err) { setError(`${err.message} Payment id: ${r.razorpay_payment_id}`); }
          finally { setBusyId(null); }
        },
      });
      rzp.on('payment.failed', (r) => { setError(r?.error?.description || 'The payment failed. You have not been charged. Please try again.'); setBusyId(null); });
      rzp.open();
    } catch (err) {
      if (err.status === 401) { setBusyId(null); return onSessionExpired?.(); }
      if (err.status === 409) await loadSub();
      setError(err.message); setBusyId(null);
    }
  }

  const loading = user && sub === undefined;
  const subscribed = Boolean(user && sub);
  const left = sub && sub.max_requests ? Math.max(0, sub.max_requests - sub.used) : null;

  return (
    <main className={`contact-wrap${subscribed ? '' : ' wide'}`}>
      <header className="contact-head">
        <div className="contact-tags"><span className="eyebrow">Custom design work</span>{!subscribed && <span className="contact-save">Packages make the work cost less</span>}</div>
        <h1>{subscribed ? 'Contact our designer' : 'Choose a package'}</h1>
        <p>{subscribed ? 'Tell us what you need designed. Add a picture or two if it helps, and follow your work as it moves forward.' : 'Pick a package, then send your work to our designer. Each package sets how little the work costs and how quickly it is done.'}</p>
      </header>

      {loading && <p className="designs-msg">Loading your package…</p>}

      {!loading && !subscribed && (
        <>
          {error && <p className="form-error" role="alert">{error}</p>}
          {!user && <p className="dpk-login">You need to <button type="button" className="link" onClick={onLogin}>log in</button> to choose a package.</p>}
          <PackageList packages={packages} onChoose={choose} busyId={busyId} user={user} />
        </>
      )}

      {subscribed && (
        <>
          <div className="my-pkg">
            <div><strong>{sub.package_name}</strong> <span>package</span></div>
            <ul>
              <li>Work costs <strong>{sub.cost_percent}%</strong> of normal</li>
              <li><strong>{plural(sub.delivery_days, 'day')}</strong> to finish a work</li>
              <li>Valid until <strong>{day(sub.expires_at)}</strong></li>
              <li>{left === null ? 'Any number of works' : <><strong>{left}</strong> {left === 1 ? 'work' : 'works'} left</>}</li>
            </ul>
          </div>
          <div className="contact-tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'give'} className={tab === 'give' ? 'on' : ''} onClick={() => setTab('give')}>Give work</button>
            <button role="tab" aria-selected={tab === 'works'} className={tab === 'works' ? 'on' : ''} onClick={() => { setTab('works'); loadWorks(); }}>My works{works && works.length ? <span>{works.length}</span> : null}</button>
          </div>
          {tab === 'give' && <WorkForm user={user} onSent={() => { loadSub(); loadWorks(); }} onSessionExpired={onSessionExpired} />}
          {tab === 'works' && <MyWorks works={works} />}
        </>
      )}
    </main>
  );
}

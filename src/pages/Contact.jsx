import { useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ImageUploadIcon, Cancel01Icon, CheckmarkCircle02Icon, Call02Icon, Mail01Icon, UserIcon } from '@hugeicons/core-free-icons';
import { sendDesignRequest } from '../api';

const MAX_FILES = 2;
const MAX_MB = 5;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function Contact({ user }) {
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
    } catch (err) {
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
      <main className="contact-wrap">
        <div className="contact-done">
          <span className="done-tick"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={44} strokeWidth={1.5} /></span>
          <h1>Request sent</h1>
          <p>Thank you. Our designer has your requirement and will call or write to you soon. We also sent a copy to <strong>{form.email}</strong>.</p>
          <button type="button" className="btn-plain" onClick={again}>Send another request</button>
        </div>
      </main>
    );
  }

  return (
    <main className="contact-wrap">
      <header className="contact-head">
        <span className="eyebrow">Custom design work</span>
        <h1>Contact our designer</h1>
        <p>Tell us what you need designed. Add a picture or two if it helps, and our designer will get back to you.</p>
      </header>

      <form className="contact-form" onSubmit={submit} noValidate>
        <div className="contact-row">
          <label className="field">Your name
            <span className={`input-icon${errors.name ? ' bad' : ''}`}><HugeiconsIcon icon={UserIcon} size={18} strokeWidth={1.5} /><input value={form.name} onChange={set('name')} autoComplete="name" placeholder="Your full name" /></span>
            {errors.name && <em className="form-error">{errors.name}</em>}
          </label>
          <label className="field">Phone number
            <span className={`input-icon${errors.phone ? ' bad' : ''}`}><HugeiconsIcon icon={Call02Icon} size={18} strokeWidth={1.5} /><input value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" /></span>
            {errors.phone && <em className="form-error">{errors.phone}</em>}
          </label>
        </div>

        <label className="field">Email
          <span className={`input-icon${errors.email ? ' bad' : ''}`}><HugeiconsIcon icon={Mail01Icon} size={18} strokeWidth={1.5} /><input type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" /></span>
          {errors.email && <em className="form-error">{errors.email}</em>}
        </label>

        <label className="field">What do you need?
          <textarea className={errors.requirement ? 'bad' : ''} rows={5} maxLength={2000} value={form.requirement} onChange={set('requirement')} placeholder="For example: a pallu design with peacocks and a zari border for a wedding saree." />
          {errors.requirement && <em className="form-error">{errors.requirement}</em>}
        </label>

        <label className="field">Notes <em>(optional)</em>
          <textarea rows={3} maxLength={2000} value={form.notes} onChange={set('notes')} placeholder="Colours, size, deadline, budget, or anything else we should know." />
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
                <HugeiconsIcon icon={ImageUploadIcon} size={26} strokeWidth={1.4} />
                <span>Add a picture</span>
              </button>
            )}
          </div>
          <input ref={pick} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => addPictures(e.target.files)} />
          {picError && <em className="form-error">{picError}</em>}
        </div>

        {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
        <button type="submit" className="btn-solid contact-send" disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button>
      </form>
    </main>
  );
}

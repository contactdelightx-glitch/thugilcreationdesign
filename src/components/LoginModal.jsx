import { useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, ViewIcon, ViewOffIcon, Mail01Icon, LockPasswordIcon, SecurityCheckIcon } from '@hugeicons/core-free-icons';

const SILK = 'https://t3.ftcdn.net/jpg/08/08/13/98/360_F_808139829_zyuRecbyRip3TyTfSOvofAknOiLrRHAU.jpg';

export default function LoginModal({ onLogin, onClose, reason }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef(null);

  useEffect(() => {
    const prev = document.activeElement;
    emailRef.current?.focus();
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
    try { await onLogin(email.trim(), password); }
    catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <div className="modal-wrap">
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="modal login" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <aside className="login-brand" style={{ backgroundImage: `url(${SILK})` }}>
          <div className="login-shade" />
          <div className="login-brand-text">
            <strong>ThugilCreation</strong>
            <p>Handwoven silk sarees that blend timeless tradition with modern elegance.</p>
            <span>Crafting Tradition</span>
          </div>
        </aside>

        <form className="login-form" onSubmit={submit}>
          <button type="button" className="icon-close modal-x" aria-label="Close" onClick={onClose}><HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} /></button>
          <h2 id="login-title">Welcome back</h2>
          <p className="modal-sub">{reason || 'Log in to your ThugilCreation account.'}</p>

          <label className="field">
            <span>Email</span>
            <div className="input-icon">
              <HugeiconsIcon icon={Mail01Icon} size={18} strokeWidth={1.5} />
              <input ref={emailRef} type="email" placeholder="you@example.com" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </label>
          <label className="field">
            <span>Password</span>
            <div className="input-icon">
              <HugeiconsIcon icon={LockPasswordIcon} size={18} strokeWidth={1.5} />
              <input type={show ? 'text' : 'password'} placeholder="Your password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="pw-toggle" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} onClick={() => setShow((s) => !s)}>
                <HugeiconsIcon icon={show ? ViewOffIcon : ViewIcon} size={18} strokeWidth={1.5} />
              </button>
            </div>
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="btn-solid modal-submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
          <p className="login-secure"><HugeiconsIcon icon={SecurityCheckIcon} size={16} strokeWidth={1.5} /> Your details are sent securely.</p>
        </form>
      </div>
    </div>
  );
}

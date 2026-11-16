import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tick02Icon, Copy01Icon, PlayCircleIcon } from '@hugeicons/core-free-icons';
import { fetchEnrollment } from '../api';

const money = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const day = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export default function EnrolmentComplete({ enrollmentId, user, onNavigate, onLogin }) {
  const [state, setState] = useState({ loading: true, e: null, error: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    setState({ loading: true, e: null, error: '' });
    fetchEnrollment(enrollmentId)
      .then((e) => live && setState({ loading: false, e, error: '' }))
      .catch((err) => live && setState({ loading: false, e: null, error: err.status === 401 ? 'login' : err.status === 404 ? 'notfound' : err.message }));
    return () => { live = false; };
  }, [enrollmentId, user]);

  const { loading, e, error } = state;
  if (loading) return <main className="done-wrap"><div className="done-card" aria-busy="true"><div className="done-skel"><i /><i /><i /></div></div></main>;
  if (!e) {
    return (
      <main className="done-wrap">
        <div className="done-card">
          <h1>{error === 'login' ? 'Please log in' : error === 'notfound' ? 'We couldn’t find this enrolment' : 'Something went wrong'}</h1>
          <p className="done-sub">{error === 'login' ? 'Log in to see your enrolment.' : error === 'notfound' ? 'It may belong to another account.' : `Couldn’t load it (${error}).`}</p>
          <div className="done-actions">
            {error === 'login' && <button type="button" className="btn-solid" onClick={onLogin}>Log in</button>}
            <button type="button" className="btn-line" onClick={() => onNavigate('Courses')}>Browse courses</button>
          </div>
        </div>
      </main>
    );
  }

  const copy = async () => { try { await navigator.clipboard.writeText(e.payment_id); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ } };

  return (
    <main className="done-wrap">
      <div className="done-single">
        <span className="done-tick" aria-hidden="true"><HugeiconsIcon icon={Tick02Icon} size={34} strokeWidth={2.2} /></span>
        <h1>Enrolment complete</h1>
        <p className="done-sub">Thank you{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! Your payment was successful and you can start learning right away.</p>

        <dl className="done-meta">
          <div><dt>Course</dt><dd>{e.course_title}</dd></div>
          <div><dt>Package</dt><dd>{e.package}</dd></div>
          <div><dt>Amount paid</dt><dd>{money(e.amount)}</dd></div>
          {e.expires_at && <div><dt>Access until</dt><dd>{day(e.expires_at)}</dd></div>}
          <div><dt>Payment ID</dt><dd className="mono">{e.payment_id}<button type="button" className="copy-btn" onClick={copy} aria-label="Copy payment ID" title="Copy payment ID"><HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={15} strokeWidth={1.8} /></button></dd></div>
        </dl>

        <div className="done-actions">
          <button type="button" className="btn-solid start-btn" onClick={() => onNavigate('Learn', e.course_id)}>
            <HugeiconsIcon icon={PlayCircleIcon} size={20} strokeWidth={1.7} /> Start learning
          </button>
        </div>
      </div>
    </main>
  );
}

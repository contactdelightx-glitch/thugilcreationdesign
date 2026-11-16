import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tick02Icon, Copy01Icon } from '@hugeicons/core-free-icons';
import { fetchOrder } from '../api';

const money = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const when = (iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function PurchaseComplete({ orderId, user, onNavigate, onLogin }) {
  const [state, setState] = useState({ loading: true, order: null, error: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    setState({ loading: true, order: null, error: '' });
    fetchOrder(orderId)
      .then((order) => live && setState({ loading: false, order, error: '' }))
      .catch((e) => live && setState({ loading: false, order: null, error: e.status === 401 ? 'login' : e.status === 404 ? 'notfound' : e.message }));
    return () => { live = false; };
  }, [orderId, user]);

  const { loading, order, error } = state;

  if (loading) return <main className="done-wrap"><div className="done-card" aria-busy="true"><div className="done-skel"><i /><i /><i /></div></div></main>;

  if (!order) {
    return (
      <main className="done-wrap">
        <div className="done-card">
          <h1>{error === 'login' ? 'Please log in' : error === 'notfound' ? 'We couldn’t find this order' : 'Something went wrong'}</h1>
          <p className="done-sub">
            {error === 'login' ? 'Log in to see your order.' : error === 'notfound' ? 'It may belong to another account.' : `Couldn’t load the order (${error}).`}
          </p>
          <div className="done-actions">
            {error === 'login' && <button type="button" className="btn-solid" onClick={onLogin}>Log in</button>}
            <button type="button" className="btn-line" onClick={() => onNavigate('Designs', 'all')}>Browse designs</button>
          </div>
        </div>
      </main>
    );
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(order.payment_id); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  };

  return (
    <main className="done-wrap">
      <div className="done-single">
        <section className="done-left">
          <span className="done-tick" aria-hidden="true"><HugeiconsIcon icon={Tick02Icon} size={34} strokeWidth={2.2} /></span>
          <h1>Purchase complete</h1>
          <p className="done-sub">Thank you{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! Your payment was successful and your order is confirmed.</p>

          <dl className="done-meta">
            <div><dt>Order number</dt><dd>#{order.id}</dd></div>
            <div><dt>Date</dt><dd>{when(order.created_at)}</dd></div>
            <div><dt>Payment ID</dt><dd className="mono">{order.payment_id}<button type="button" className="copy-btn" onClick={copy} aria-label="Copy payment ID" title="Copy payment ID"><HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={15} strokeWidth={1.8} /></button></dd></div>
          </dl>

          <div className="done-actions">
            <button type="button" className="btn-solid" onClick={() => onNavigate('Purchases')}>View my purchases</button>
            <button type="button" className="btn-line" onClick={() => onNavigate('Designs', 'all')}>Continue browsing</button>
          </div>
        </section>

      </div>
    </main>
  );
}

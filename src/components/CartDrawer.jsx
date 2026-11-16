import { useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, ShoppingCart01Icon } from '@hugeicons/core-free-icons';
import { startCheckout, verifyPayment, loadRazorpay } from '../api';

const money = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function CartDrawer({ items, cart, user, onPaid, onNeedLogin, onSessionExpired, onClose, onBrowse }) {
  const closeRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const onRemove = cart.remove;

  useEffect(() => {
    const prev = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [onClose]);

  const total = items.reduce((n, i) => n + Number(i.final_price), 0);
  const listed = items.reduce((n, i) => n + Math.max(Number(i.listing_rate ?? i.final_price), Number(i.final_price)), 0);
  const saved = listed - total;

  async function checkout() {
    if (!user) return onNeedLogin();
    setBusy(true);
    setError('');
    try {
      await loadRazorpay();
      const session = await startCheckout(items);
      const rzp = new window.Razorpay({
        key: session.keyId,
        amount: session.amount,
        currency: session.currency,
        order_id: session.orderId,
        name: 'ThugilCreation',
        description: `${items.length} ${items.length === 1 ? 'design' : 'designs'}`,
        prefill: { name: user.full_name || '', email: user.email || '', contact: user.phone || '' },
        theme: { color: '#751423' },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (r) => {
          try {
            const done = await verifyPayment(r);
            cart.clear();
            onPaid(done.orderId);
          } catch (err) {
            setError(`${err.message} Payment id: ${r.razorpay_payment_id}`);
          } finally { setBusy(false); }
        },
      });
      rzp.on('payment.failed', (r) => { setError(r?.error?.description || 'The payment failed. You have not been charged. Please try again.'); setBusy(false); });
      rzp.open();
    } catch (err) {
      if (err.status === 401) return onSessionExpired();
      if (err.status === 409 && err.data?.already) cart.removeMany(err.data.already);
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="sheet-wrap">
      <div className="sheet-backdrop" onClick={onClose} />
      <aside className="sheet" role="dialog" aria-modal="true" aria-label="Your cart">
        <header className="sheet-head">
          <span className="cart-title">Your cart {items.length > 0 && <em>{items.length}</em>}</span>
          <button ref={closeRef} type="button" className="icon-close" aria-label="Close" onClick={onClose}><HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} /></button>
        </header>

        {items.length === 0 ? (
          <div className="sheet-body cart-empty">
            <span className="cart-empty-icon"><HugeiconsIcon icon={ShoppingCart01Icon} size={34} strokeWidth={1.3} /></span>
            <strong>Your cart is empty</strong>
            <p>Designs you add will show up here.</p>
            <button type="button" className="btn-solid" onClick={onBrowse}>Browse designs</button>
          </div>
        ) : (
          <>
            <ul className="sheet-body cart-list">
              {items.map((i) => {
                const free = Number(i.final_price) === 0;
                const onSale = i.listing_rate !== undefined && Number(i.listing_rate) > Number(i.final_price) && !free;
                return (
                  <li key={`${i.category}-${i.id}`}>
                    <img src={i.image_url} alt="" referrerPolicy="no-referrer" />
                    <div className="cart-main">
                      <div className="cart-row">
                        <strong>{i.name || 'Free design'}</strong>
                        <div className="cart-money">
                          <strong>{free ? 'Free' : money(i.final_price)}</strong>
                          {onSale && <s>{money(i.listing_rate)}</s>}
                        </div>
                      </div>
                      <span className="cart-style">{i.styleName}</span>
                      {i.specs && i.specs.length > 0 && <p className="cart-specs">{i.specs.join(' · ')}</p>}
                      <button type="button" className="cart-remove" onClick={() => onRemove(i)}>Remove</button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <footer className="sheet-foot cart-foot">
              <dl className="cart-sums">
                {saved > 0 && <div><dt>Subtotal</dt><dd>{money(listed)}</dd></div>}
                {saved > 0 && <div className="saving"><dt>You save</dt><dd>− {money(saved)}</dd></div>}
                <div className="grand"><dt>Total</dt><dd>{money(total)}</dd></div>
              </dl>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button type="button" className="btn-solid" disabled={busy} onClick={checkout}>{busy ? 'Opening payment…' : user ? `Pay ${money(total)}` : 'Log in to pay'}</button>
              <small>Secure payment with Razorpay. You receive the full design files after payment.</small>
              <button type="button" className="btn-plain" onClick={onBrowse}>Continue browsing</button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

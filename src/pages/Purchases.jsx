import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download04Icon, StarIcon } from '@hugeicons/core-free-icons';
import ReviewModal from '../components/ReviewModal';
import { fetchPurchases, downloadPurchase } from '../api';

const day = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function Item({ d: initial }) {
  const [d, setD] = useState(initial);
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function download() {
    setBusy(true);
    setError('');
    try { await downloadPurchase(d.item_id, `${d.name}.bmp`); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return (
    <article className="own">
      <div className="own-img"><img src={d.image_url} alt={d.name} loading="lazy" referrerPolicy="no-referrer" /></div>
      <div className="own-bar">
        <p className="own-meta"><span>Order #{d.order_id}</span><span>{day(d.purchased_at)}</span></p>
        <button type="button" className="own-review" onClick={() => setReviewing(true)}>
          {d.my_rating ? (
            <>
              <span className="mini-stars" aria-label={`You rated ${d.my_rating} out of 5`}>{[1, 2, 3, 4, 5].map((n) => <HugeiconsIcon key={n} icon={StarIcon} size={15} strokeWidth={1.4} className={n <= d.my_rating ? 'on' : ''} />)}</span>
              <span>Edit review</span>
            </>
          ) : (
            <><HugeiconsIcon icon={StarIcon} size={16} strokeWidth={1.5} /> Write a review</>
          )}
        </button>
        <button type="button" className="own-btn" onClick={download} disabled={busy}>
          <HugeiconsIcon icon={Download04Icon} size={18} strokeWidth={1.7} /> {busy ? 'Downloading…' : d.files > 1 ? `Download all ${d.files} files` : 'Download'}
        </button>
        {error && <p className="own-error" role="alert">{error}</p>}
      </div>
      {reviewing && <ReviewModal item={d} onClose={() => setReviewing(false)} onSaved={(r) => { setD((x) => ({ ...x, my_rating: r.rating, my_review: r.review })); setReviewing(false); }} />}
    </article>
  );
}

export default function Purchases({ user, onNavigate, onLogin }) {
  const [state, setState] = useState({ loading: true, items: [], error: '' });

  useEffect(() => {
    if (!user) { setState({ loading: false, items: [], error: 'login' }); return undefined; }
    let live = true;
    setState({ loading: true, items: [], error: '' });
    fetchPurchases()
      .then((r) => live && setState({ loading: false, items: r.data, error: '' }))
      .catch((e) => live && setState({ loading: false, items: [], error: e.status === 401 ? 'login' : e.message }));
    return () => { live = false; };
  }, [user]);

  const { loading, items, error } = state;

  return (
    <main className="purch-wrap">
      <h1 className="purch-title">My purchases</h1>

      {error === 'login' && (
        <div className="designs-msg">
          <p>Log in to see the designs you have bought.</p>
          <button type="button" className="btn-solid purch-btn" onClick={onLogin}>Log in</button>
        </div>
      )}
      {error && error !== 'login' && <p className="designs-msg error">Couldn’t load your purchases ({error}). Please try again.</p>}
      {!loading && !error && items.length === 0 && (
        <div className="designs-msg">
          <p>You haven’t bought any designs yet.</p>
          <button type="button" className="btn-solid purch-btn" onClick={() => onNavigate('Designs', 'all')}>Browse designs</button>
        </div>
      )}

      <div className="own-grid">
        {loading && Array.from({ length: 5 }, (_, i) => <div key={i} className="own skeleton" aria-hidden="true" />)}
        {items.map((d) => <Item key={d.item_id} d={d} />)}
      </div>
    </main>
  );
}

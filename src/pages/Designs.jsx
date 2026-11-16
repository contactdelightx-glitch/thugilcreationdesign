import { useCallback, useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, ArrowRight01Icon, ShoppingCart01Icon, Tick02Icon, Download04Icon } from '@hugeicons/core-free-icons';
import { fetchDesigns, fetchStyles, freeDownloadUrl } from '../api';
import DesignSheet, { STYLE_NAME, specTags } from '../components/DesignSheet';

const LIMIT = 12;
const money = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const LABEL = { new: 'New', sale: 'Sale', featured: 'Featured' };

// A design card: the picture on top, then the number, price, loom details and the two buttons
function DesignCard({ d, showStyle, inCart, onView, onAdd }) {
  const onSale = Number(d.listing_rate) > Number(d.final_price);
  const free = Number(d.final_price) === 0;
  const specs = specTags(d);
  return (
    <article className="design-card">
      <div className="design-img">
        <img src={d.image_url} alt={d.name || 'Free design'} loading="lazy" referrerPolicy="no-referrer" />
        {d.label && <span className={`design-tag ${d.label}`}>{LABEL[d.label]}</span>}
      </div>
      <div className="design-info">
        <div className="design-top">
          <div className="design-name">
            <h3>{d.name || 'Free design'}</h3>
            {showStyle && <span>{STYLE_NAME[d.category]}</span>}
          </div>
          <div className="design-price">
            <strong>{free ? 'Free' : money(d.final_price)}</strong>
            {onSale && !free && <s>{money(d.listing_rate)}</s>}
          </div>
        </div>
        {specs.length > 0 && <ul className="design-specs">{specs.map((t) => <li key={t}>{t}</li>)}</ul>}
        <div className="design-actions">
          {d.category === 'free_image' ? (
            <a className="btn-solid" href={freeDownloadUrl(d.id)} download><HugeiconsIcon icon={Download04Icon} size={18} strokeWidth={1.7} />Download</a>
          ) : (
            <button type="button" className="btn-solid" onClick={onAdd} disabled={inCart} aria-label={inCart ? 'In cart' : `Add ${d.name || 'design'} to cart`}>
              <HugeiconsIcon icon={inCart ? Tick02Icon : ShoppingCart01Icon} size={18} strokeWidth={1.7} />{inCart ? 'In cart' : 'Add to cart'}
            </button>
          )}
          <button type="button" className="design-go" onClick={onView} aria-label={`View details of ${d.name || 'free design'}`} title="View details">
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={2} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Designs({ category, onNavigate, cart, onOpenCart }) {
  const [viewing, setViewing] = useState(null);
  const closeSheet = useCallback(() => setViewing(null), []);
  const active = !category || category === 'all' ? 'butta' : category; // there is no "All" tab: the page opens on the first style
  const [styles, setStyles] = useState([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [state, setState] = useState({ items: [], total: 0, hasMore: false, loading: true, error: '' });
  const loadingMore = useRef(false);
  const sentinel = useRef(null);

  useEffect(() => { fetchStyles().then(setStyles).catch(() => {}); }, []);
  useEffect(() => { setSearch(''); setQuery(''); }, [active]); // a new style starts without the old search
  useEffect(() => { const t = setTimeout(() => setQuery(search.trim()), 300); return () => clearTimeout(t); }, [search]);

  const known = active === 'all' || styles.length === 0 || styles.some((s) => s.key === active);
  const title = active === 'all' ? 'All Designs' : styles.find((s) => s.key === active)?.label || active.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase());

  // a new style or search starts the list again
  useEffect(() => {
    if (!known) { setState({ items: [], total: 0, hasMore: false, loading: false, error: '' }); return undefined; }
    const ctrl = new AbortController();
    loadingMore.current = false;
    setState({ items: [], total: 0, hasMore: false, loading: true, error: '' });
    fetchDesigns({ category: active, search: query, offset: 0, limit: LIMIT, signal: ctrl.signal })
      .then((r) => setState({ items: r.data, total: r.total, hasMore: r.hasMore, loading: false, error: '' }))
      .catch((e) => e.name !== 'AbortError' && setState((s) => ({ ...s, loading: false, error: e.message })));
    return () => ctrl.abort();
  }, [active, query, known]);

  const loadMore = useCallback(() => {
    if (loadingMore.current || !state.hasMore || state.loading) return;
    loadingMore.current = true;
    fetchDesigns({ category: active, search: query, offset: state.items.length, limit: LIMIT })
      .then((r) => setState((s) => ({ ...s, items: [...s.items, ...r.data.filter((d) => !s.items.some((x) => x.id === d.id && x.category === d.category))], total: r.total, hasMore: r.hasMore })))
      .catch((e) => setState((s) => ({ ...s, error: e.message })))
      .finally(() => { loadingMore.current = false; });
  }, [active, query, state.hasMore, state.loading, state.items.length]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return undefined;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadMore(), { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <main className="designs-page">
      <header className="designs-head">
        <div>
          <span className="eyebrow">Collections</span>
          <h1>{title}</h1>
          {!state.loading && known && <p>{state.total} {state.total === 1 ? 'design' : 'designs'}{query ? ` matching “${query}”` : ''}</p>}
        </div>
        <label className="designs-search">
          <HugeiconsIcon icon={Search01Icon} size={18} strokeWidth={1.5} />
          <input type="search" placeholder="Search by name or code" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search designs" />
        </label>
      </header>

      <div className="style-tabs" role="tablist" aria-label="Saree style">
        {styles.map((s) => (
          <button key={s.key} type="button" role="tab" aria-selected={active === s.key} className={active === s.key ? 'on' : ''} onClick={() => onNavigate('Designs', s.key)}>
            {s.label} <span>{s.count}</span>
          </button>
        ))}
      </div>

      {state.error && <p className="designs-msg error">Couldn’t load the designs ({state.error}). Please try again.</p>}
      {!known && (
        <div className="designs-msg">
          <p>Designs for {title} are coming soon.</p>
          <button type="button" className="text-link" onClick={() => onNavigate('Designs', 'all')}>Browse designs</button>
        </div>
      )}
      {known && !state.loading && !state.error && state.items.length === 0 && <p className="designs-msg">No designs found{query ? ` for “${query}”` : ' in this style yet'}.</p>}

      <div className="design-grid">
        {state.loading && Array.from({ length: 8 }, (_, i) => <div key={i} className="design-card skeleton" aria-hidden="true"><div className="design-img" /><div className="design-info"><i /><i /></div></div>)}
        {state.items.map((d) => <DesignCard key={`${d.category}-${d.id}`} d={d} showStyle={false} inCart={cart.has(d)} onView={() => setViewing(d)} onAdd={() => cart.add(d)} />)}
      </div>
      <div ref={sentinel} className="designs-end">{state.hasMore ? 'Loading more…' : state.items.length > 0 ? 'You’ve seen every design' : ''}</div>
      {viewing && (
        <DesignSheet design={viewing} inCart={cart.has(viewing)} onAdd={() => cart.add(viewing)} onRemove={() => cart.remove(viewing)} onClose={closeSheet} onOpenCart={() => { setViewing(null); onOpenCart(); }} />
      )}
    </main>
  );
}

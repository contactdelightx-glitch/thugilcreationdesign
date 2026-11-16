import { useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, ShoppingCart01Icon, Tick02Icon, Download04Icon } from '@hugeicons/core-free-icons';
import { freeDownloadUrl } from '../api';

const money = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const tidy = (v) => String(v).toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
export const STYLE_NAME = { butta: 'Butta', pattern: 'Pattern', full_set: 'Full Set', brocade: 'Brocade', pallu: 'Pallu', border: 'Border', free_image: 'Free Image' };
// what a buyer checks before choosing a design: the loom details, only those the design has, as short tags
export function specTags(d) {
  const n = (v, word) => (v !== null && v !== undefined && v !== '' ? `${v} ${word}` : null);
  const tags = d.category === 'full_set'
    ? [d.jacquard_type && `${tidy(d.jacquard_type)} jacquard`, n(d.ppi, 'PPI'), n(d.body_epi, 'body EPI'), n(d.border_epi, 'border EPI'), d.br_hooks && `BR ${d.br_hooks}`, d.by_hooks && `BY ${d.by_hooks}`]
    : [n(d.cards, 'cards'), n(d.hooks, 'hooks'), n(d.epi, 'EPI'), n(d.ppi, 'PPI'), d.harness_build && tidy(d.harness_build)];
  return tags.filter(Boolean);
}

// the four headline numbers for a card (value + label) and one line of extra detail
export function specStats(d) {
  const pick = (rows) => rows.filter(([v]) => v !== null && v !== undefined && v !== '');
  if (d.category === 'full_set') {
    return { stats: pick([[d.ppi, 'PPI'], [d.body_epi, 'Body EPI'], [d.border_epi, 'Border EPI']]), note: d.jacquard_type ? `${tidy(d.jacquard_type)} jacquard` : '' };
  }
  return { stats: pick([[d.cards, 'Cards'], [d.hooks, 'Hooks'], [d.epi, 'EPI'], [d.ppi, 'PPI']]), note: d.harness_build ? `${tidy(d.harness_build)} harness` : '' };
}

export const STYLE_NOTE = {
  all: 'Every design in our library, newest first. Pick a style below to narrow it down.',
  butta: 'Small motifs scattered across the body of the saree.',
  pattern: 'Repeating designs that run across the whole cloth.',
  full_set: 'Body, border and pallu designed together as one set.',
  brocade: 'Rich woven zari work with a royal finish.',
  pallu: 'The decorative end of the saree, the part that drapes over the shoulder.',
  border: 'Woven edges that frame the saree.',
  free_image: 'Free designs you can use.',
};
const LABEL = { new: 'New', sale: 'Sale', featured: 'Featured' };

// every detail a buyer may want, only those this design has
export function detailRows(d) {
  const rows = d.category === 'full_set'
    ? [['Jacquard type', d.jacquard_type && tidy(d.jacquard_type)], ['PPI', d.ppi], ['Body EPI', d.body_epi], ['Border EPI', d.border_epi], ['BR hooks', d.br_hooks], ['BY hooks', d.by_hooks]]
    : [['Cards', d.cards], ['Hooks', d.hooks], ['EPI', d.epi], ['PPI', d.ppi], ['Harness build', d.harness_build && tidy(d.harness_build)]];
  rows.push(['Image file type', d.image_type]);
  return rows.filter(([, v]) => v !== null && v !== undefined && v !== '');
}

export default function DesignSheet({ design: d, inCart, onAdd, onRemove, onClose, onOpenCart }) {
  const closeRef = useRef(null);
  const [shown, setShown] = useState(0); // which picture of the design is on show

  useEffect(() => {
    const prev = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // the page behind should not scroll
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [onClose]);

  const free = Number(d.final_price) === 0;
  const onSale = Number(d.listing_rate) > Number(d.final_price) && !free;
  const off = onSale ? Math.round(((d.listing_rate - d.final_price) / d.listing_rate) * 100) : 0;
  const rows = detailRows(d);
  const added = d.created_at ? new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  return (
    <div className="modal-wrap">
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="modal detail-modal" role="dialog" aria-modal="true" aria-label={`${d.name || 'Free design'} details`}>
        <button ref={closeRef} type="button" className="icon-close modal-x" aria-label="Close" onClick={onClose}><HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} /></button>

        <div className="detail-media">
          <div className="sheet-img">
            <img src={(d.images && d.images[shown]) || d.image_url} alt={d.name || 'Free design'} referrerPolicy="no-referrer" />
            {d.label && <span className={`design-tag ${d.label}`}>{LABEL[d.label]}</span>}
          </div>
          {d.images && d.images.length > 1 && (
            <div className="thumbs" aria-label="Pictures of this design">
              {d.images.map((src, i) => (
                <button key={src} type="button" className={i === shown ? 'on' : ''} onClick={() => setShown(i)} aria-label={`Picture ${i + 1} of ${d.images.length}`}>
                  <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-side">
          <div className="sheet-body">
            <div className="sheet-title">
              <span className="design-style">{STYLE_NAME[d.category]}</span>
              <h2>{d.name || 'Free design'}</h2>
              <div className="sheet-price">
                <strong>{free ? 'Free' : money(d.final_price)}</strong>
                {onSale && <><s>{money(d.listing_rate)}</s><em>{off}% off</em></>}
              </div>
            </div>

            {rows.length > 0 && (
              <section>
                <h3>Specifications</h3>
                <dl className="sheet-specs">
                  {rows.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
                </dl>
              </section>
            )}

            <section>
              <h3>About this design</h3>
              <dl className="sheet-specs">
                <div><dt>Style</dt><dd>{STYLE_NAME[d.category]}</dd></div>
                <div><dt>Design number</dt><dd>{d.name || '—'}</dd></div>
                {d.label && <div><dt>Tag</dt><dd>{LABEL[d.label]}</dd></div>}
                {added && <div><dt>Added on</dt><dd>{added}</dd></div>}
              </dl>
              <p className="sheet-note">{d.category === 'free_image' ? 'This design is free. Download it with the button below.' : 'The image shown is a preview. You receive the full design file after purchase.'}</p>
            </section>
          </div>

          <footer className="sheet-foot">
            {d.category === 'free_image' ? (
              <a className="btn-solid" href={freeDownloadUrl(d.id)} download><HugeiconsIcon icon={Download04Icon} size={18} strokeWidth={1.6} /> Download for free</a>
            ) : inCart ? (
              <>
                <button type="button" className="btn-solid" onClick={onOpenCart}><HugeiconsIcon icon={Tick02Icon} size={18} strokeWidth={1.8} /> In your cart · View cart</button>
                <button type="button" className="btn-plain" onClick={onRemove}>Remove</button>
              </>
            ) : (
              <button type="button" className="btn-solid" onClick={onAdd}><HugeiconsIcon icon={ShoppingCart01Icon} size={18} strokeWidth={1.5} /> Add to cart · {free ? 'Free' : money(d.final_price)}</button>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}

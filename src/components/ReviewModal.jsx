import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { StarIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { saveReview } from '../api';

const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

export default function ReviewModal({ item, onSaved, onClose }) {
  const [rating, setRating] = useState(item.my_rating || 0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState(item.my_review || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const firstRef = useRef(null);

  useEffect(() => {
    const prev = document.activeElement;
    firstRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    if (!rating) { setError('Please choose a star rating.'); return; }
    setBusy(true);
    setError('');
    try {
      const saved = await saveReview(item.item_id, rating, text.trim());
      onSaved(saved);
    } catch (err) { setError(err.message); setBusy(false); }
  }

  const shown = hover || rating;
  // drawn on the page itself, not inside the card (a card clips and moves what is inside it)
  return createPortal(
    <div className="modal-wrap">
      <div className="sheet-backdrop" onClick={onClose} />
      <form className="modal review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title" onSubmit={submit}>
        <button type="button" className="icon-close modal-x" aria-label="Close" onClick={onClose}><HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} /></button>
        <div className="review-head">
          <img src={item.image_url} alt="" referrerPolicy="no-referrer" />
          <div>
            <h2 id="review-title">{item.my_rating ? 'Edit your review' : 'Write a review'}</h2>
            <p>{item.name}</p>
          </div>
        </div>

        <div className="star-pick" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} ref={n === 1 ? firstRef : null} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
              className={n <= shown ? 'on' : ''} onMouseEnter={() => setHover(n)} onClick={() => { setRating(n); setError(''); }}>
              <HugeiconsIcon icon={StarIcon} size={34} strokeWidth={1.4} />
            </button>
          ))}
          <span className="star-word">{WORDS[shown]}</span>
        </div>

        <label className="field">
          <span>Your review <em>(optional)</em></span>
          <textarea className="review-text" rows={5} maxLength={1000} placeholder="What did you like about this design?" value={text} onChange={(e) => setText(e.target.value)} />
          <small className="review-count">{text.length}/1000</small>
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="review-actions">
          <button type="button" className="btn-line" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-solid" disabled={busy}>{busy ? 'Saving…' : item.my_rating ? 'Save changes' : 'Submit review'}</button>
        </div>
      </form>
    </div>,
    document.body
  );
}

import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';

// The saree styles a customer can browse. Each card opens the Designs page.
const STYLES = [
  { key: 'butta', label: 'Butta', note: 'Small motifs scattered across the body', image: 'https://5.imimg.com/data5/SELLER/Default/2021/5/NB/DR/ON/98485222/whatsapp-image-2021-05-05-at-10-29-27-am-2--1000x1000.jpeg' },
  { key: 'pattern', label: 'Pattern', note: 'Repeating designs for the whole cloth', image: 'https://img.magnific.com/free-vector/floral-pattern-design_1271-76.jpg?semt=ais_hybrid&w=740&q=80' },
  { key: 'full_set', label: 'Full Set', note: 'Body, border and pallu together', image: 'https://priyaodisha.com/cdn/shop/files/IMG_5569.jpg?v=1708782438&width=1080' },
  { key: 'brocade', label: 'Brocade', note: 'Rich woven zari work', image: 'https://www.sanskrutistore.com/cdn/shop/products/BanarasiBrocadePurpleWithGoldZariAllOverSmallFlowerBudJaalWovenFabric1-min.jpg?v=1679726419' },
  { key: 'pallu', label: 'Pallu', note: 'The decorative end of the saree', image: 'https://rukminim2.flixcart.com/image/480/640/ky7lci80/sari/s/s/v/free-radikajaal-offwhiteranii-kanjiqueen-unstitched-original-imagahrjcpxxs8gq.jpeg?q=90' },
  { key: 'border', label: 'Border', note: 'Woven edges that frame the saree', image: 'https://t4.ftcdn.net/jpg/08/27/22/07/360_F_827220796_mXrTTYh7jlYoycgLZFgX4f48VzAvYtIw.jpg' },
  { key: 'emboss', label: 'Emboss', note: 'Raised, textured motifs', image: 'https://thesudeshiweaving.com/cdn/shop/files/111027_collctn.jpg?v=1721715220' },
  { key: 'free_image', label: 'Free Image', note: 'Free designs to use', image: 'https://rukminim2.flixcart.com/image/480/580/kqwobrk0/sari/w/n/p/free-karishma-13-en-creation-unstitched-original-imag4t7vbbd4yrt3.jpeg?q=90' },
];

export default function StyleCatalog({ onNavigate }) {
  return (
    <section className="styles-section" aria-labelledby="styles-title">
      <div className="section-head">
        <div>
          <span className="eyebrow">Shop by style</span>
          <h2 id="styles-title">Saree Styles</h2>
          <p>Choose a style to see the designs available in it.</p>
        </div>
        <button type="button" className="text-link" onClick={() => onNavigate('Designs')}>
          Browse designs <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={1.5} />
        </button>
      </div>
      <ul className="style-grid">
        {STYLES.map((s) => (
          <li key={s.key}>
            <button type="button" className="style-card" onClick={() => onNavigate('Designs', s.key)}>
              <span className="style-img">
                <img src={s.image} alt="" loading="lazy" referrerPolicy="no-referrer" />
              </span>
              <span className="style-info">
                <span className="style-text">
                  <strong>{s.label}</strong>
                  <small>{s.note}</small>
                </span>
                <span className="style-arrow" aria-hidden="true"><HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={1.5} /></span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

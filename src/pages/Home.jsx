import StyleCatalog from '../components/StyleCatalog';
import SareeDesign from '../components/SareeDesign';
import Discover from '../components/Discover';

const BANNER = 'https://t3.ftcdn.net/jpg/08/08/13/98/360_F_808139829_zyuRecbyRip3TyTfSOvofAknOiLrRHAU.jpg';

export default function Home({ onNavigate }) {
  return (
    <>
      <section className="hero" style={{ backgroundImage: `url(${BANNER})` }}>
        <div className="hero-shade" />
        <div className="hero-content">
          <h1>Heritage</h1>
          <p>
            Explore handloomed sarees that fuse modern style with timeless craftsmanship, offering luxury and sophistication
            for the heritage-loving woman. Discover the perfect blend of classic beauty and contemporary design in our premium silk collection.
          </p>
          <button type="button" className="hero-btn" onClick={() => onNavigate('Designs')}>Explore Collection</button>
        </div>
      </section>
      <StyleCatalog onNavigate={onNavigate} />
      <SareeDesign />
      <Discover />
    </>
  );
}

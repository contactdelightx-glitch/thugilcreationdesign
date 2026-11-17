import { HugeiconsIcon } from '@hugeicons/react';
import { InstagramIcon, Facebook01Icon, YoutubeIcon, Mail01Icon, Call02Icon, Location01Icon } from '@hugeicons/core-free-icons';

const SOCIAL = [
  { label: 'Instagram', icon: InstagramIcon, href: 'https://www.instagram.com/thugil_creation29/?hl=en' },
  { label: 'Facebook', icon: Facebook01Icon, href: 'https://www.facebook.com/thugilcreation29/about' },
  { label: 'YouTube', icon: YoutubeIcon, href: 'https://www.youtube.com/c/THUGILCREATION' },
];
const PAYMENTS = ['Google Pay', 'Paytm', 'PhonePe'];

export default function Footer({ onNavigate }) {
  const go = (page) => (e) => { e.preventDefault(); onNavigate(page); };
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col about">
          <h3>About Us</h3>
          <p>At Thugil Creations, we specialize in creating exquisite, handwoven silk sarees that blend timeless tradition with modern elegance.</p>
          <a className="footer-more" href="#Home" onClick={go('Home')}>Learn More</a>
          <div className="social">
            {SOCIAL.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                <HugeiconsIcon icon={s.icon} size={20} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        <div className="footer-col">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#Home" onClick={go('Home')}>Home</a></li>
            <li><a href="#Designs" onClick={go('Designs')}>Collections</a></li>
            <li><a href="#Purchases" onClick={go('Purchases')}>Purchases</a></li>
            <li><a href="#Contact" onClick={go('Contact')}>Contact Designer</a></li>
            <li><a href="#Terms" onClick={go('Terms')}>Terms &amp; Conditions</a></li>
          </ul>
        </div>

        <div className="footer-col" id="contact">
          <h3>Contact Us</h3>
          <ul className="contact">
            <li>
              <HugeiconsIcon icon={Mail01Icon} size={18} strokeWidth={1.5} />
              <span><a href="mailto:thugilcreation@gmail.com">thugilcreation@gmail.com</a></span>
            </li>
            <li>
              <HugeiconsIcon icon={Call02Icon} size={18} strokeWidth={1.5} />
              <span><a href="tel:+918838008499">+91 8838008499</a><br /><a href="tel:+919994266271">+91 9994266271</a></span>
            </li>
            <li>
              <HugeiconsIcon icon={Location01Icon} size={18} strokeWidth={1.5} />
              <span>Kondalampatty, Salem<br />TamilNadu</span>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>Payment Methods</h3>
          <ul className="payments">
            {PAYMENTS.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-bottom-inner">© {new Date().getFullYear()} ThugilCreation. All rights reserved.</div>
      </div>
    </footer>
  );
}

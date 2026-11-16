import { HugeiconsIcon } from '@hugeicons/react';
import { Mail01Icon, Call02Icon, Location01Icon } from '@hugeicons/core-free-icons';

// Based on the policy text on thugilcreation.com/about-us. "Proprietary information" and "Usage restrictions"
// are headings on that page with no text, so those two short statements are for the owner to check.
const PARTS = [
  { title: 'About Thugil Creation', body: ['THUGIL CREATION is a website that offers computer aided textile designing course packages and sells images related to silk sarees like Border, Butta and Pallu BMP sketches. We are committed to making sure that your privacy is protected.'] },
  { title: 'Accepting these terms', body: [
    'Please read these Terms and our Privacy Policy carefully before using the website, the app, our services or products. If these Terms differ from any other policy about the website, app, services or products, the Terms apply.',
    'Your use, access or browsing of the website or app, or your registration (with or without payment or subscription) by any means, shows that you accept these Terms and agree to be legally bound by them.',
  ] },
  { title: 'Information we collect', body: ['We may collect these kinds of information to give you a better service:'], points: [
    'Contact information: name, email, phone number and address.',
    'Payment information: card, UPI and bank account details used to pay.',
    'Course enrolment: course name, enrolment date and your progress.',
    'Image uploads: saree designs and textile-related images.',
    'Browser and device: browser type, device type and IP address.',
  ] },
  { title: 'How we use your information', points: [
    'To give you access to textile designing courses and to sell saree design sketches.',
    'To process payments and send receipts or invoices.',
    'To improve our courses and services using your feedback.',
    'To tell you about our services, courses and offers.',
    'To follow legal obligations and regulations.',
  ] },
  { title: 'Security', body: ['We protect your data with SSL encryption for secure transmission, firewall systems that keep out unauthorised access, and strict access control.'] },
  { title: 'Your rights', points: ['Access your personal information.', 'Correct information that is wrong.', 'Delete your personal data.', 'Opt out of our messages.'] },
  { title: 'Cookies', body: ['We send cookies (small files containing a string of characters) to your device, which identify your browser. They remember your preferences, help you log in faster and show us general usage trends so we can improve what we offer. You can set your browser to refuse cookies or to warn you when one is sent, but some features may not work properly if cookies are disabled.'] },
  { title: 'External links', body: ['We may show links in a way that lets us see whether they were followed, to improve our content. Clicking a link may take you to a site outside ours. We are not responsible for the privacy practices of other websites, and we encourage you to read their privacy statements. This policy applies only to information collected by our website and app.'] },
  { title: 'Alerts', body: ['We may contact you by email or phone (SMS, call or WhatsApp) about new services of the company and its subsidiaries or affiliates, or other information we think is useful for you.'] },
  { title: 'Data retention', body: ['We plan to keep your data while your account is active and for at least three years afterwards. This may change with legal and business needs. We may keep some data longer to follow the law or voluntary codes of conduct, and keep other data for a shorter time to free up storage.'] },
  { title: 'Your consent', body: ['Every user should be able to give informed consent before giving us any information. By registering with us, you consent to us collecting, processing, storing, disclosing and handling your information as set out here, and as we may change it. This processing takes place in India. If you live outside India, your information is transferred, processed and stored under the applicable data protection laws of India.'] },
  { title: 'Proprietary information', body: ['The designs, images, course videos and other material on Thugil Creation belong to Thugil Creation or its designers and instructors, and are protected by law.'] },
  { title: 'Usage restrictions', body: ['Designs and courses you buy are for your own use. Do not copy, share, resell or publish the design files or course videos without our written permission.'] },
  { title: 'Changes to these terms', body: ['As our services grow, we may need to update these terms and the privacy policy. Please look at them from time to time. If you keep using our website, app and services after a change, it means you accept the change.'] },
];

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function Terms() {
  return (
    <main className="terms-wrap">
      <header className="terms-head">
        <span className="eyebrow">Legal</span>
        <h1>Terms &amp; Conditions</h1>
        <p>Please read these terms and our privacy policy before you use Thugil Creation.</p>
      </header>

      <div className="terms-body">
        <nav className="terms-toc" aria-label="Sections">
          <strong>On this page</strong>
          <ol>
            {PARTS.map((p) => <li key={p.title}><a href={`#Terms/${slug(p.title)}`} onClick={(e) => { e.preventDefault(); document.getElementById(slug(p.title))?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{p.title}</a></li>)}
            <li><a href="#Terms/contact-us" onClick={(e) => { e.preventDefault(); document.getElementById('contact-us')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Contact us</a></li>
          </ol>
        </nav>

        <div className="terms-text">
          {PARTS.map((p, i) => (
            <section key={p.title} id={slug(p.title)}>
              <h2><span>{i + 1}.</span> {p.title}</h2>
              {p.body?.map((t) => <p key={t}>{t}</p>)}
              {p.points && <ul>{p.points.map((t) => <li key={t}>{t}</li>)}</ul>}
            </section>
          ))}

          <section id="contact-us" className="terms-contact">
            <h2>Contact us</h2>
            <ul>
              <li><HugeiconsIcon icon={Mail01Icon} size={20} strokeWidth={1.6} /><span><small>Email</small><a href="mailto:thugilcreation@gmail.com">thugilcreation@gmail.com</a></span></li>
              <li><HugeiconsIcon icon={Call02Icon} size={20} strokeWidth={1.6} /><span><small>Phone</small><a href="tel:+918838008499">+91 8838008499</a> · <a href="tel:+919994266271">+91 9994266271</a></span></li>
              <li><HugeiconsIcon icon={Location01Icon} size={20} strokeWidth={1.6} /><span><small>Address</small>Kondalampatty, Salem, Tamil Nadu</span></li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

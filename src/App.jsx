import { useEffect, useState } from 'react';
import Navbar, { ROUTES } from './components/Navbar';
import Home from './pages/Home';
import Footer from './components/Footer';
import Designs from './pages/Designs';
import Courses from './pages/Courses';
import PurchaseComplete from './pages/PurchaseComplete';
import EnrolmentComplete from './pages/EnrolmentComplete';
import Learn from './pages/Learn';
import Purchases from './pages/Purchases';
import Terms from './pages/Terms';
import CartDrawer from './components/CartDrawer';
import LoginModal from './components/LoginModal';
import { login, fetchMe, getToken, setToken } from './api';
import { STYLE_NAME, specTags } from './components/DesignSheet';

// "#Designs/butta" -> { page: 'Designs', category: 'butta' }
const fromHash = () => {
  const [h, category] = window.location.hash.slice(1).split('/');
  return { page: ROUTES.includes(h) || h === 'Terms' || h === 'Success' || h === 'Enrolled' || h === 'Learn' ? h : 'Home', category: category || null };
};

export default function App() {
  const [route, setRoute] = useState(fromHash);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loginAsk, setLoginAsk] = useState(null); // null = closed, otherwise { reason, thenOpenCart }

  // a saved login is checked once on load; an expired or suspended one is dropped
  useEffect(() => {
    if (!getToken()) return;
    fetchMe().then((r) => setUser(r.user)).catch((e) => { if (e.status === 401) setToken(null); });
  }, []);
  async function doLogin(email, password) {
    const r = await login(email, password);
    setToken(r.token);
    setUser(r.user);
    if (loginAsk?.thenOpenCart) setCartOpen(true);
    setLoginAsk(null);
  }
  function doLogout() { setToken(null); setUser(null); setCartOpen(false); }
  const { page, category } = route;
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem('thugil-cart')) || []; } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('thugil-cart', JSON.stringify(items)); } catch { /* private mode: the cart just won't be remembered */ } }, [items]);
  const same = (a, b) => a.category === b.category && a.id === b.id;
  const cart = {
    items,
    has: (d) => items.some((i) => same(i, d)),
    add: (d) => setItems((l) => (l.some((i) => same(i, d)) ? l : [...l, { id: d.id, category: d.category, name: d.name, image_url: d.image_url, final_price: d.final_price, listing_rate: d.listing_rate, styleName: STYLE_NAME[d.category], specs: specTags(d) }])),
    remove: (d) => setItems((l) => l.filter((i) => !same(i, d))),
    removeMany: (list) => setItems((l) => l.filter((i) => !list.some((d) => same(i, d)))),
    clear: () => setItems([]),
  };

  useEffect(() => {
    const onHash = () => setRoute(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (p, cat) => { window.location.hash = cat ? `${p}/${cat}` : p; window.scrollTo({ top: 0 }); };

  return (
    <>
      <Navbar active={page === 'Enrolled' || page === 'Learn' ? 'Courses' : page} onNavigate={navigate} cartCount={items.length} onOpenCart={() => setCartOpen(true)} user={user} onLoginClick={() => setLoginAsk({})} onLogout={doLogout} onMyLearning={() => navigate('Learn')} onPurchases={() => navigate('Purchases')} />
      {page === 'Home' ? (
        <Home onNavigate={navigate} />
      ) : page === 'Purchases' ? (
        <Purchases user={user} onNavigate={navigate} onLogin={() => setLoginAsk({})} />
      ) : page === 'Success' ? (
        <PurchaseComplete orderId={category} user={user} onNavigate={navigate} onLogin={() => setLoginAsk({})} />
      ) : page === 'Courses' ? (
        <Courses id={category} onNavigate={navigate} user={user} onNeedLogin={() => setLoginAsk({ reason: 'Log in to buy this course.' })} onSessionExpired={() => { doLogout(); setLoginAsk({ reason: 'Your login has expired. Please log in again.' }); }} />
      ) : page === 'Enrolled' ? (
        <EnrolmentComplete enrollmentId={category} user={user} onNavigate={navigate} onLogin={() => setLoginAsk({})} />
      ) : page === 'Learn' ? (
        <Learn courseId={category} user={user} onNavigate={navigate} onLogin={() => setLoginAsk({})} />
      ) : page === 'Terms' ? (
        <Terms />
      ) : page === 'Designs' ? (
        <Designs category={category} onNavigate={navigate} cart={cart} onOpenCart={() => setCartOpen(true)} />
      ) : (
        <main className="page">
          <h1>{page}</h1>
        </main>
      )}
      <Footer onNavigate={navigate} />
      {cartOpen && <CartDrawer items={items} cart={cart} user={user} onPaid={(orderId) => { setCartOpen(false); navigate('Success', orderId); }} onNeedLogin={() => { setCartOpen(false); setLoginAsk({ thenOpenCart: true, reason: 'Log in to pay for the designs in your cart.' }); }} onSessionExpired={() => { doLogout(); setLoginAsk({ thenOpenCart: true, reason: 'Your login has expired. Please log in again.' }); }} onClose={() => setCartOpen(false)} onBrowse={() => { setCartOpen(false); navigate('Designs', 'all'); }} />}
      {loginAsk && <LoginModal onLogin={doLogin} onClose={() => setLoginAsk(null)} reason={loginAsk.reason} />}
    </>
  );
}

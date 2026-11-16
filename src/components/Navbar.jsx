import { useEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ShoppingCart01Icon, Menu01Icon, Cancel01Icon, Home01Icon, PaintBoardIcon, ShoppingBag01Icon, Book02Icon, Login01Icon, Logout01Icon, UserIcon, ArrowDown01Icon } from '@hugeicons/core-free-icons';

const ICONS = { Home: Home01Icon, Designs: PaintBoardIcon, Courses: Book02Icon };
export const NAV_ITEMS = Object.keys(ICONS); // the links shown in the bar
export const ROUTES = [...NAV_ITEMS, 'Purchases']; // pages the address can open (Purchases lives in the profile menu)

export default function Navbar({ active, onNavigate, cartCount, onOpenCart, user, onLoginClick, onLogout, onMyLearning, onPurchases }) {
  const [open, setOpen] = useState(false); // the menu on small screens
  const [accountOpen, setAccountOpen] = useState(false); // the name menu with Logout
  const accountRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); setAccountOpen(false); } };
    const onClick = (e) => { if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, []);

  const go = (page) => { onNavigate(page); setOpen(false); };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a className="brand" href="#Home" onClick={(e) => { e.preventDefault(); go('Home'); }}>ThugilCreation</a>

        <nav className={`nav-links${open ? ' open' : ''}`} aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <a key={item} href={`#${item}`} className={active === item ? 'active' : ''} aria-current={active === item ? 'page' : undefined} onClick={(e) => { e.preventDefault(); go(item); }}>
              <HugeiconsIcon icon={ICONS[item]} size={18} strokeWidth={1.5} />
              {item}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          {user ? (
            <div className="account" ref={accountRef}>
              <button type="button" className="nav-user" aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => setAccountOpen((o) => !o)}>
                <HugeiconsIcon icon={UserIcon} size={18} strokeWidth={1.5} />
                <span>{(user.full_name || user.email).split(' ')[0]}</span>
                <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={1.8} className="chev" />
              </button>
              {accountOpen && (
                <div className="account-menu" role="menu">
                  <div className="account-who">
                    <strong>{user.full_name || 'Your account'}</strong>
                    <small>{user.email}</small>
                  </div>
                  <button type="button" role="menuitem" className="account-item" onClick={() => { setAccountOpen(false); onMyLearning(); }}>
                    <HugeiconsIcon icon={Book02Icon} size={18} strokeWidth={1.5} /> My learning
                  </button>
                  <button type="button" role="menuitem" className="account-item" onClick={() => { setAccountOpen(false); onPurchases(); }}>
                    <HugeiconsIcon icon={ShoppingBag01Icon} size={18} strokeWidth={1.5} /> Purchases
                  </button>
                  <button type="button" role="menuitem" className="account-item" onClick={() => { setAccountOpen(false); onLogout(); }}>
                    <HugeiconsIcon icon={Logout01Icon} size={18} strokeWidth={1.5} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button type="button" className="nav-auth" onClick={onLoginClick}><HugeiconsIcon icon={Login01Icon} size={18} strokeWidth={1.5} /><span>Login</span></button>
          )}
          <button type="button" className="cart-btn" aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`} onClick={() => { setOpen(false); onOpenCart(); }}>
            <HugeiconsIcon icon={ShoppingCart01Icon} size={22} strokeWidth={1.5} />
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
          <button type="button" className="menu-btn" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <HugeiconsIcon icon={open ? Cancel01Icon : Menu01Icon} size={22} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}

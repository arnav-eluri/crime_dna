import React from 'react';
import { NavLink } from 'react-router-dom';
import { useMediaQuery } from '../utils';

interface NavItem {
  label: string;
  path: string;
  icon?: string;
  isFab?: boolean;
  svgIcon?: React.ReactNode;
}

const DESKTOP_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: '/img-1.png' },
  { label: 'Crime Map', path: '/map', icon: '/img-2.png' },
  { label: 'Trends', path: '/trends', icon: '/img-3.png' },
  { label: 'Alerts', path: '/alerts', icon: '/img-4.png' },
  { label: 'Severity', path: '/severity', icon: '/img-5.png' },
  { label: 'Network Graph', path: '/network', icon: '/img-6.png' },
  { label: 'FIR Records', path: '/firs', icon: '/img-7.png' },
];

const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: 'Intelligence', path: '/', svgIcon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> },
  { label: 'Analysis', path: '/trends', svgIcon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="16" y1="12" x2="16" y2="16"></line><line x1="8" y1="10" x2="8" y2="16"></line></svg> },

  { label: 'Network', path: '/network', svgIcon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg> },
  { label: 'Geospatial', path: '/map', svgIcon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg> },
];

export default function Navbar() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const navItems = isMobile ? MOBILE_NAV_ITEMS : DESKTOP_NAV_ITEMS;

  const currentCookie = document.cookie.match(/(^|;\s*)googtrans=([^;]*)/);
  const isKn = currentCookie && currentCookie[2] === '/en/kn';

  const toggleLanguage = () => {
    if (isKn) {
      document.cookie = "googtrans=/en/en; path=/";
      document.cookie = "googtrans=/en/en; path=/; domain=" + window.location.hostname;
    } else {
      document.cookie = "googtrans=/en/kn; path=/";
      document.cookie = "googtrans=/en/kn; path=/; domain=" + window.location.hostname;
    }
    window.location.reload();
  };

  return (
    <div className={`sidebar ${isMobile ? 'sidebar-mobile' : ''}`}>
      <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={styles.logoIcon}></div>
          <div>
            <div style={styles.logoTitle}>CrimeDNA</div>
            <div style={styles.logoSub}>Intelligence Platform</div>
          </div>
        </div>
        {!isMobile && (
          <div className="notranslate shadow-hover" style={{ cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: 'var(--color-on-surface)', backgroundColor: 'var(--color-surface-container-high)', padding: '6px 12px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--color-outline-variant)', letterSpacing: '0.5px', transition: 'all 0.2s ease' }} onClick={toggleLanguage} title="Translate">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            {isKn ? 'EN' : 'ಕನ್ನಡ'}
          </div>
        )}
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          if (item.isFab) {
            return (
              <div key={item.label} className="mobile-fab">
                {item.svgIcon}
              </div>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              {item.svgIcon ? <div className="nav-svg-icon">{item.svgIcon}</div> : item.icon && <img src={item.icon} alt={item.label} className="nav-icon-img" />}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <img src="/ksp_logo.jpeg" alt="KSP Logo" style={styles.footerLogo} />
        <div style={styles.footerText}>Karnataka State Police</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  logoIcon: { fontSize: 28 },
  logoTitle: { fontFamily: 'var(--font-family-display)', fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' },
  logoSub: { fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--color-on-surface-variant)', letterSpacing: 1 },
  footerLogo: { width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' },
  footerText: { fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--color-on-surface-variant)' },
};

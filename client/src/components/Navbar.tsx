import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: '/img-1.png' },
  { label: 'Crime Map', path: '/map', icon: '/img-2.png' },
  { label: 'Trends', path: '/trends', icon: '/img-3.png' },
  { label: 'Alerts', path: '/alerts', icon: '/img-4.png' },
  { label: 'Severity', path: '/severity', icon: '/img-5.png' },
  { label: 'Network Graph', path: '/network', icon: '/img-6.png' },
  { label: 'FIR Records', path: '/firs', icon: '/img-7.png' },
];

export default function Navbar() {
  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}></div>
        <div>
          <div style={styles.logoTitle}>CrimeDNA</div>
          <div style={styles.logoSub}>Intelligence Platform</div>
        </div>
      </div>
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}
          >
            {item.icon && <img src={item.icon} alt={item.label} style={styles.navIconImg} />}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={styles.footer}>
        <img src="/ksp_logo.jpeg" alt="KSP Logo" style={styles.footerLogo} />
        <div style={styles.footerText}>Karnataka State Police</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 240,
    minHeight: '100vh',
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.4)',
    color: 'var(--color-on-surface)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 20px 24px',
    borderBottom: '1px solid var(--color-surface-container-highest)',
    marginBottom: 16,
  },
  logoIcon: { fontSize: 28 },
  logoTitle: { fontFamily: 'var(--font-family-display)', fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' },
  logoSub: { fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--color-on-surface-variant)', letterSpacing: 1 },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 16px' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    border: 'none',
    background: 'transparent',
    color: 'var(--color-on-surface-variant)',
    fontFamily: 'var(--font-family-body)',
    fontSize: 14,
    cursor: 'pointer',
    borderRadius: 'var(--radius-default)',
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.2s',
  },
  navItemActive: {
    background: 'var(--color-primary-container)',
    color: 'var(--color-on-primary-container)',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(202, 138, 4, 0.2)',
  },
  navIconImg: { width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' },
  footer: {
    padding: '20px',
    borderTop: '1px solid var(--color-surface-container-highest)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  footerLogo: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    objectFit: 'cover'
  },
  footerText: { fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--color-on-surface-variant)' },
};

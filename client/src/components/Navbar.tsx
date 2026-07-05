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
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={styles.logoIcon}></div>
        <div>
          <div style={styles.logoTitle}>CrimeDNA</div>
          <div style={styles.logoSub}>Intelligence Platform</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon && <img src={item.icon} alt={item.label} className="nav-icon-img" />}
            <span>{item.label}</span>
          </NavLink>
        ))}
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
  footerLogo: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    objectFit: 'cover'
  },
  footerText: { fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--color-on-surface-variant)' },
};

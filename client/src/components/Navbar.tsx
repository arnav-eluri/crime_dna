import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: '📊' },
  { label: 'Crime Map', path: '/map', icon: '🗺️' },
  { label: 'Trends', path: '/trends', icon: '📈' },
  { label: 'Alerts', path: '/alerts', icon: '🔔' },
  { label: 'Severity', path: '/severity', icon: '⚠️' },
  { label: 'Network Graph', path: '/network', icon: '🔗' },
  { label: 'FIR Records', path: '/firs', icon: '📋' },
];

export default function Navbar() {
  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}>🔍</div>
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
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={styles.footer}>
        <div style={styles.footerLogo}>KSP</div>
        <div style={styles.footerText}>Karnataka State Police</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 240,
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a1628 0%, #0d2137 100%)',
    color: '#c8d6e5',
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
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  logoIcon: { fontSize: 28 },
  logoTitle: { fontSize: 20, fontWeight: 700, color: '#fff' },
  logoSub: { fontSize: 11, color: '#8395a7', letterSpacing: 1 },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    border: 'none',
    background: 'transparent',
    color: '#8395a7',
    fontSize: 14,
    cursor: 'pointer',
    borderRadius: 8,
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.2s',
  },
  navItemActive: {
    background: 'rgba(46, 213, 115, 0.15)',
    color: '#2eD573',
    fontWeight: 600,
  },
  navIcon: { fontSize: 16, width: 24 },
  footer: {
    padding: '20px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  footerLogo: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#2eD573',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 800,
    color: '#0a1628',
  },
  footerText: { fontSize: 11, color: '#576574' },
};

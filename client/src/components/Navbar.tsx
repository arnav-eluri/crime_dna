import React from 'react';
import { NavLink } from 'react-router-dom';
import { useMediaQuery } from '../utils';

const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconMap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
);

const IconAlerts = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconTrends = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const IconFIR = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconGlobe = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const NAV_ITEMS = [
  { label: 'Dashboard',  path: '/',       Icon: IconDashboard },
  { label: 'Crime Map',  path: '/map',    Icon: IconMap },
  { label: 'Alerts',     path: '/alerts', Icon: IconAlerts },
  { label: 'Trends',     path: '/trends', Icon: IconTrends },
  { label: 'FIR Records',path: '/firs',   Icon: IconFIR },
];

export default function Navbar() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const currentCookie = document.cookie.match(/(^|;\s*)googtrans=([^;]*)/);
  const isKn = currentCookie && currentCookie[2] === '/en/kn';

  const toggleLanguage = () => {
    const domains = [
      '',
      `domain=${window.location.hostname}`,
      `domain=.${window.location.hostname}`,
      `domain=.${window.location.hostname.split('.').slice(-2).join('.')}`,
    ];
    if (isKn) {
      domains.forEach(d => {
        document.cookie = `googtrans=/en/en; path=/; ${d}`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; ${d}`;
      });
    } else {
      domains.forEach(d => {
        document.cookie = `googtrans=/en/kn; path=/; ${d}`;
      });
    }
    window.location.reload();
  };

  return (
    <div className="sidebar">
      {!isMobile && (
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>
            </svg>
          </div>
          <div>
            <div className="sidebar-logo-title">CrimeDNA</div>
            <div className="sidebar-logo-sub">Intelligence Platform</div>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ label, path, Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {!isMobile && (
        <div className="sidebar-footer">
          <div className="sidebar-footer-org">
            <img src="./ksp_logo.jpeg" alt="KSP" className="sidebar-footer-logo" />
            <div className="sidebar-footer-text">Karnataka State Police<br />SCRB Division</div>
          </div>
          <button className="lang-toggle notranslate" onClick={toggleLanguage}>
            <IconGlobe />
            {isKn ? 'English' : 'ಕನ್ನಡ'}
          </button>
        </div>
      )}
    </div>
  );
}

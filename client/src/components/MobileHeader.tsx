import React, { useState } from 'react';

export default function MobileHeader() {
  const currentCookie = document.cookie.match(/(^|;\s*)googtrans=([^;]*)/);
  const isKn = currentCookie && currentCookie[2] === '/en/kn';
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleLanguage = () => {
    const domains = [
      '',
      `domain=${window.location.hostname}`,
      `domain=.${window.location.hostname}`,
      `domain=.${window.location.hostname.split('.').slice(-2).join('.')}`
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
    <div style={styles.header}>
      <div style={styles.logo}>
        <div style={styles.iconBox} onClick={() => setDrawerOpen(true)}>
          <div style={styles.iconInner}></div>
        </div>
        <span style={styles.title}>CrimeDNA</span>
      </div>
      <div style={styles.actions}>
        <div className="notranslate shadow-hover" style={{ flexShrink: 0, whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: '600', fontSize: '10px', color: '#191c1d', backgroundColor: 'transparent', padding: '2px 6px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '3px', border: '1.2px solid #191c1d' }} onClick={toggleLanguage} title="Translate">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          <span style={{ paddingTop: '1px' }}>{isKn ? 'English' : 'ಕನ್ನಡ'}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
      </div>

      {drawerOpen && (
        <div style={styles.drawerOverlay} onClick={() => setDrawerOpen(false)}>
          <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <h3 style={styles.drawerTitle}>Project Data</h3>
              <button onClick={() => setDrawerOpen(false)} style={styles.closeBtn}>&times;</button>
            </div>
            <div style={styles.drawerContent}>
              <img src="./ksp_logo.jpeg" alt="KSP Logo" style={styles.drawerKspLogo} />
              <div style={styles.drawerText}>
                <strong>CrimeDNA Intelligence Platform</strong><br />
                Developed by 404_Detectives for the Karnataka State Police.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    position: 'sticky',
    background: '#ad740023',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0)',
    top: 0,
    zIndex: 50,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    background: '#805600',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 14,
    height: 10,
    borderTop: '2px solid white',
    borderBottom: '2px solid white',
  },
  title: {
    fontFamily: 'var(--font-family-display)',
    fontWeight: 700,
    fontSize: 18,
    color: '#805600',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  bell: {
    color: 'var(--color-on-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.5)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  drawer: {
    background: 'var(--color-surface-container-lowest)',
    width: '80%',
    maxWidth: '320px',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  drawerTitle: {
    margin: 0,
    fontFamily: 'var(--font-family-display)',
    color: 'var(--color-on-surface)',
    fontSize: '18px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: 'var(--color-on-surface-variant)',
    lineHeight: 1,
  },
  drawerContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    textAlign: 'center',
  },
  drawerKspLogo: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  drawerText: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '14px',
    color: 'var(--color-on-surface-variant)',
    lineHeight: 1.5,
  }
};

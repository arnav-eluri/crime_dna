import React from 'react';

export default function MobileHeader() {
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
    <div style={styles.header}>
      <div style={styles.logo}>
        <div style={styles.iconBox}>
          <div style={styles.iconInner}></div>
        </div>
        <span style={styles.title}>CrimeDNA</span>
      </div>
      <div style={styles.actions}>
        <div className="notranslate shadow-hover" style={{ cursor: 'pointer', fontWeight: '600', fontSize: '12px', color: 'var(--color-on-surface)', backgroundColor: 'var(--color-surface-container-high)', padding: '4px 10px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--color-outline-variant)', letterSpacing: '0.5px' }} onClick={toggleLanguage} title="Translate">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          {isKn ? 'EN' : 'ಕನ್ನಡ'}
        </div>
        <div style={styles.bell}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <img src="/ksp_logo.jpeg" alt="KSP Logo" style={styles.kspLogo} />
      </div>
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
  kspLogo: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    objectFit: 'cover',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  }
};

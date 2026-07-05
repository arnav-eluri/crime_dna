import React from 'react';
import MobileHeader from '../components/MobileHeader';

export default function MobileDashboard() {
  return (
    <div style={styles.container}>
      <MobileHeader />
      
      <div style={styles.content}>
        <div style={styles.feedHeader}>
          <div style={styles.feedLabel}>AUTHENTICATED INVESTIGATOR</div>
          <h1 style={styles.feedTitle}>Intelligence Feed</h1>
        </div>

        {/* Hero Card */}
        <div style={styles.heroCard}>
          <div style={styles.heroContent}>
            <div style={styles.liveTag}>
              <div style={styles.liveDot}></div>
              LIVE BEHAVIORAL MESH
            </div>
            <h2 style={styles.heroTitle}>Network Anomaly Detected in Sector 7</h2>
            <div style={styles.heroActions}>
              <button style={styles.launchBtn}>Launch Analysis</button>
              <div style={styles.toggleBg}>
                <div style={styles.toggleKnob}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Alerts */}
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Priority Alerts</h3>
          <span style={styles.viewArchive}>View Archive</span>
        </div>
        
        <div style={styles.alertsScroll}>
          {/* Alert 1 */}
          <div style={{ ...styles.alertCard, borderLeft: '4px solid #ba1a1a' }}>
            <div style={{ ...styles.alertIconBg, background: '#ffdad6' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#ba1a1a" stroke="#ba1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div style={styles.alertTitle}>Critical Breach</div>
            <div style={styles.alertSub}>Secure Vault A-9</div>
            <div style={styles.alertTime}>04:12 PM</div>
          </div>
          
          {/* Alert 2 */}
          <div style={{ ...styles.alertCard, borderLeft: '4px solid #805600' }}>
            <div style={{ ...styles.alertIconBg, background: '#f5e4c3' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#805600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </div>
            <div style={styles.alertTitle}>Positive ID</div>
            <div style={styles.alertSub}>Target #8821-X</div>
            <div style={styles.alertTime}>03:55 PM</div>
          </div>
        </div>

        {/* Active Case Load */}
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Active Case Load</h3>
        </div>
        
        <div style={styles.caseCard}>
          <div style={styles.caseImgPlaceholder}>
             <img src="https://i.pravatar.cc/150?img=11" alt="Case target" style={styles.caseImg} />
          </div>
          <div style={styles.caseInfo}>
            <div style={styles.caseHeader}>
              <div style={styles.caseTitle}>Op. Golden Eye</div>
              <div style={styles.caseBadge}>IN PROGRESS</div>
            </div>
            <div style={styles.caseDesc}>Cross-referencing dna_sequence_99.12</div>
          </div>
          <div style={styles.chevron}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <polyline points="9 18 15 12 9 6"/>
             </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'linear-gradient(180deg, #fefdf9 0%, #f4eee2 20%, #222325 100%)',
    minHeight: '100vh',
    paddingBottom: 120, // space for bottom nav
  },
  content: {
    padding: '0 20px',
  },
  feedHeader: {
    marginTop: 10,
    marginBottom: 20,
  },
  feedLabel: {
    fontFamily: 'var(--font-family-mono)',
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#837562',
    fontWeight: 600,
    marginBottom: 4,
  },
  feedTitle: {
    fontFamily: 'var(--font-family-display)',
    fontSize: 24,
    fontWeight: 700,
    color: '#191c1d',
    margin: 0,
  },
  heroCard: {
    background: 'linear-gradient(135deg, #fbf7ef 0%, #ebd4a8 50%, #c4aa79 100%)',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    marginBottom: 32,
    position: 'relative',
    overflow: 'hidden',
    height: 240,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
  },
  liveTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'var(--font-family-mono)',
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    background: '#ffba46',
    borderRadius: '50%',
    boxShadow: '0 0 8px rgba(255, 186, 70, 0.8)',
  },
  heroTitle: {
    fontFamily: 'var(--font-family-display)',
    fontSize: 24,
    fontWeight: 700,
    color: '#ffffff',
    lineHeight: 1.2,
    margin: '0 0 20px 0',
  },
  heroActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  launchBtn: {
    background: '#ffffff',
    color: '#805600',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 12,
    fontFamily: 'var(--font-family-body)',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },
  toggleBg: {
    background: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    width: 50,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    padding: 2,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    background: '#ffffff',
    borderRadius: '50%',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'var(--font-family-display)',
    fontSize: 18,
    fontWeight: 700,
    color: '#191c1d',
    margin: 0,
  },
  viewArchive: {
    fontFamily: 'var(--font-family-body)',
    fontSize: 12,
    fontWeight: 600,
    color: '#805600',
  },
  alertsScroll: {
    display: 'flex',
    gap: 16,
    overflowX: 'auto',
    paddingBottom: 16,
    margin: '0 -20px 16px',
    padding: '0 20px 16px',
  },
  alertCard: {
    background: '#ffffff',
    borderRadius: 16,
    padding: 16,
    minWidth: 160,
    boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
  },
  alertIconBg: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontFamily: 'var(--font-family-display)',
    fontWeight: 700,
    fontSize: 15,
    color: '#191c1d',
    marginBottom: 4,
  },
  alertSub: {
    fontFamily: 'var(--font-family-body)',
    fontSize: 12,
    color: '#514535',
    marginBottom: 12,
  },
  alertTime: {
    fontFamily: 'var(--font-family-mono)',
    fontSize: 10,
    color: '#837562',
    letterSpacing: 1,
  },
  caseCard: {
    background: '#ffffff',
    borderRadius: 16,
    padding: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
  },
  caseImgPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    background: '#eee',
    flexShrink: 0,
  },
  caseImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  caseInfo: {
    flex: 1,
  },
  caseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  caseTitle: {
    fontFamily: 'var(--font-family-display)',
    fontWeight: 700,
    fontSize: 15,
    color: '#191c1d',
  },
  caseBadge: {
    background: '#d8e3fb',
    color: '#3c475a',
    fontSize: 9,
    fontFamily: 'var(--font-family-mono)',
    padding: '2px 6px',
    borderRadius: 4,
    fontWeight: 600,
  },
  caseDesc: {
    fontFamily: 'var(--font-family-body)',
    fontSize: 12,
    color: '#514535',
    lineHeight: 1.4,
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};

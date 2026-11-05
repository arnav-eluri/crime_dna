import React, { useEffect, useState } from 'react';

export default function Preloader({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'var(--bg-base)',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.4s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="./ksp_logo.jpeg" alt="KSP" style={{
            width: 48, height: 48, borderRadius: '50%', objectFit: 'cover',
            border: '2px solid var(--border-mid)',
          }} />
          <div style={{ width: 1, height: 36, background: 'var(--border-mid)' }} />
          <div style={{
            width: 48, height: 48, background: 'var(--accent)', borderRadius: 'var(--r-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>
            </svg>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.01em' }}>
            Crime<span style={{ color: 'var(--accent)' }}>DNA</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-lo)', letterSpacing: '3px', marginTop: 6 }}>
            INTELLIGENCE PLATFORM
          </div>
        </div>

        <div style={{ width: 120, height: 2, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: '40%', background: 'var(--accent)', borderRadius: 2,
            animation: 'preloader-scan 1.2s ease-in-out infinite',
          }} />
        </div>

        <style>{`
          @keyframes preloader-scan {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
      </div>

      {children}
    </>
  );
}

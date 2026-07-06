import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function Preloader({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    setLoading(true);
    
    const timer = setTimeout(() => {
      setLoading(false);
      setDisplayLocation(location);
    }, 2000);

    return () => clearTimeout(timer);
  }, [location]);

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(248, 249, 250, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: loading ? 1 : 0,
        pointerEvents: loading ? 'auto' : 'none',
        transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: loading ? 'float 3s ease-in-out infinite' : 'none',
        }}>
          {/* Dual Logos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <img src="/ksp_logo.jpeg" alt="KSP Logo" style={{
              width: 56, height: 56, borderRadius: '50%', objectFit: 'cover',
              boxShadow: '0 8px 32px rgba(128, 86, 0, 0.2)',
              animation: loading ? 'pulse-glow 2s infinite' : 'none'
            }} />
            
            <div style={{ width: 2, height: 40, background: 'rgba(128, 86, 0, 0.2)' }} />

            <div style={{
              width: 56, height: 56, background: '#805600', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(128, 86, 0, 0.3)',
              animation: loading ? 'pulse-glow 2s infinite 1s' : 'none' // offset animation
            }}>
              <div style={{ width: 28, height: 20, borderTop: '3px solid white', borderBottom: '3px solid white' }}></div>
            </div>
          </div>
          
          <h1 style={{
            fontFamily: 'var(--font-family-display)',
            fontWeight: 700,
            fontSize: 28,
            color: '#191c1d',
            margin: '0 0 16px 0',
            letterSpacing: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            Crime<span style={{ color: '#805600' }}>DNA</span>
          </h1>

          {/* Premium Loading Bar */}
          <div style={{ width: 140, height: 3, background: 'rgba(128, 86, 0, 0.1)', borderRadius: 4, overflow: 'hidden', position: 'relative', marginBottom: 12 }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, height: '100%', width: '50%',
              background: '#805600', borderRadius: 4,
              animation: loading ? 'scan-bar 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite' : 'none'
            }} />
          </div>

          <div style={{
            fontFamily: 'var(--font-family-mono)',
            fontSize: 10,
            color: '#837562',
            letterSpacing: 4,
            fontWeight: 600,
            animation: loading ? 'blink 1.5s infinite' : 'none'
          }}>ESTABLISHING SECURE LINK...</div>
        </div>

        <style>
          {`
            @keyframes float {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
              100% { transform: translateY(0px); }
            }
            @keyframes pulse-glow {
              0% { box-shadow: 0 8px 32px rgba(128, 86, 0, 0.2); transform: scale(1); }
              50% { box-shadow: 0 12px 48px rgba(128, 86, 0, 0.4); transform: scale(1.05); }
              100% { box-shadow: 0 8px 32px rgba(128, 86, 0, 0.2); transform: scale(1); }
            }
            @keyframes scan-bar {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.4; }
            }
          `}
        </style>
      </div>
      
      {/* Always render children in background */}
      {children}
    </>
  );
}

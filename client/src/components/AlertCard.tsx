import React from 'react';

interface AlertCardProps {
  district: string;
  crimeCategory: string;
  alertLevel: 'CRITICAL' | 'ELEVATED' | 'NORMAL';
  currentCount: number;
  historicalAvg: number;
  percentChange: number;
  trendDirection: string;
}

const LEVEL: Record<string, { color: string; dimColor: string }> = {
  CRITICAL: { color: '#D94040', dimColor: 'rgba(217,64,64,0.12)' },
  ELEVATED: { color: '#E09020', dimColor: 'rgba(224,144,32,0.12)' },
  NORMAL:   { color: '#2AB4A0', dimColor: 'rgba(42,180,160,0.12)' },
};

export default function AlertCard({
  district, crimeCategory, alertLevel, currentCount, historicalAvg, percentChange, trendDirection,
}: AlertCardProps) {
  const { color, dimColor } = LEVEL[alertLevel] || LEVEL.NORMAL;
  const isUp = trendDirection === 'up';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${color}`,
      borderRadius: 'var(--r-lg)',
      padding: '16px 18px',
      flex: '1 0 260px',
      minWidth: 0,
      maxWidth: 400,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
          borderRadius: 'var(--r-sm)', background: dimColor, color,
          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.5px',
        }}>
          {alertLevel}
        </span>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-hi)' }}>{district}</span>
      </div>

      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-lo)' }}>{crimeCategory}</div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, color }}>
          {currentCount.toLocaleString()}
        </span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-lo)' }}>incidents</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, marginLeft: 'auto',
          letterSpacing: '0.04em', color: isUp ? 'var(--critical)' : 'var(--normal)',
        }}>
          {isUp ? '↑ RISING' : '↓ STABLE'}
        </span>
      </div>
    </div>
  );
}

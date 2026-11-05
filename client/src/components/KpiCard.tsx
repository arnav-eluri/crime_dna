import React from 'react';

interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color?: string;
  icon?: string;
  delay?: number;
}

export default function KpiCard({ title, value, subtitle, color = '#2AB4A0' }: KpiCardProps) {
  return (
    <div style={{
      flex: '1 1 160px',
      minWidth: 0,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${color}`,
      borderRadius: 'var(--r-lg)',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-lo)', fontWeight: 500, letterSpacing: '0.01em' }}>
        {title}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(20px, 3vw, 26px)',
        fontWeight: 500,
        color,
        lineHeight: 1.1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color: 'var(--text-lo)', lineHeight: 1.3 }}>{subtitle}</div>
      )}
    </div>
  );
}

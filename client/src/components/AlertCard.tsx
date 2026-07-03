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

const LEVEL_COLORS: Record<string, string> = {
  CRITICAL: '#ff4757',
  ELEVATED: '#ffa502',
  NORMAL: '#2eD573',
};

export default function AlertCard({
  district, crimeCategory, alertLevel, currentCount, historicalAvg, percentChange, trendDirection,
}: AlertCardProps) {
  const color = LEVEL_COLORS[alertLevel] || '#2eD573';
  const isUp = trendDirection === 'up';

  return (
    <div style={{
      ...styles.card,
      borderLeft: `4px solid ${color}`,
      animation: alertLevel === 'CRITICAL' ? 'pulse 2s infinite' : 'none',
    }}>
      <div style={styles.header}>
        <span style={{ ...styles.badge, background: color }}>{alertLevel}</span>
        <span style={styles.district}>{district}</span>
      </div>
      <div style={styles.category}>{crimeCategory}</div>
      <div style={styles.stats}>
        <span style={{ ...styles.stat, color }}>
          {currentCount} incidents
        </span>
        <span style={styles.arrow}>{isUp ? '↑' : '↓'}</span>
        <span style={{ ...styles.change, color: isUp ? '#ff4757' : '#2eD573' }}>
          {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
        </span>
      </div>
      <div style={styles.avg}>Historical avg: {historicalAvg.toFixed(1)}/month</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: '16px 20px',
    minWidth: 260,
    flex: '1 0 260px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  badge: {
    padding: '2px 10px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: 1,
  },
  district: { fontSize: 14, fontWeight: 600, color: '#c8d6e5' },
  category: { fontSize: 12, color: '#8395a7', marginBottom: 10 },
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stat: { fontSize: 18, fontWeight: 700 },
  arrow: { fontSize: 16, fontWeight: 700 },
  change: { fontSize: 14, fontWeight: 600 },
  avg: { fontSize: 11, color: '#576574' },
};

import React from 'react';

interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color?: string;
  icon?: string;
}

export default function KpiCard({ title, value, subtitle, color = '#2eD573', icon }: KpiCardProps) {
  return (
    <div style={{
      ...styles.card,
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={styles.header}>
        {icon && <span style={styles.icon}>{icon}</span>}
        <span style={styles.title}>{title}</span>
      </div>
      <div style={{ ...styles.value, color }}>{value}</div>
      {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: '20px 24px',
    minWidth: 180,
    flex: 1,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  icon: { fontSize: 18 },
  title: {
    fontSize: 13,
    color: '#8395a7',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: 12,
    color: '#576574',
    marginTop: 6,
  },
};

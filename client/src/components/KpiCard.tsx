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
    background: 'var(--color-surface-container-lowest)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 24px',
    minWidth: 180,
    flex: 1,
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.04)',
    border: '1px solid var(--color-surface-container-highest)',
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
    color: 'var(--color-on-surface-variant)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'var(--font-family-body)',
    fontWeight: 600,
  },
  value: {
    fontFamily: 'var(--font-family-display)',
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  subtitle: {
    fontFamily: 'var(--font-family-body)',
    fontSize: 12,
    color: 'var(--color-on-surface-variant)',
    marginTop: 6,
  },
};

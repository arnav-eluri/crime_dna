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
    <div className="shadow-hover" style={{
      ...styles.card,
      borderTop: `4px solid ${color}`,
      background: `linear-gradient(145deg, var(--color-surface-container-lowest) 0%, rgba(255,255,255,0.4) 100%)`,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={styles.header}>
        {icon && (
          <div style={styles.iconWrapper}>
            <img src={icon} alt={title} style={styles.iconImg} />
          </div>
        )}
        <span style={styles.title}>{title}</span>
      </div>
      <div style={{ ...styles.value, color }}>{value}</div>
      {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    borderRadius: 'var(--radius-lg)',
    padding: '20px 24px',
    minWidth: 140,
    flex: 1,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255,255,255,0.6)',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconImg: { 
    width: 42, 
    height: 42, 
    objectFit: 'contain',
  },
  title: {
    fontSize: 12,
    color: 'var(--color-on-surface-variant)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'var(--font-family-body)',
    fontWeight: 700,
    lineHeight: 1.2,
    wordWrap: 'break-word',
  },
  value: {
    fontFamily: 'var(--font-family-display)',
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.1,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: 'var(--font-family-body)',
    fontSize: 11,
    color: 'var(--color-on-surface-variant)',
    marginTop: 8,
    lineHeight: 1.3,
  },
};

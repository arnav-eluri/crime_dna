import React, { useEffect, useState } from 'react';
import { api } from '../api';
import AlertCard from '../components/AlertCard';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  useEffect(() => {
    api.alerts().then(alertData => {
      setAlerts(alertData.alerts || []);
    })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterLevel === 'ALL' ? alerts : alerts.filter(a => a.alert_level === filterLevel);

  const criticalAlerts = alerts.filter(a => a.alert_level === 'CRITICAL');
  const elevatedAlerts = alerts.filter(a => a.alert_level === 'ELEVATED');
  const districts = Array.from(new Set(alerts.map(a => a.district)));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Emerging Trend Alerts</h1>
        <div style={styles.stats}>
          <span style={{ ...styles.statBadge, background: '#ff4757' }}>{criticalAlerts.length} Critical</span>
          <span style={{ ...styles.statBadge, background: '#ffa502' }}>{elevatedAlerts.length} Elevated</span>
          <span style={{ ...styles.statBadge, background: '#576574' }}>{alerts.length} Total</span>
        </div>
      </div>

      {alerts.length === 0 && !loading && (
        <div style={styles.empty}>
          No active alerts. Crime patterns are within normal ranges across all districts.
        </div>
      )}

      <div style={styles.filters}>
        <button onClick={() => setFilterLevel('ALL')}
          style={{ ...styles.filterBtn, ...(filterLevel === 'ALL' ? styles.filterBtnActive : {}) }}>
          All
        </button>
        <button onClick={() => setFilterLevel('CRITICAL')}
          style={{ ...styles.filterBtn, ...(filterLevel === 'CRITICAL' ? styles.filterBtnActive : {}), borderColor: '#ff4757' }}>
          🔴 Critical
        </button>
        <button onClick={() => setFilterLevel('ELEVATED')}
          style={{ ...styles.filterBtn, ...(filterLevel === 'ELEVATED' ? styles.filterBtnActive : {}), borderColor: '#ffa502' }}>
          🟡 Elevated
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading alerts...</div>
      ) : (
        <div style={styles.grid}>
          {filtered.map((alert, idx) => (
            <AlertCard
              key={idx}
              district={alert.district}
              crimeCategory={alert.crime_category}
              alertLevel={alert.alert_level}
              currentCount={alert.current_count}
              historicalAvg={alert.historical_avg}
              percentChange={alert.percent_change}
              trendDirection={alert.trend_direction}
            />
          ))}
        </div>
      )}

      {criticalAlerts.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Affected Districts</h3>
          <div style={styles.districtList}>
            {districts.map(d => (
              <div key={d} style={styles.districtChip}>
                {d}
                <span style={{ ...styles.districtCount, color: criticalAlerts.some(a => a.district === d) ? '#ff4757' : '#ffa502' }}>
                  {alerts.filter(a => a.district === d).length} alerts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 'var(--spacing-container-padding)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' as const, gap: 12 },
  title: { fontFamily: 'var(--font-family-display)', fontSize: 28, fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 },
  stats: { display: 'flex', gap: 8 },
  statBadge: { padding: '4px 12px', borderRadius: 'var(--radius-default)', fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'var(--font-family-mono)' },
  empty: { padding: 40, color: 'var(--color-on-surface-variant)', fontSize: 14, textAlign: 'center' as const, fontFamily: 'var(--font-family-body)' },
  loading: { padding: 40, color: 'var(--color-on-surface-variant)', fontSize: 16, textAlign: 'center' as const, fontFamily: 'var(--font-family-body)' },
  filters: { display: 'flex', gap: 8, marginBottom: 20 },
  filterBtn: {
    padding: '8px 16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--color-surface-container-highest)',
    background: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface-variant)', cursor: 'pointer', 
    fontFamily: 'var(--font-family-body)', fontSize: 13, transition: 'all 0.2s', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.02)'
  },
  filterBtnActive: { background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', borderColor: 'var(--color-primary-container)', fontWeight: 600, boxShadow: '0px 4px 8px rgba(202, 138, 4, 0.2)' },
  grid: { display: 'flex', gap: 16, flexWrap: 'wrap' as const },
  section: { marginTop: 32 },
  sectionTitle: { fontFamily: 'var(--font-family-display)', fontSize: 18, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 12 },
  districtList: { display: 'flex', gap: 12, flexWrap: 'wrap' as const },
  districtChip: {
    padding: '10px 16px', borderRadius: 'var(--radius-default)', background: 'var(--color-surface-container-lowest)',
    color: 'var(--color-on-surface)', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 4,
    border: '1px solid var(--color-surface-container-highest)', fontFamily: 'var(--font-family-body)',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.02)'
  },
  districtCount: { fontFamily: 'var(--font-family-mono)', fontSize: 11, fontWeight: 600 },
};

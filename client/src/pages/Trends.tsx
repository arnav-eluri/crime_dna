import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';

export default function Trends() {
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.trends().then(setTrends).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Loading trends...</div>;
  if (!trends) return <div style={styles.error}>No trend data available.</div>;

  const monthlyData = Object.entries((trends.monthly_trends || {}) as Record<string, number>)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-24)
    .map(([period, count]) => ({ period, count }));

  const crimeData = Object.entries((trends.crime_type_distribution || {}) as Record<string, number>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.substring(0, 18), value }));

  const districtData = Object.entries((trends.district_distribution || {}) as Record<string, number>)
    .map(([name, value]) => ({ name, value }));

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Trend Analysis</h1>

      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Monthly FIR Trends (Last 24 months)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="period" tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-surface-container-highest)', borderRadius: 8 }}
              labelStyle={{ color: 'var(--color-on-surface)' }}
            />
            <Line type="monotone" dataKey="count" stroke="#ca8a04" strokeWidth={2} dot={{ fill: '#ca8a04', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Crime Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={crimeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10 }} width={120} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-surface-container-highest)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--color-on-surface)' }}
              />
              <Bar dataKey="value" fill="#805600" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>District Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={districtData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-surface-container-highest)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--color-on-surface)' }}
              />
              <Bar dataKey="value" fill="#ffba46" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 'var(--spacing-container-padding)' },
  title: { fontFamily: 'var(--font-family-display)', fontSize: 28, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 24 },
  loading: { padding: 40, color: 'var(--color-on-surface-variant)', fontSize: 16, textAlign: 'center' as const, fontFamily: 'var(--font-family-body)' },
  error: { padding: 40, color: 'var(--color-error)', fontSize: 16, fontFamily: 'var(--font-family-body)' },
  chartsRow: { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' as const },
  chartCard: {
    flex: '1 1 400px',
    background: 'var(--color-surface-container-lowest)',
    borderRadius: 'var(--radius-lg)',
    padding: 24,
    marginBottom: 16,
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.04)',
    border: '1px solid var(--color-surface-container-highest)',
  },
  chartTitle: { fontFamily: 'var(--font-family-display)', fontSize: 18, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 16 },
};

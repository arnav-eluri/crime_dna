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
            <XAxis dataKey="period" tick={{ fill: '#8395a7', fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fill: '#8395a7', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#0d2137', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              labelStyle={{ color: '#c8d6e5' }}
            />
            <Line type="monotone" dataKey="count" stroke="#2eD573" strokeWidth={2} dot={{ fill: '#2eD573', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Crime Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={crimeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: '#8395a7', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#8395a7', fontSize: 10 }} width={120} />
              <Tooltip
                contentStyle={{ background: '#0d2137', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#c8d6e5' }}
              />
              <Bar dataKey="value" fill="#1e90ff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>District Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={districtData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#8395a7', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8395a7', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0d2137', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#c8d6e5' }}
              />
              <Bar dataKey="value" fill="#a29bfe" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px 32px' },
  title: { fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 24 },
  loading: { padding: 40, color: '#8395a7', fontSize: 16, textAlign: 'center' as const },
  error: { padding: 40, color: '#ff4757', fontSize: 16 },
  chartsRow: { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' as const },
  chartCard: {
    flex: '1 1 400px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  chartTitle: { fontSize: 16, fontWeight: 600, color: '#c8d6e5', marginBottom: 16 },
};

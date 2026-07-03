import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { CrimeSummary } from '../types';
import KpiCard from '../components/KpiCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#2eD573', '#ffa502', '#ff4757', '#1e90ff', '#a29bfe', '#fd79a8', '#00cec9', '#e17055'];

export default function Dashboard() {
  const [data, setData] = useState<CrimeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.summary().then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Loading dashboard...</div>;
  if (error) return <div style={styles.error}>Error: {error}</div>;
  if (!data) return <div style={styles.error}>No data available. Run the pipeline first.</div>;

  const crimeChartData = Object.entries(data.crime_type_distribution || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name: name.substring(0, 20), value }));

  const severityPieData = Object.entries(data.severity_distribution || {}).map(([name, value]) => ({
    name, value,
  }));

  const districtData = Object.entries(data.district_distribution || {}).map(([name, value]) => ({
    name, value,
  }));

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Crime Intelligence Dashboard</h1>

      <div style={styles.kpiRow}>
        <KpiCard title="Total FIRs" value={data.total_firs.toLocaleString()} icon="📝" color="#2eD573"
          subtitle="All registered cases" />
        <KpiCard title="Active Cases" value={data.active_cases.toLocaleString()} icon="🕐" color="#1e90ff"
          subtitle="Under investigation" />
        <KpiCard title="Hotspots" value={data.hotspot_count} icon="🔥" color="#ff4757"
          subtitle={`${data.spatiotemporal_hotspot_count} spatiotemporal`} />
        <KpiCard title="Critical" value={data.critical_count} icon="🚨" color="#ff6b81"
          subtitle="High severity incidents" />
      </div>

      <div style={styles.kpiRow}>
        <KpiCard title="Anomalies" value={data.anomaly_count} icon="⚠️" color="#ffa502"
          subtitle="Statistical outliers detected" />
        <KpiCard title="Alerts" value={data.alerts?.length || 0} icon="🔔" color="#ff4757"
          subtitle={`${data.alerts?.filter(a => a.alert_level === 'CRITICAL').length || 0} critical`} />
        <KpiCard title="Syndicate Links" value={data.syndicate_link_count} icon="🔗" color="#a29bfe"
          subtitle="Repeat offender networks" />
        <KpiCard title="Risk Classes" value={Object.values(data.risk_class_distribution || {}).reduce((a, b) => a + b, 0)} icon="🎯" color="#00cec9"
          subtitle="ML-classified risk levels" />
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Top Crime Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={crimeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#8395a7', fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#8395a7', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0d2137', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#c8d6e5' }}
              />
              <Bar dataKey="value" fill="#2eD573" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={severityPieData} dataKey="value" cx="50%" cy="50%" outerRadius={100} label={({ name, value }: any) => `${name}: ${value}`}>
                {severityPieData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>District Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={districtData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: '#8395a7', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#8395a7', fontSize: 11 }} width={100} />
              <Tooltip
                contentStyle={{ background: '#0d2137', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#c8d6e5' }}
              />
              <Bar dataKey="value" fill="#1e90ff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Risk Class Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={Object.entries(data.risk_class_distribution || {}).map(([k, v]) => ({ name: ['Low', 'High', 'Critical'][Number(k)] || k, value: v }))}
                dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, value }: any) => `${name}: ${value}`}>
                {Object.entries(data.risk_class_distribution || {}).map((_, idx) => (
                  <Cell key={idx} fill={['#2eD573', '#ffa502', '#ff4757'][idx] || '#8395a7'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
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
  kpiRow: { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' as const },
  chartsRow: { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' as const },
  chartCard: {
    flex: '1 1 400px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 20,
  },
  chartTitle: { fontSize: 16, fontWeight: 600, color: '#c8d6e5', marginBottom: 16 },
};

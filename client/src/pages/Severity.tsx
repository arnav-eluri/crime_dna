import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ff4757',
  HIGH: '#ffa502',
  LOW: '#2eD573',
};

const RISK_LABELS = ['Low Risk', 'High Risk', 'Critical Risk'];

export default function Severity() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.severity().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Loading severity data...</div>;
  if (!data) return <div style={styles.error}>No severity data available.</div>;

  const severityChartData = Object.entries(data.severity_distribution || {}).map(([name, value]) => ({
    name,
    value,
    fill: SEVERITY_COLORS[name] || '#8395a7',
  }));

  const riskChartData = Object.entries(data.risk_class_distribution || {}).map(([key, value]) => ({
    name: RISK_LABELS[Number(key)] || `Class ${key}`,
    value,
  }));

  const total = Object.values(data.severity_distribution || {}).reduce((a: number, b: any) => a + (b as number), 0) as number;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Severity & Risk Analysis</h1>

      <div style={styles.kpiRow}>
        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #ff4757' }}>
          <div style={styles.kpiLabel}>Critical Cases</div>
          <div style={{ ...styles.kpiValue, color: '#ff4757' }}>{data.critical_count || 0}</div>
          <div style={styles.kpiSub}>{total > 0 ? ((data.critical_count / total) * 100).toFixed(1) : 0}% of total</div>
        </div>
        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #ffa502' }}>
          <div style={styles.kpiLabel}>High Severity</div>
          <div style={{ ...styles.kpiValue, color: '#ffa502' }}>{data.severity_distribution?.HIGH || 0}</div>
        </div>
        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #2eD573' }}>
          <div style={styles.kpiLabel}>Low Severity</div>
          <div style={{ ...styles.kpiValue, color: '#2eD573' }}>{data.severity_distribution?.LOW || 0}</div>
        </div>
        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #a29bfe' }}>
          <div style={styles.kpiLabel}>Total Cases</div>
          <div style={{ ...styles.kpiValue, color: '#a29bfe' }}>{total}</div>
        </div>
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Severity Level Distribution</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={severityChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#8395a7', fontSize: 13 }} />
              <YAxis tick={{ fill: '#8395a7', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0d2137', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#c8d6e5' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {severityChartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Severity Proportion</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={severityChartData} dataKey="value" cx="50%" cy="50%" outerRadius={120} label={({ name, value, percent }: any) =>
                `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}>
                {severityChartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>ML-Based Risk Class Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={riskChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: '#8395a7', fontSize: 13 }} />
            <YAxis tick={{ fill: '#8395a7', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#0d2137', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              labelStyle={{ color: '#c8d6e5' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {riskChartData.map((_, idx) => (
                <Cell key={idx} fill={[ '#2eD573', '#ffa502', '#ff4757' ][idx] || '#8395a7'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px 32px' },
  title: { fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 24 },
  loading: { padding: 40, color: '#8395a7', fontSize: 16, textAlign: 'center' as const },
  error: { padding: 40, color: '#ff4757', fontSize: 16 },
  kpiRow: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' as const },
  kpiCard: {
    flex: 1, minWidth: 160, background: 'rgba(255,255,255,0.03)',
    borderRadius: 12, padding: '16px 20px',
  },
  kpiLabel: { fontSize: 12, color: '#8395a7', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 },
  kpiValue: { fontSize: 32, fontWeight: 700 },
  kpiSub: { fontSize: 11, color: '#576574', marginTop: 4 },
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

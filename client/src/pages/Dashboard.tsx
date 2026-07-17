import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { CrimeSummary } from '../types';
import KpiCard from '../components/KpiCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { formatCrimeName, formatDistrictName, useMediaQuery } from '../utils';
import MobileDashboard from './MobileDashboard';

const COLORS = ['#2eD573', '#ffa502', '#ff4757', '#1e90ff', '#a29bfe', '#fd79a8', '#00cec9', '#e17055'];

const CustomXAxisTick = ({ x, y, payload }: any) => {
  const words = payload.value.split(' ');
  let line1 = payload.value;
  let line2 = '';
  
  if (words.length > 2) {
    const mid = Math.ceil(words.length / 2);
    line1 = words.slice(0, mid).join(' ');
    line2 = words.slice(mid).join(' ');
  } else if (words.length === 2 && payload.value.length > 12) {
    line1 = words[0];
    line2 = words[1];
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={24} textAnchor="middle" fill="var(--color-on-surface-variant)" fontSize={11} fontWeight={600}>
        <tspan x={0} dy={0}>{line1}</tspan>
        {line2 && <tspan x={0} dy={14}>{line2}</tspan>}
      </text>
    </g>
  );
};

export default function Dashboard() {
  const [data, setData] = useState<CrimeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    api.summary().then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Loading dashboard...</div>;
  if (error) return <div style={styles.error}>Error: {error}</div>;
  if (!data) return <div style={styles.error}>No data available. Run the pipeline first.</div>;

  if (isMobile) {
    return <MobileDashboard data={data} />;
  }

  const crimeChartData = Object.entries(data.crime_type_distribution || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name: formatCrimeName(name), value }));

  const districtData = Object.entries(data.district_distribution || {}).map(([name, value]) => ({
    name: formatDistrictName(name), value,
  }));

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Crime Intelligence Dashboard</h1>

      <div style={styles.kpiRow}>
        <KpiCard title="Total FIRs" value={data.total_firs?.toLocaleString()} icon="/img-1.png" color="#805600"
          subtitle="All registered cases" />
        <KpiCard title="Active Cases" value={data.active_cases?.toLocaleString()} icon="/img-2.png" color="#1e90ff"
          subtitle="Under investigation" />
        <KpiCard title="Hotspots" value={data.hotspot_count?.toLocaleString()} icon="/img-3.png" color="#ba1a1a"
          subtitle={`${data.spatiotemporal_hotspot_count?.toLocaleString()} spatiotemporal`} />
        <KpiCard title="Critical" value={data.critical_count?.toLocaleString()} icon="/img-4.png" color="#d4af37"
          subtitle="High severity incidents" />
      </div>

      <div style={styles.kpiRow}>
        <KpiCard title="Anomalies" value={data.anomaly_count?.toLocaleString()} icon="/img-5.png" color="#ffba46"
          subtitle="Statistical outliers detected" />
        <KpiCard title="Alerts" value={data.alerts?.length?.toLocaleString() || '0'} icon="/img-6.png" color="#ba1a1a"
          subtitle={`${data.alerts?.filter(a => a.alert_level === 'CRITICAL').length?.toLocaleString() || '0'} critical`} />
        <KpiCard title="Syndicate Links" value={data.syndicate_link_count?.toLocaleString()} icon="/img-7.png" color="#545f73"
          subtitle="Repeat offender networks" />
        <KpiCard title="Risk Classes" value={Object.values(data.risk_class_distribution || {}).reduce((a, b) => a + b, 0)?.toLocaleString()} icon="" color="#805600"
          subtitle="ML-classified risk levels" />
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Top Crime Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={crimeChartData} margin={{ top: 20, right: 10, left: -20, bottom: 50 }}>
              <defs>
                <linearGradient id="colorCrime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2eD573" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#2eD573" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={<CustomXAxisTick />} interval={0} height={80} axisLine={false} tickLine={false} />
              <YAxis 
                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} 
                tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 11, fontWeight: 600 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-surface-container-highest)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: 'var(--color-on-surface)', fontWeight: 600, marginBottom: 4 }}
              />
              <Bar 
                dataKey="value" 
                fill="url(#colorCrime)" 
                radius={[50, 50, 0, 0]} 
                maxBarSize={40} 
                background={{ fill: 'rgba(0,0,0,0.04)', radius: [50, 50, 0, 0] }} 
              >
                <LabelList dataKey="value" position="top" fill="var(--color-on-surface-variant)" fontSize={10} fontWeight="600" formatter={(val: number) => val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>District Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={districtData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorDistrict" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="5%" stopColor="#1e90ff" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#1e90ff" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10 }} width={80} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-surface-container-highest)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: 'var(--color-on-surface)', fontWeight: 600 }}
              />
              <Bar dataKey="value" fill="url(#colorDistrict)" radius={[0, 6, 6, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Risk Class Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
              <Pie data={Object.entries(data.risk_class_distribution || {}).map(([k, v]) => ({ name: ['Low', 'High', 'Critical'][Number(k)] || k, value: v }))}
                dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} stroke="none">
                {Object.entries(data.risk_class_distribution || {}).map((_, idx) => (
                  <Cell key={idx} fill={['#2eD573', '#ffa502', '#ff4757'][idx] || '#8395a7'} style={{ outline: 'none' }} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-surface-container-highest)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--color-on-surface)' }} verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '40px', overflowX: 'hidden' },
  title: { 
    fontFamily: 'var(--font-family-display)', 
    fontSize: 32, 
    fontWeight: 800, 
    background: 'linear-gradient(90deg, var(--color-primary) 0%, #d4af37 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: 32,
    letterSpacing: '-0.5px'
  },
  loading: { padding: 40, color: 'var(--color-on-surface-variant)', fontSize: 16, textAlign: 'center' as const },
  error: { padding: 40, color: 'var(--color-error)', fontSize: 16 },
  kpiRow: { display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' as const },
  chartsRow: { display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' as const },
  chartCard: {
    flex: '1 1 300px',
    minWidth: 0,
    background: 'linear-gradient(145deg, var(--color-surface-container-lowest) 0%, rgba(255,255,255,0.4) 100%)',
    backdropFilter: 'blur(12px)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255,255,255,0.6)',
    transition: 'all 0.3s ease',
  },
  chartTitle: { fontFamily: 'var(--font-family-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 20 },
};

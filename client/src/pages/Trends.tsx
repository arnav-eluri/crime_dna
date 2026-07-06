import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { formatCrimeName, formatDistrictName, useMediaQuery } from '../utils';
import MobileHeader from '../components/MobileHeader';

export default function Trends() {
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');

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
    .map(([name, value]) => ({ name: formatCrimeName(name), value }));

  const districtData = Object.entries((trends.district_distribution || {}) as Record<string, number>)
    .map(([name, value]) => ({ name: formatDistrictName(name), value }));

  return (
    <div style={{ ...styles.container, paddingBottom: isMobile ? 25 : 40, background: 'transparent' }}>
      {isMobile ? <MobileHeader /> : <h1 style={{ ...styles.title, padding: '40px 40px 0' }}>Trend Analysis</h1>}

      <div style={isMobile ? styles.mobileContent : { padding: '0 40px' }}>
        {isMobile && (
          <div style={styles.feedHeader}>
            <div style={styles.feedLabel}>ANALYTICS ENGINE</div>
            <h1 style={styles.feedTitle}>Trend Analysis</h1>
          </div>
        )}

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Monthly FIR Trends (Last 24 months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ca8a04" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ca8a04" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="period" tick={{ fill: '#514535', fontSize: 12 }} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#514535', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: 'none', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#191c1d', fontWeight: 600, marginBottom: 4 }}
              />
              <Area type="monotone" dataKey="count" stroke="#ca8a04" strokeWidth={3} fillOpacity={1} fill="url(#colorMonthly)" activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={styles.chartInsight}>Track the volume of FIRs filed over the last two years to identify seasonal patterns and anomalies.</div>
        </div>

        <div style={styles.chartsRow}>
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Crime Type Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={crimeData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCrimeTrend" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#805600" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#805600" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis type="number" tick={{ fill: '#514535', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#514535', fontSize: 12 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ background: '#ffffff', border: 'none', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  labelStyle={{ color: '#191c1d', fontWeight: 600 }}
                />
                <Bar dataKey="value" fill="url(#colorCrimeTrend)" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
            <div style={styles.chartInsight}>Understand which crime categories are most prevalent across all jurisdictions to inform preventative measures.</div>
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>District Comparison</h3>
            <ResponsiveContainer width="100%" height={Math.max(120, districtData.length * 40)}>
              <BarChart data={districtData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorDistrictTrend" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#ffba46" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#ffba46" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis type="number" tick={{ fill: '#514535', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#514535', fontSize: 12 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ background: '#ffffff', border: 'none', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  labelStyle={{ color: '#191c1d', fontWeight: 600 }}
                />
                <Bar dataKey="value" fill="url(#colorDistrictTrend)" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
            <div style={styles.chartInsight}>Compare total crime volume across different districts to identify high-risk zones and allocate resources effectively.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', overflowX: 'hidden' },
  mobileContent: { padding: '0 20px' },
  feedHeader: { marginTop: 10, marginBottom: 20 },
  feedLabel: { fontFamily: 'var(--font-family-mono)', fontSize: 10, letterSpacing: 1.5, color: '#837562', fontWeight: 600, marginBottom: 4 },
  feedTitle: { fontFamily: 'var(--font-family-display)', fontSize: 24, fontWeight: 700, color: '#191c1d', margin: 0 },
  title: { fontFamily: 'var(--font-family-display)', fontSize: 24, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 24 },
  loading: { padding: 40, color: 'var(--color-on-surface-variant)', fontSize: 16, textAlign: 'center' as const, fontFamily: 'var(--font-family-body)' },
  error: { padding: 40, color: 'var(--color-error)', fontSize: 16, fontFamily: 'var(--font-family-body)' },
  chartsRow: { display: 'flex', gap: 16, flexWrap: 'wrap' as const },
  chartCard: {
    flex: '1 1 300px',
    minWidth: 0,
    background: '#ffffff',
    borderRadius: 16,
    padding: '20px 16px',
    marginBottom: 20,
    boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
  },
  chartTitle: { fontFamily: 'var(--font-family-display)', fontSize: 15, fontWeight: 700, color: '#191c1d', marginBottom: 16 },
  chartInsight: { fontFamily: 'var(--font-family-body)', fontSize: 13, color: '#837562', marginTop: 16, textAlign: 'center', lineHeight: 1.5 }
};

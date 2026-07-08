import React from 'react';
import MobileHeader from '../components/MobileHeader';
import { CrimeSummary } from '../types';
import { formatCrimeName, formatDistrictName } from '../utils';
import KpiCard from '../components/KpiCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#2eD573', '#ffa502', '#ff4757', '#1e90ff', '#a29bfe', '#fd79a8', '#00cec9', '#e17055'];

interface Props {
  data: CrimeSummary;
}

export default function MobileDashboard({ data }: Props) {
  const criticalAlerts = [...(data.alerts || [])].sort((a, b) => 
    a.alert_level === 'CRITICAL' ? -1 : 1
  );
  const heroAlert = criticalAlerts.length > 0 ? criticalAlerts[0] : null;

  const crimeChartData = Object.entries(data.crime_type_distribution || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name: formatCrimeName(name), value }));

  const severityPieData = Object.entries(data.severity_distribution || {}).map(([name, value]) => ({
    name, value,
  }));

  const districtData = Object.entries(data.district_distribution || {}).map(([name, value]) => ({
    name: formatDistrictName(name), value,
  }));

  return (
    <div style={styles.container}>
      <MobileHeader />
      
      <div style={styles.content}>
        <div style={styles.feedHeader}>
          <div style={styles.feedLabel}>AUTHENTICATED INVESTIGATOR</div>
          <h1 style={styles.feedTitle}>Intelligence Feed</h1>
        </div>

        {/* KPI Dashboard Values */}
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Dashboard Values</h3>
        </div>
        <div style={styles.kpiGrid}>
          <KpiCard title="Total FIRs" value={data.total_firs?.toLocaleString()} icon="/img-1.png" color="#805600" subtitle="All registered cases" />
          <KpiCard title="Active Cases" value={data.active_cases?.toLocaleString()} icon="/img-2.png" color="#1e90ff" subtitle="Under investigation" />
          <KpiCard title="Hotspots" value={data.hotspot_count?.toLocaleString()} icon="/img-3.png" color="#ba1a1a" subtitle={`${data.spatiotemporal_hotspot_count?.toLocaleString()} spatiotemporal`} />
          <KpiCard title="Critical" value={data.critical_count?.toLocaleString()} icon="/img-4.png" color="#d4af37" subtitle="High severity incidents" />
          <KpiCard title="Anomalies" value={data.anomaly_count?.toLocaleString()} icon="/img-5.png" color="#ffba46" subtitle="Statistical outliers detected" />
          <KpiCard title="Alerts" value={data.alerts?.length?.toLocaleString() || '0'} icon="/img-6.png" color="#ba1a1a" subtitle={`${criticalAlerts.length?.toLocaleString()} critical`} />
        </div>

        {/* Graphs section */}
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Analytics</h3>
        </div>
        
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Top Crime Categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={crimeChartData} margin={{ top: 20, right: 10, left: -20, bottom: 50 }}>
              <defs>
                <linearGradient id="colorCrimeMobile" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2eD573" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#2eD573" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#514535', fontSize: 12 }} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#514535', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ background: '#ffffff', border: 'none', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#191c1d', fontWeight: 600, marginBottom: 4 }}
              />
              <Bar dataKey="value" fill="url(#colorCrimeMobile)" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
          <div style={styles.chartInsight}>Distribution of the most frequent crime categories.</div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
              <Pie data={severityPieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} stroke="none">
                {severityPieData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} style={{ outline: 'none' }} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#ffffff', border: 'none', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 13, color: '#191c1d' }} verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
          <div style={styles.chartInsight}>Breakdown of incidents by risk severity level.</div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>District Distribution</h3>
          <ResponsiveContainer width="100%" height={Math.max(120, districtData.length * 40)}>
            <BarChart data={districtData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorDistrictMobile" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="5%" stopColor="#1e90ff" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#1e90ff" stopOpacity={0.2}/>
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
              <Bar dataKey="value" fill="url(#colorDistrictMobile)" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
          <div style={styles.chartInsight}>Geographical breakdown of cases across districts.</div>
        </div>

        {/* Watermark */}
        <div style={styles.watermark}>
          Developed by 404_Detectives
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'transparent',
    minHeight: '100vh',
    paddingBottom: 25, // space for bottom nav
  },
  content: {
    padding: '0 20px',
  },
  feedHeader: {
    marginTop: 10,
    marginBottom: 20,
  },
  feedLabel: {
    fontFamily: 'var(--font-family-mono)',
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#ffffffff',
    fontWeight: 600,
    marginBottom: 4,
  },
  feedTitle: {
    fontFamily: 'var(--font-family-display)',
    fontSize: 24,
    fontWeight: 700,
    color: '#191c1d',
    margin: 0,
  },
  heroCard: {
    background: 'linear-gradient(135deg, #fbf7ef 0%, #ebd4a8 50%, #c4aa79 100%)',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    marginBottom: 32,
    position: 'relative',
    overflow: 'hidden',
    height: 240,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
  },
  liveTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'var(--font-family-mono)',
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    background: '#ffba46',
    borderRadius: '50%',
    boxShadow: '0 0 8px rgba(255, 186, 70, 0.8)',
  },
  heroTitle: {
    fontFamily: 'var(--font-family-display)',
    fontSize: 24,
    fontWeight: 700,
    color: '#ffffff',
    lineHeight: 1.2,
    margin: '0 0 20px 0',
  },
  heroActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  launchBtn: {
    background: '#ffffff',
    color: '#805600',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 12,
    fontFamily: 'var(--font-family-body)',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },
  toggleBg: {
    background: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    width: 50,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    padding: 2,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    background: '#ffffff',
    borderRadius: '50%',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'var(--font-family-display)',
    fontSize: 18,
    fontWeight: 700,
    color: '#191c1d',
    margin: 0,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '12px',
    marginBottom: '32px',
  },
  chartCard: {
    background: '#ffffff',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
    marginBottom: 20,
  },
  chartTitle: { 
    fontFamily: 'var(--font-family-display)', 
    fontSize: 15, 
    fontWeight: 700, 
    color: '#191c1d', 
    marginBottom: 16 
  },
  chartInsight: {
    fontFamily: 'var(--font-family-body)',
    fontSize: 13,
    color: '#837562',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  watermark: {
    fontFamily: 'var(--font-family-body)',
    fontSize: 10,
    color: '#837562a4',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  }
};

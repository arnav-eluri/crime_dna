import React, { useEffect, useState } from 'react';
import { api } from '../api';
import AlertCard from '../components/AlertCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

type Level = 'ALL' | 'CRITICAL' | 'ELEVATED' | 'NORMAL';

const darkTooltip = {
  contentStyle: { background: '#1C1D24', border: '1px solid #252630', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#B0B3C8', fontWeight: 600 },
  itemStyle: { color: '#ECEDF5' },
};
const axisStyle = { fill: '#7A7D92', fontSize: 11 };

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<Level>('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.alerts()
      .then(d => setAlerts(d.alerts || []))
      .catch(e => setError(e.message || 'Failed to load alerts'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterLevel === 'ALL' ? alerts : alerts.filter(a => a.alert_level === filterLevel);
  const counts = {
    critical: alerts.filter(a => a.alert_level === 'CRITICAL').length,
    elevated: alerts.filter(a => a.alert_level === 'ELEVATED').length,
    total: alerts.length,
  };

  // District alert distribution (top 10 by total alerts)
  const districtAlertData = Object.values(
    alerts.reduce((acc: any, a) => {
      const key = a.district;
      if (!acc[key]) acc[key] = { name: key.replace(/ (DIST|CITY)$/, ''), CRITICAL: 0, ELEVATED: 0, NORMAL: 0 };
      acc[key][a.alert_level as 'CRITICAL' | 'ELEVATED' | 'NORMAL']++;
      return acc;
    }, {} as any)
  ).sort((a: any, b: any) => (b.CRITICAL + b.ELEVATED + b.NORMAL) - (a.CRITICAL + a.ELEVATED + a.NORMAL))
   .slice(0, 10) as any[];

  const filterBtnStyle = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '7px 16px',
    borderRadius: 'var(--r-md)',
    border: `1px solid ${active ? (color ?? 'var(--accent)') : 'var(--border)'}`,
    background: active ? (color ? `${color}1A` : 'var(--accent-dim)') : 'var(--bg-card)',
    color: active ? (color ?? 'var(--accent)') : 'var(--text-lo)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-sm)',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Trend Alerts</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ padding: '4px 10px', borderRadius: 'var(--r-sm)', background: 'rgba(217,64,64,0.12)', color: 'var(--critical)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>
            {counts.critical} critical
          </span>
          <span style={{ padding: '4px 10px', borderRadius: 'var(--r-sm)', background: 'rgba(224,144,32,0.12)', color: 'var(--elevated)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>
            {counts.elevated} elevated
          </span>
          <span style={{ padding: '4px 10px', borderRadius: 'var(--r-sm)', background: 'var(--bg-card)', color: 'var(--text-lo)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, border: '1px solid var(--border)' }}>
            {counts.total} total
          </span>
        </div>
      </div>

      {/* District alert distribution chart */}
      {!loading && districtAlertData.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 20 }}>
          <div className="chart-title">Alert Distribution by District</div>
          <ResponsiveContainer width="100%" height={Math.max(200, districtAlertData.length * 30)}>
            <BarChart data={districtAlertData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#252630" />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ ...axisStyle, fontSize: 11 }} width={100} axisLine={false} tickLine={false} />
              <Tooltip {...darkTooltip} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--text-mid)', paddingTop: 8 }} />
              <Bar dataKey="CRITICAL" stackId="a" fill="#D94040" fillOpacity={0.85} maxBarSize={16} />
              <Bar dataKey="ELEVATED" stackId="a" fill="#E09020" fillOpacity={0.85} maxBarSize={16} />
              <Bar dataKey="NORMAL"   stackId="a" fill="#2AB4A0" fillOpacity={0.85} maxBarSize={16} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {error && <div className="state-msg state-err">Error: {error}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setFilterLevel('ALL')}      style={filterBtnStyle(filterLevel === 'ALL')}>All</button>
        <button onClick={() => setFilterLevel('CRITICAL')} style={filterBtnStyle(filterLevel === 'CRITICAL', '#D94040')}>Critical</button>
        <button onClick={() => setFilterLevel('ELEVATED')} style={filterBtnStyle(filterLevel === 'ELEVATED', '#E09020')}>Elevated</button>
        <button onClick={() => setFilterLevel('NORMAL')}   style={filterBtnStyle(filterLevel === 'NORMAL',   '#2AB4A0')}>Normal</button>
      </div>

      {loading ? (
        <div className="state-msg">Loading alerts...</div>
      ) : filtered.length === 0 && !error ? (
        <div className="state-msg">No alerts match this filter. Crime patterns are within normal ranges.</div>
      ) : (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {filtered.map((alert, i) => (
            <AlertCard key={i}
              district={alert.district} crimeCategory={alert.crime_category} alertLevel={alert.alert_level}
              currentCount={alert.current_count} historicalAvg={alert.historical_avg}
              percentChange={alert.percent_change} trendDirection={alert.trend_direction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

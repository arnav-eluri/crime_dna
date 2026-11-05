import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { CrimeSummary } from '../types';
import KpiCard from '../components/KpiCard';
import AlertCard from '../components/AlertCard';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Treemap, Legend,
} from 'recharts';
import { formatCrimeName, formatDistrictName } from '../utils';

const TREE_COLORS = ['#CC6B00','#2AB4A0','#6B7FCC','#D94040','#8B6CC0','#E09020','#3A9BD5','#5DB87A','#F0A060','#E05070','#50C0B0','#A070D0','#60B040','#C09030'];

const darkTooltip = {
  contentStyle: { background: '#1C1D24', border: '1px solid #252630', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#B0B3C8', fontWeight: 600 },
  itemStyle: { color: '#ECEDF5' },
};
const axisStyle = { fill: '#7A7D92', fontSize: 11 };

function TreemapCell(props: any) {
  const { x, y, width, height, name, value, index, depth } = props;
  if (depth === 0 || width < 10 || height < 10) return null;
  const color = TREE_COLORS[index % TREE_COLORS.length];
  const maxChars = Math.max(4, Math.floor(width / 7));
  return (
    <g>
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} fill={color} fillOpacity={0.85} rx={3} />
      {width > 50 && height > 28 && (
        <text x={x + 7} y={y + 17} fill="#ECEDF5" fontSize={Math.min(11, width / 9)} fontWeight={600} style={{ pointerEvents: 'none' }}>
          {name.length > maxChars ? name.slice(0, maxChars - 1) + '…' : name}
        </text>
      )}
      {width > 50 && height > 44 && (
        <text x={x + 7} y={y + 32} fill="rgba(236,237,245,0.6)" fontSize={10} style={{ pointerEvents: 'none' }}>
          {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
        </text>
      )}
    </g>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<CrimeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.summary().then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page state-msg">Loading dashboard...</div>;
  if (error)   return <div className="page state-msg state-err">Error: {error}</div>;
  if (!data)   return <div className="page state-msg">No data. Run the pipeline first.</div>;

  const crimeTreeData = Object.entries(data.crime_type_distribution || {})
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: formatCrimeName(name), value }));

  const sevTotal = Object.values(data.severity_distribution || {}).reduce((s, v) => s + v, 0);
  const riskData = [
    { name: 'Low',      value: data.severity_distribution?.LOW      ?? 0, fill: '#2AB4A0' },
    { name: 'High',     value: data.severity_distribution?.HIGH     ?? 0, fill: '#E09020' },
    { name: 'Critical', value: data.severity_distribution?.CRITICAL ?? 0, fill: '#D94040' },
  ].map(r => ({ ...r, pct: sevTotal > 0 ? ((r.value / sevTotal) * 100).toFixed(1) : '0' }));

  const monthlyData = Object.entries((data.monthly_trends || {}) as Record<string, number>)
    .sort(([a], [b]) => a.localeCompare(b)).slice(-24)
    .map(([period, count]) => ({ period, count }));

  const districtData = Object.entries(data.district_distribution || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, value]) => ({ name: formatDistrictName(name), value }));

  const criticalAlerts = (data.alerts || []).filter(a => a.alert_level === 'CRITICAL').slice(0, 3);

  return (
    <div className="page">
      <h1 className="page-title">Intelligence Dashboard</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <KpiCard title="Total FIRs"      value={data.total_firs?.toLocaleString()}       color="#CC6B00" subtitle="All registered cases" />
        <KpiCard title="Active Cases"    value={data.active_cases?.toLocaleString()}      color="#2AB4A0" subtitle="Under investigation" />
        <KpiCard title="Hotspots"        value={data.hotspot_count?.toLocaleString()}     color="#D94040" subtitle={`${data.spatiotemporal_hotspot_count ?? 0} spatiotemporal`} />
        <KpiCard title="Critical"        value={data.critical_count?.toLocaleString()}    color="#D94040" subtitle="High severity" />
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard title="Anomalies"       value={data.anomaly_count?.toLocaleString()}     color="#E09020" subtitle="Statistical outliers" />
        <KpiCard title="Alerts"          value={(data.alerts?.length ?? 0).toLocaleString()} color="#E09020" subtitle={`${criticalAlerts.length} critical`} />
        <KpiCard title="Syndicate Links" value={data.syndicate_link_count?.toLocaleString()} color="#6B7FCC" subtitle="Organised crime" />
        <KpiCard title="Risk Classified" value={Object.values(data.risk_class_distribution || {}).reduce((a, b) => a + b, 0).toLocaleString()} color="#5DB87A" subtitle="ML-labelled records" />
      </div>

      {/* Full-width monthly area chart */}
      {monthlyData.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 16 }}>
          <div className="chart-title">FIR Volume — 24-month trend</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthlyData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dashAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#CC6B00" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#CC6B00" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#252630" />
              <XAxis dataKey="period" tick={{ fill: '#55576A', fontSize: 9 }} axisLine={false} tickLine={false}
                tickFormatter={v => { const p = v.split('-'); const m = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+p[1]] ?? ''; return `${m}'${p[0].slice(-2)}`; }} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={38}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip {...darkTooltip} />
              <Area type="monotone" dataKey="count" stroke="#CC6B00" strokeWidth={2} fill="url(#dashAreaGrad)" dot={false}
                activeDot={{ r: 4, fill: '#CC6B00', stroke: '#0C0D10', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Treemap + RadialBar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="chart-card" style={{ flex: '2 1 380px' }}>
          <div className="chart-title">Crime Categories</div>
          <ResponsiveContainer width="100%" height={280}>
            <Treemap data={crimeTreeData} dataKey="value" content={<TreemapCell />}>
              <Tooltip {...darkTooltip} formatter={(v: any) => [Number(v).toLocaleString(), 'FIRs']} />
            </Treemap>
          </ResponsiveContainer>
        </div>

        <div className="chart-card" style={{ flex: '1 1 220px', minWidth: 200 }}>
          <div className="chart-title">Severity Split</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadialBarChart cx="50%" cy="46%" innerRadius="22%" outerRadius="88%" data={riskData} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={4} background={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Tooltip
                {...darkTooltip}
                formatter={(v: any, _n: any, p: any) => [`${Number(v).toLocaleString()} (${p.payload.pct}%)`, p.payload.name]}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--text-mid)', paddingTop: 8 }}
                formatter={(value, entry: any) => `${entry.payload.name}  ${entry.payload.pct}%`} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* District breakdown */}
      {districtData.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 16 }}>
          <div className="chart-title">Top Districts by FIR Volume</div>
          <ResponsiveContainer width="100%" height={Math.max(200, districtData.length * 28)}>
            <BarChart data={districtData} layout="vertical" margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#252630" />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <YAxis dataKey="name" type="category" tick={{ ...axisStyle, fontSize: 11 }} width={100} axisLine={false} tickLine={false} />
              <Tooltip {...darkTooltip} cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                formatter={(v: any) => [Number(v).toLocaleString(), 'FIRs']} />
              <Bar dataKey="value" fill="#2AB4A0" fillOpacity={0.8} radius={[0, 4, 4, 0]} maxBarSize={18}
                label={{ position: 'right', fill: '#7A7D92', fontSize: 10,
                  formatter: (v: any) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Critical alerts preview */}
      {criticalAlerts.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-lo)', marginBottom: 12, letterSpacing: '0.03em' }}>
            Active Critical Alerts
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {criticalAlerts.map((a, i) => (
              <AlertCard key={i}
                district={a.district} crimeCategory={a.crime_category} alertLevel={a.alert_level}
                currentCount={a.current_count} historicalAvg={a.historical_avg}
                percentChange={a.percent_change} trendDirection={a.trend_direction}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

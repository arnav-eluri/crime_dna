import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  AreaChart, Area, ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Treemap,
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

function LollipopBar(props: any) {
  const { x, y, width, height } = props;
  const cy = y + height / 2;
  return (
    <g>
      <line x1={x} y1={cy} x2={x + width} y2={cy} stroke="#2AB4A0" strokeWidth={1.5} strokeOpacity={0.5} />
      <circle cx={x + width} cy={cy} r={5} fill="#2AB4A0" fillOpacity={0.9} />
    </g>
  );
}

export default function Trends() {
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.trends().then(setTrends).catch(e => setError(e.message || 'Failed to load trends')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page state-msg">Loading trends...</div>;
  if (error)   return <div className="page state-msg state-err">Error: {error}</div>;
  if (!trends) return <div className="page state-msg">No trend data available.</div>;

  const monthlyData = Object.entries((trends.monthly_trends || {}) as Record<string, number>)
    .sort(([a], [b]) => a.localeCompare(b)).slice(-24)
    .map(([period, count]) => ({ period, count }));

  const crimeTreeData = Object.entries((trends.crime_type_distribution || {}) as Record<string, number>)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: formatCrimeName(name), value }));

  const districtData = Object.entries((trends.district_distribution || {}) as Record<string, number>)
    .sort((a, b) => b[1] - a[1]).slice(0, 12)
    .map(([name, value]) => ({ name: formatDistrictName(name), value }));

  return (
    <div className="page">
      <h1 className="page-title">Trend Analysis</h1>

      {/* Area chart */}
      <div className="chart-card" style={{ marginBottom: 16 }}>
        <div className="chart-title">Monthly FIR Volume — last 24 months</div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 36 }}>
            <defs>
              <linearGradient id="trendsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#CC6B00" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#CC6B00" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#252630" />
            <XAxis dataKey="period" tick={{ fill: '#55576A', fontSize: 9 }} axisLine={false} tickLine={false} height={48}
              tickFormatter={v => { const p = v.split('-'); const m = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+p[1]] ?? ''; return `${m}'${p[0].slice(-2)}`; }} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={40}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip {...darkTooltip} />
            <Area type="monotone" dataKey="count" stroke="#CC6B00" strokeWidth={2.5} fill="url(#trendsAreaGrad)" dot={false}
              activeDot={{ r: 5, fill: '#CC6B00', stroke: '#0C0D10', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 8, textAlign: 'center' }}>
          Identify seasonal patterns and long-term crime volume trends.
        </div>
      </div>

      {/* Treemap + Lollipop */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="chart-card" style={{ flex: '1 1 360px' }}>
          <div className="chart-title">Crime Type Distribution</div>
          <ResponsiveContainer width="100%" height={340}>
            <Treemap data={crimeTreeData} dataKey="value" content={<TreemapCell />}>
              <Tooltip {...darkTooltip} formatter={(v: any) => [Number(v).toLocaleString(), 'FIRs']} />
            </Treemap>
          </ResponsiveContainer>
          <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 8, textAlign: 'center' }}>
            Cell area proportional to FIR count.
          </div>
        </div>

        <div className="chart-card" style={{ flex: '1 1 300px' }}>
          <div className="chart-title">District Comparison</div>
          <ResponsiveContainer width="100%" height={Math.max(300, districtData.length * 32)}>
            <ComposedChart data={districtData} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#252630" />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <YAxis dataKey="name" type="category" tick={{ ...axisStyle, fontSize: 11 }} width={96} axisLine={false} tickLine={false} />
              <Tooltip {...darkTooltip} cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                formatter={(v: any) => [Number(v).toLocaleString(), 'FIRs']} />
              <Bar dataKey="value" maxBarSize={14} shape={<LollipopBar />}
                label={{ position: 'right', fill: '#7A7D92', fontSize: 10,
                  formatter: (v: any) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v }} />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 8, textAlign: 'center' }}>
            Bengaluru City's outlier status reflects resource demand.
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { SpatiotemporalCluster } from '../types';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ff4757',
  HIGH: '#ffa502',
  LOW: '#2eD573',
};

export default function CrimeMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [clusters, setClusters] = useState<SpatiotemporalCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTime, setFilterTime] = useState<string>('ALL');

  useEffect(() => {
    api.spatiotemporal()
      .then(d => setClusters(d.clusters || []))
      .catch(() => setClusters([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterTime === 'ALL' ? clusters : clusters.filter(c => c.time_bucket === filterTime);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || filtered.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width = canvas.offsetWidth * 2;
    const h = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, w, h);

    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;

    // Background
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, cw, ch);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < cw; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
    for (let y = 0; y < ch; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }

    // Normalize coordinates
    const lats = filtered.map(c => c.lat);
    const lngs = filtered.map(c => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const pad = 0.02;
    const latRange = (maxLat - minLat) || 1;
    const lngRange = (maxLng - minLng) || 1;

    const toX = (lng: number) => ((lng - minLng + pad) / (lngRange + 2 * pad)) * (cw - 60) + 30;
    const toY = (lat: number) => ch - ((lat - minLat + pad) / (latRange + 2 * pad)) * (ch - 60) - 30;

    // Draw clusters
    const maxFreq = Math.max(...filtered.map(c => c.frequency), 1);
    filtered.forEach(c => {
      const x = toX(c.lng);
      const y = toY(c.lat);
      const radius = 5 + (c.frequency / maxFreq) * 20;
      const color = SEVERITY_COLORS[c.severity_level] || '#8395a7';

      // Glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
      gradient.addColorStop(0, color + '60');
      gradient.addColorStop(1, color + '00');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [filtered]);

  const timeBuckets = ['ALL', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Spatiotemporal Crime Map</h1>
        <div style={styles.filters}>
          {timeBuckets.map(b => (
            <button key={b} onClick={() => setFilterTime(b)}
              style={{ ...styles.filterBtn, ...(filterTime === b ? styles.filterBtnActive : {}) }}>
              {b === 'ALL' ? 'All Times' : b.charAt(0) + b.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <canvas ref={canvasRef} style={styles.canvas} />
        {loading && <div style={styles.loadingOverlay}>Loading map data...</div>}
        {!loading && filtered.length === 0 && (
          <div style={styles.emptyOverlay}>
            No spatial data available. Run the pipeline with --source real to load coordinates.
          </div>
        )}
      </div>

      <div style={styles.legend}>
        <span style={styles.legendTitle}>Severity:</span>
        {Object.entries(SEVERITY_COLORS).map(([k, v]) => (
          <span key={k} style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: v }} />
            {k}
          </span>
        ))}
        <span style={{ ...styles.legendTitle, marginLeft: 24 }}>Circle size = crime frequency</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px 32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const, gap: 12 },
  title: { fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 },
  filters: { display: 'flex', gap: 8 },
  filterBtn: {
    padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)', color: '#8395a7', cursor: 'pointer', fontSize: 13,
  },
  filterBtnActive: { background: '#2eD573', color: '#0a1628', border: '1px solid #2eD573', fontWeight: 600 },
  canvas: { width: '100%', height: 500, borderRadius: 12, display: 'block' },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#8395a7', fontSize: 16,
  },
  emptyOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#8395a7', fontSize: 14,
  },
  legend: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' as const },
  legendTitle: { fontSize: 13, color: '#8395a7' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c8d6e5' },
  legendDot: { width: 10, height: 10, borderRadius: '50%' },
};

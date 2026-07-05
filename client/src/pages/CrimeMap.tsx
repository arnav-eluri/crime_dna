import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { SpatiotemporalCluster } from '../types';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

const HeatmapLayer = ({ points }: { points: [number, number, number][] }) => {
  const map = useMap();
  
  useEffect(() => {
    // @ts-ignore
    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 20,
      maxZoom: 13,
      max: Math.max(...points.map(p => p[2]), 1),
      gradient: {
        0.2: '#3b82f6', // blue
        0.4: '#22d3ee', // cyan
        0.6: '#22c55e', // green
        0.8: '#eab308', // yellow
        1.0: '#ef4444'  // red
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ff4757',
  HIGH: '#ffa502',
  LOW: '#2eD573',
};

export default function CrimeMap() {
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
  const maxFreq = Math.max(...filtered.map(c => c.frequency), 1);
  const timeBuckets = ['ALL', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];

  // Default to Bangalore coordinates if no data
  const center: [number, number] = [12.9716, 77.5946];

  const points: [number, number, number][] = filtered.map(c => [c.lat, c.lng, c.frequency]);

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

      <div style={{ position: 'relative', height: 500, borderRadius: 12, overflow: 'hidden' }}>
        <MapContainer center={center} zoom={11} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <HeatmapLayer points={points} />
        </MapContainer>

        {loading && <div style={styles.loadingOverlay}>Loading map data...</div>}
        {!loading && filtered.length === 0 && (
          <div style={styles.emptyOverlay}>
            No spatial data available. Run the pipeline with --source real to load coordinates.
          </div>
        )}
      </div>

      <div style={styles.legend}>
        <span style={styles.legendTitle}>Heatmap Intensity:</span>
        <div style={styles.gradientBar} />
        <span style={styles.legendLabels}>
          <span>Low (Blue)</span>
          <span>Medium (Green/Yellow)</span>
          <span>High (Red)</span>
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 'var(--spacing-container-padding)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const, gap: 12 },
  title: { fontFamily: 'var(--font-family-display)', fontSize: 28, fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 },
  filters: { display: 'flex', gap: 8 },
  filterBtn: {
    padding: '8px 16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--color-surface-container-highest)',
    background: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface-variant)', cursor: 'pointer', 
    fontFamily: 'var(--font-family-body)', fontSize: 13, transition: 'all 0.2s', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.02)'
  },
  filterBtnActive: { background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', borderColor: 'var(--color-primary-container)', fontWeight: 600, boxShadow: '0px 4px 8px rgba(59, 130, 246, 0.2)' },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--color-on-surface)', fontSize: 16, fontFamily: 'var(--font-family-body)',
    background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)'
  },
  emptyOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--color-on-surface-variant)', fontSize: 14, fontFamily: 'var(--font-family-body)',
    background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)'
  },
  legend: { display: 'flex', flexDirection: 'column' as const, gap: 8, marginTop: 16, maxWidth: 400 },
  legendTitle: { fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--color-on-surface-variant)', fontWeight: 600 },
  gradientBar: {
    height: 12,
    borderRadius: 6,
    background: 'linear-gradient(to right, #3b82f6, #22d3ee, #22c55e, #eab308, #ef4444)'
  },
  legendLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: 'var(--font-family-body)',
    fontSize: 11,
    color: 'var(--color-on-surface-variant)',
    opacity: 0.8
  }
};

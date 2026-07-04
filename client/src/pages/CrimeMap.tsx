import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { SpatiotemporalCluster } from '../types';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filtered.map((c, i) => (
            <CircleMarker
              key={i}
              center={[c.lat, c.lng]}
              radius={5 + (c.frequency / maxFreq) * 20}
              pathOptions={{
                color: SEVERITY_COLORS[c.severity_level] || '#8395a7',
                fillColor: SEVERITY_COLORS[c.severity_level] || '#8395a7',
                fillOpacity: 0.6,
                weight: 2
              }}
            >
              <Tooltip>
                <div>
                  <strong>Severity:</strong> {c.severity_level}<br />
                  <strong>Frequency:</strong> {c.frequency}<br />
                  <strong>Time Bucket:</strong> {c.time_bucket}
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>

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
  container: { padding: 'var(--spacing-container-padding)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const, gap: 12 },
  title: { fontFamily: 'var(--font-family-display)', fontSize: 28, fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 },
  filters: { display: 'flex', gap: 8 },
  filterBtn: {
    padding: '8px 16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--color-surface-container-highest)',
    background: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface-variant)', cursor: 'pointer', 
    fontFamily: 'var(--font-family-body)', fontSize: 13, transition: 'all 0.2s', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.02)'
  },
  filterBtnActive: { background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', borderColor: 'var(--color-primary-container)', fontWeight: 600, boxShadow: '0px 4px 8px rgba(202, 138, 4, 0.2)' },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--color-on-surface)', fontSize: 16, fontFamily: 'var(--font-family-body)',
    background: 'rgba(255, 255, 255, 0.8)', zIndex: 1000, backdropFilter: 'blur(4px)'
  },
  emptyOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--color-on-surface-variant)', fontSize: 14, fontFamily: 'var(--font-family-body)',
    background: 'rgba(255, 255, 255, 0.8)', zIndex: 1000, backdropFilter: 'blur(4px)'
  },
  legend: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' as const },
  legendTitle: { fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--color-on-surface-variant)' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-family-body)', fontSize: 12, color: 'var(--color-on-surface)' },
  legendDot: { width: 10, height: 10, borderRadius: '50%' },
};

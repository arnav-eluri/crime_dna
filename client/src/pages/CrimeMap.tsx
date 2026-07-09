import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import { SpatiotemporalCluster } from '../types';
import { MapContainer, TileLayer, useMap, useMapEvents, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import { useMediaQuery } from '../utils';
import MobileHeader from '../components/MobileHeader';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ff4757',
  HIGH: '#ffa502',
  LOW: '#2eD573',
};

function HeatmapLayer({ data }: { data: SpatiotemporalCluster[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !data || data.length === 0) return;
    
    const maxFreq = Math.max(...data.map(c => c.frequency), 1);
    const points = data.map(c => [c.lat, c.lng, (c.frequency / maxFreq)]);
    
    // @ts-ignore - leaflet.heat types might be missing or incomplete
    const heat = L.heatLayer(points, {
      radius: 20,
      blur: 15,
      maxZoom: 11,
      gradient: {
        0.4: '#2eD573', 
        0.7: '#ffa502', 
        1.0: '#ff4757'  
      }
    }).addTo(map);
    
    return () => {
      map.removeLayer(heat);
    };
  }, [map, data]);
  
  return null;
}

function DynamicCrimeLayer({ data }: { data: SpatiotemporalCluster[] }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [bounds, setBounds] = useState(map.getBounds());

  useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
      setBounds(map.getBounds());
    },
    moveend: () => {
      setBounds(map.getBounds());
    }
  });

  const maxFreq = useMemo(() => Math.max(...data.map(c => c.frequency), 1), [data]);

  // When zoomed out, use the highly performant canvas heatmap
  if (zoom < 10) {
    return <HeatmapLayer data={data} />;
  }

  // When zoomed in, filter points to current bounds to prevent SVG lag, and show interactive markers
  const visibleData = data.filter(c => bounds.contains([c.lat, c.lng]));

  return (
    <>
      {visibleData.map((c, i) => (
        <CircleMarker
          key={`${c.lat}-${c.lng}-${c.time_bucket}-${i}`}
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
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 12 }}>
              <strong style={{ color: SEVERITY_COLORS[c.severity_level] }}>{c.severity_level} RISK</strong><br />
              Frequency: {c.frequency}<br />
              Time: {c.time_bucket}
            </div>
          </Tooltip>
          <Popup>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, minWidth: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: SEVERITY_COLORS[c.severity_level] }}></div>
                <strong style={{ color: SEVERITY_COLORS[c.severity_level], fontSize: 14 }}>{c.severity_level} RISK</strong>
              </div>
              
              <p style={{ margin: '0 0 12px 0', color: '#514535', lineHeight: 1.4 }}>
                This location is colored <b>{c.severity_level === 'LOW' ? 'green' : c.severity_level === 'HIGH' ? 'orange' : 'red'}</b> because it has a {c.severity_level.toLowerCase()} severity index, indicating {c.severity_level === 'LOW' ? 'minor infractions or non-violent incidents' : c.severity_level === 'HIGH' ? 'elevated crime rates requiring attention' : 'critical, high-priority emergency incidents'}.
              </p>
              
              <strong style={{ color: '#191c1d', fontSize: 12, textTransform: 'uppercase' }}>Related Cases in Cluster:</strong>
              <ul style={{ margin: '6px 0', paddingLeft: 16, color: '#514535' }}>
                {Object.entries(c.crime_categories || {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4)
                  .map(([type, count]) => (
                    <li key={type} style={{ marginBottom: 4 }}>
                      {type} <b>({count})</b>
                    </li>
                  ))}
              </ul>
              
              <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #eee', fontSize: 11, color: '#837562' }}>
                Total recorded incidents: {c.frequency}<br/>
                Timeframe: {c.time_bucket}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}

export default function CrimeMap() {
  const [clusters, setClusters] = useState<SpatiotemporalCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    api.spatiotemporal()
      .then(d => setClusters(d.clusters || []))
      .catch(() => setClusters([]))
      .finally(() => setLoading(false));
  }, []);

  const criticalCount = clusters.filter(c => c.severity_level === 'CRITICAL').length;

  // Default to Karnataka center coordinates
  const center: [number, number] = [15.3173, 75.7139];

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <MapContainer center={center} zoom={7} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <DynamicCrimeLayer data={clusters} />
        </MapContainer>
      </div>

      {/* Top Header Layer */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          {isMobile ? <MobileHeader /> : (
            <div style={{ padding: '40px 40px 0' }}>
              <h1 style={styles.title}>Spatiotemporal Crime Map</h1>
            </div>
          )}
        </div>
      </div>
        
      {/* Bottom Floating Panel */}
      <div style={{ position: 'absolute', bottom: isMobile ? 110 : 40, left: 0, right: 0, zIndex: 10, pointerEvents: 'none', display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start' }}>
        <div style={{ ...styles.floatingPanel, margin: isMobile ? '0 16px' : '0 40px', width: isMobile ? 'calc(100% - 32px)' : 'auto', maxWidth: 400 }}>
          <div style={styles.feedLabel}>LIVE SPATIAL INTEL</div>
          <h2 style={styles.panelTitle}>Geospatial Analysis</h2>
          <p style={styles.insightText}>
            Spatial intelligence actively mapping {clusters.length} incident clusters across the jurisdiction. 
            {criticalCount > 0 && <span style={{ color: '#ff4757', fontWeight: 600 }}> {criticalCount} zones require immediate tactical review.</span>}
          </p>
          
          <div style={styles.legend}>
            {Object.entries(SEVERITY_COLORS).map(([k, v]) => (
              <span key={k} style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: v }} />
                {k}
              </span>
            ))}
          </div>
          <div style={styles.insightTextMicro}>* Circle radii correspond to incident frequency volume.</div>
        </div>
      </div>

      {loading && <div style={styles.loadingOverlay}>Initializing satellite feed...</div>}
      {!loading && clusters.length === 0 && (
        <div style={styles.emptyOverlay}>
          <div style={styles.emptyCard}>
            <h3 style={styles.panelTitle}>No Spatial Data</h3>
            <p style={styles.insightText}>Geospatial coordinates unavailable. Run pipeline with real coordinates enabled.</p>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontFamily: 'var(--font-family-display)', fontSize: 24, fontWeight: 700, color: '#191c1d', margin: 0, textShadow: '0 2px 10px rgba(255,255,255,0.8)' },
  floatingPanel: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    padding: '20px',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    pointerEvents: 'auto',
    border: '1px solid rgba(255,255,255,0.5)',
    maxWidth: 400,
  },
  feedLabel: { fontFamily: 'var(--font-family-mono)', fontSize: 10, letterSpacing: 1.5, color: '#837562', fontWeight: 600, marginBottom: 4 },
  panelTitle: { fontFamily: 'var(--font-family-display)', fontSize: 18, fontWeight: 700, color: '#191c1d', margin: '0 0 12px 0' },
  insightText: { fontFamily: 'var(--font-family-body)', fontSize: 13, color: '#514535', margin: '0 0 16px 0', lineHeight: 1.5 },
  insightTextMicro: { fontFamily: 'var(--font-family-body)', fontSize: 10, color: '#837562', marginTop: 12, fontStyle: 'italic' },
  legend: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const, background: 'rgba(0,0,0,0.03)', padding: '8px 12px', borderRadius: 8 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-family-mono)', fontSize: 11, color: '#191c1d', fontWeight: 600 },
  legendDot: { width: 8, height: 8, borderRadius: '50%' },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#191c1d', fontSize: 14, fontFamily: 'var(--font-family-mono)', fontWeight: 600, letterSpacing: 1,
    background: 'rgba(255, 255, 255, 0.9)', zIndex: 1000, backdropFilter: 'blur(8px)'
  },
  emptyOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, pointerEvents: 'none'
  },
  emptyCard: {
    background: 'white', padding: 24, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    textAlign: 'center', maxWidth: 300, pointerEvents: 'auto'
  }
};

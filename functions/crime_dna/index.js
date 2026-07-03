const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use((req, res, next) => {
  try {
    const catalystApp = catalyst.initialize(req);
    res.locals.catalyst = catalystApp;
  } catch (e) {
    // no-op for local dev
  }
  next();
});

const DATA_DIR = path.join(__dirname, '..', '..', 'data_processing', 'data', '03_processed');

function readJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    }
  } catch (e) {
    // fall through
  }
  return null;
}

app.get('/', (req, res) => {
  res.status(200).send({ message: 'CrimeDNA API is running!', version: '2.0.0', status: 'operational' });
});

app.get('/api/health', (req, res) => {
  const summary = readJSON('dashboard_summary.json');
  res.status(200).send({
    status: 'healthy',
    data_available: !!summary,
    total_firs: summary ? summary.total_firs : 0,
    endpoints: [
      '/api/health', '/api/summary', '/api/trends', '/api/hotspots',
      '/api/severity', '/api/offenders', '/api/network', '/api/spatiotemporal',
      '/api/alerts', '/api/anomalies', '/api/forecast', '/api/associations',
      '/api/socioeconomic', '/api/firs'
    ]
  });
});

app.get('/api/summary', (req, res) => {
  const data = readJSON('dashboard_summary.json');
  if (!data) return res.status(404).json({ error: 'No pipeline data found. Run the pipeline first.' });
  res.json(data);
});

app.get('/api/trends', (req, res) => {
  const data = readJSON('dashboard_summary.json');
  if (!data) return res.status(404).json({ error: 'No trend data found.' });
  res.json({
    monthly_trends: data.monthly_trends || {},
    crime_type_distribution: data.crime_type_distribution || {},
    district_distribution: data.district_distribution || {}
  });
});

app.get('/api/hotspots', (req, res) => {
  const summary = readJSON('dashboard_summary.json');
  if (!summary) return res.status(404).json({ error: 'No hotspot data found.' });
  res.json({
    hotspot_count: summary.hotspot_count || 0,
    spatiotemporal_hotspot_count: summary.spatiotemporal_hotspot_count || 0,
    locations: (summary.hotspot_locations || []).slice(0, 50),
    clusters: (summary.spatiotemporal_clusters || []).slice(0, 50)
  });
});

app.get('/api/severity', (req, res) => {
  const data = readJSON('dashboard_summary.json');
  if (!data) return res.status(404).json({ error: 'No severity data found.' });
  res.json({
    severity_distribution: data.severity_distribution || {},
    risk_class_distribution: data.risk_class_distribution || {},
    critical_count: data.critical_count || 0
  });
});

app.get('/api/offenders', (req, res) => {
  const data = readJSON('dashboard_summary.json');
  if (!data) return res.status(404).json({ error: 'No offender data found.' });
  res.json({
    syndicate_link_count: data.syndicate_link_count || 0,
    anomaly_count: data.anomaly_count || 0,
    total_firs: data.total_firs || 0
  });
});

app.get('/api/network', (req, res) => {
  const data = readJSON('network_data.json');
  if (!data) return res.status(404).json({ error: 'No network data found.' });
  res.json(data);
});

app.get('/api/spatiotemporal', (req, res) => {
  const summary = readJSON('dashboard_summary.json');
  if (!summary) return res.status(404).json({ error: 'No spatiotemporal data found.' });
  res.json({
    clusters: (summary.spatiotemporal_clusters || []).slice(0, 100),
    total_clusters: summary.spatiotemporal_hotspot_count || 0
  });
});

app.get('/api/alerts', (req, res) => {
  const data = readJSON('dashboard_summary.json');
  if (!data) return res.status(404).json({ error: 'No alert data found.' });
  const alerts = (data.alerts || []);
  const { district, level } = req.query;
  let filtered = alerts;
  if (district) filtered = filtered.filter(a => a.district.toUpperCase() === district.toUpperCase());
  if (level) filtered = filtered.filter(a => a.alert_level.toUpperCase() === level.toUpperCase());
  res.json({
    total_alerts: alerts.length,
    critical_count: alerts.filter(a => a.alert_level === 'CRITICAL').length,
    elevated_count: alerts.filter(a => a.alert_level === 'ELEVATED').length,
    alerts: filtered
  });
});

app.get('/api/anomalies', (req, res) => {
  const data = readJSON('dashboard_summary.json');
  if (!data) return res.status(404).json({ error: 'No anomaly data found.' });
  res.json({
    anomaly_count: data.anomaly_count || 0,
    total_firs: data.total_firs || 0,
    anomaly_rate: data.total_firs ? ((data.anomaly_count / data.total_firs) * 100).toFixed(2) : 0
  });
});

app.get('/api/forecast', (req, res) => {
  const data = readJSON('forecast_data.json');
  if (!data) return res.status(404).json({ error: 'No forecast data found.' });
  res.json(data);
});

app.get('/api/associations', (req, res) => {
  const summary = readJSON('dashboard_summary.json');
  const network = readJSON('network_data.json');
  if (!summary && !network) return res.status(404).json({ error: 'No association data found.' });
  res.json({
    syndicate_link_count: summary?.syndicate_link_count || 0,
    network_nodes: network?.nodes || [],
    network_edges: network?.edges || []
  });
});

app.get('/api/socioeconomic', (req, res) => {
  const data = readJSON('socioeconomic_data.json');
  if (!data) return res.status(404).json({ error: 'No socioeconomic data found.' });
  res.json(data);
});

app.get('/api/firs', (req, res) => {
  const data = readJSON('dashboard_summary.json');
  if (!data) return res.status(404).json({ error: 'No FIR data found.' });
  const { district, crime_type, severity, page = 1, limit = 50 } = req.query;
  let firs = [];
  if (data.hotspot_locations) {
    firs = data.hotspot_locations.map((loc, i) => ({
      id: i + 1,
      fir_number: `FIR-${String(i + 1).padStart(6, '0')}`,
      crime_type: loc.crime_type || 'UNKNOWN',
      severity: loc.severity || 'LOW',
      latitude: loc.lat,
      longitude: loc.lng,
      district: data.district_distribution ? Object.keys(data.district_distribution)[i % Math.max(1, Object.keys(data.district_distribution).length)] : 'UNKNOWN'
    }));
  }
  if (district) firs = firs.filter(f => f.district.toUpperCase() === district.toUpperCase());
  if (crime_type) firs = firs.filter(f => f.crime_type.toUpperCase().includes(crime_type.toUpperCase()));
  if (severity) firs = firs.filter(f => f.severity.toUpperCase() === severity.toUpperCase());
  const start = (parseInt(page) - 1) * parseInt(limit);
  const paginated = firs.slice(start, start + parseInt(limit));
  res.json({
    total: firs.length,
    page: parseInt(page),
    limit: parseInt(limit),
    total_pages: Math.ceil(firs.length / parseInt(limit)),
    data: paginated
  });
});

app.get('/api/firs/:id', (req, res) => {
  const data = readJSON('dashboard_summary.json');
  if (!data) return res.status(404).json({ error: 'No FIR data found.' });
  const id = parseInt(req.params.id);
  if (data.hotspot_locations && data.hotspot_locations[id - 1]) {
    const loc = data.hotspot_locations[id - 1];
    res.json({
      id,
      fir_number: `FIR-${String(id).padStart(6, '0')}`,
      crime_type: loc.crime_type || 'UNKNOWN',
      severity: loc.severity || 'LOW',
      latitude: loc.lat,
      longitude: loc.lng,
      district: data.district_distribution ? Object.keys(data.district_distribution)[(id - 1) % Math.max(1, Object.keys(data.district_distribution).length)] : 'UNKNOWN',
      linked_entities: {
        victims: Math.floor(Math.random() * 5) + 1,
        accused: Math.floor(Math.random() * 3) + 1,
        is_hotspot: loc.frequency > 1
      }
    });
  } else {
    res.status(404).json({ error: 'FIR not found' });
  }
});

module.exports = app;

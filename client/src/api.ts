const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:9000';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  health: () => fetchJSON<any>('/api/health'),
  summary: () => fetchJSON<any>('/api/summary'),
  trends: () => fetchJSON<any>('/api/trends'),
  hotspots: () => fetchJSON<any>('/api/hotspots'),
  severity: () => fetchJSON<any>('/api/severity'),
  offenders: () => fetchJSON<any>('/api/offenders'),
  network: () => fetchJSON<any>('/api/network'),
  spatiotemporal: () => fetchJSON<any>('/api/spatiotemporal'),
  alerts: (params?: { district?: string; level?: string }) => {
    const q = new URLSearchParams();
    if (params?.district) q.set('district', params.district);
    if (params?.level) q.set('level', params.level);
    const qs = q.toString();
    return fetchJSON<any>(`/api/alerts${qs ? '?' + qs : ''}`);
  },
  anomalies: () => fetchJSON<any>('/api/anomalies'),
  forecast: () => fetchJSON<any>('/api/forecast'),
  associations: () => fetchJSON<any>('/api/associations'),
  socioeconomic: () => fetchJSON<any>('/api/socioeconomic'),
  firs: (params?: { district?: string; crime_type?: string; severity?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.district) q.set('district', params.district);
    if (params?.crime_type) q.set('crime_type', params.crime_type);
    if (params?.severity) q.set('severity', params.severity);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return fetchJSON<any>(`/api/firs${qs ? '?' + qs : ''}`);
  },
  firDetail: (id: number) => fetchJSON<any>(`/api/firs/${id}`),
};

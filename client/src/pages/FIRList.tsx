import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { FIRRecord } from '../types';

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#D94040',
  HIGH:     '#E09020',
  LOW:      '#2AB4A0',
};

const SEV_DIM: Record<string, string> = {
  CRITICAL: 'rgba(217,64,64,0.12)',
  HIGH:     'rgba(224,144,32,0.12)',
  LOW:      'rgba(42,180,160,0.12)',
};

export default function FIRList() {
  const [firs, setFirs] = useState<FIRRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [search, setSearch] = useState('');
  const [crimeTypes, setCrimeTypes] = useState<string[]>([]);

  const limit = 25;

  useEffect(() => {
    api.trends().then(d => setCrimeTypes(Object.keys(d.crime_type_distribution || {}).sort())).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.firs({ page, limit, crime_type: filterType || undefined, severity: filterSeverity || undefined })
      .then(res => { setFirs(res.data || []); setTotal(res.total || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, filterType, filterSeverity]);

  const displayed = search
    ? firs.filter(f =>
        f.fir_number.toLowerCase().includes(search.toLowerCase()) ||
        f.crime_type.toLowerCase().includes(search.toLowerCase()) ||
        f.district.toLowerCase().includes(search.toLowerCase()))
    : firs;

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
    padding: '9px 14px', color: 'var(--text-hi)', fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-base)', outline: 'none',
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>FIR Records</h1>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-lo)' }}>
          {total.toLocaleString()} records
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Search FIR #, crime type, district..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: '1 1 220px', minWidth: 0 }}
        />
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">All Crime Types</option>
          {crimeTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterSeverity} onChange={e => { setFilterSeverity(e.target.value); setPage(1); }} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['FIR #', 'Crime Type', 'Severity', 'District', 'Coordinates'].map(h => (
                <th key={h} style={{
                  padding: '11px 16px', textAlign: 'left', fontFamily: 'var(--font-body)',
                  fontSize: 11, fontWeight: 600, color: 'var(--text-lo)', letterSpacing: '0.04em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-lo)', fontSize: 'var(--text-base)' }}>Loading...</td></tr>
            ) : displayed.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-lo)', fontSize: 'var(--text-base)' }}>No records found.</td></tr>
            ) : (
              displayed.map(fir => (
                <tr key={fir.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mid)' }}>{fir.fir_number}</td>
                  <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-hi)' }}>{fir.crime_type}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
                      borderRadius: 'var(--r-sm)',
                      background: SEV_DIM[fir.severity] || 'var(--bg-hover)',
                      color: SEV_COLOR[fir.severity] || 'var(--text-lo)',
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                    }}>
                      {fir.severity}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--text-hi)' }}>{fir.district}</td>
                  <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-lo)' }}>
                    {fir.latitude.toFixed(4)}, {fir.longitude.toFixed(4)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 16 }}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{
          padding: '7px 18px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
          background: 'var(--bg-card)', color: page <= 1 ? 'var(--text-lo)' : 'var(--text-mid)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', cursor: page <= 1 ? 'default' : 'pointer',
        }}>
          ← Previous
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-lo)' }}>
          {page} / {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{
          padding: '7px 18px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
          background: 'var(--bg-card)', color: page >= totalPages ? 'var(--text-lo)' : 'var(--text-mid)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', cursor: page >= totalPages ? 'default' : 'pointer',
        }}>
          Next →
        </button>
      </div>
    </div>
  );
}

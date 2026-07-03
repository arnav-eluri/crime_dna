import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { FIRRecord } from '../types';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ff4757',
  HIGH: '#ffa502',
  LOW: '#2eD573',
};

export default function FIRList() {
  const [firs, setFirs] = useState<FIRRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [search, setSearch] = useState('');

  const limit = 25;

  useEffect(() => {
    setLoading(true);
    api.firs({
      page,
      limit,
      crime_type: filterType || undefined,
      severity: filterSeverity || undefined,
    }).then(res => {
      setFirs(res.data || []);
      setTotal(res.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page, filterType, filterSeverity]);

  const filtered = search
    ? firs.filter(f =>
        f.fir_number.toLowerCase().includes(search.toLowerCase()) ||
        f.crime_type.toLowerCase().includes(search.toLowerCase()) ||
        f.district.toLowerCase().includes(search.toLowerCase())
      )
    : firs;

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>FIR Records</h1>
        <span style={styles.total}>{total} total records</span>
      </div>

      <div style={styles.filters}>
        <input
          placeholder="Search FIR #, crime type, district..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={styles.select}>
          <option value="">All Crime Types</option>
          {Array.from(new Set(firs.map(f => f.crime_type))).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} style={styles.select}>
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>FIR #</th>
              <th style={styles.th}>Crime Type</th>
              <th style={styles.th}>Severity</th>
              <th style={styles.th}>District</th>
              <th style={styles.th}>Coordinates</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={styles.loadingCell}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={styles.loadingCell}>No records found.</td></tr>
            ) : (
              filtered.map(fir => (
                <tr key={fir.id} style={styles.row}>
                  <td style={styles.td}>{fir.fir_number}</td>
                  <td style={styles.td}>{fir.crime_type}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      background: SEVERITY_COLORS[fir.severity] || '#576574',
                    }}>
                      {fir.severity}
                    </span>
                  </td>
                  <td style={styles.td}>{fir.district}</td>
                  <td style={{ ...styles.td, fontSize: 12, color: '#576574' }}>
                    {fir.latitude.toFixed(4)}, {fir.longitude.toFixed(4)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={styles.pageBtn}>
          ← Previous
        </button>
        <span style={styles.pageInfo}>
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={styles.pageBtn}>
          Next →
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px 32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 },
  total: { fontSize: 14, color: '#8395a7' },
  filters: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' as const },
  searchInput: {
    flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)', color: '#c8d6e5', fontSize: 14, outline: 'none',
  },
  select: {
    padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)', color: '#c8d6e5', fontSize: 14, cursor: 'pointer', outline: 'none',
  },
  tableContainer: {
    background: 'rgba(255,255,255,0.02)', borderRadius: 12, overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    padding: '12px 16px', textAlign: 'left' as const, fontSize: 12, fontWeight: 600,
    color: '#8395a7', textTransform: 'uppercase' as const, letterSpacing: 1,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  td: {
    padding: '12px 16px', fontSize: 13, color: '#c8d6e5',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  },
  row: { transition: 'background 0.15s' },
  loadingCell: { padding: 40, textAlign: 'center' as const, color: '#576574', fontSize: 14 },
  badge: {
    padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#fff',
  },
  pagination: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20,
  },
  pageBtn: {
    padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)', color: '#c8d6e5', cursor: 'pointer', fontSize: 13,
    opacity: 1,
  },
  pageInfo: { fontSize: 13, color: '#8395a7' },
};

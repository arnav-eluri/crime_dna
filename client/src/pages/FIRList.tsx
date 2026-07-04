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
                  <td style={{ ...styles.td, fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
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
  container: { padding: 'var(--spacing-container-padding)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: 'var(--font-family-display)', fontSize: 28, fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 },
  total: { fontFamily: 'var(--font-family-body)', fontSize: 14, color: 'var(--color-on-surface-variant)' },
  filters: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' as const },
  searchInput: {
    flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--color-surface-container-highest)',
    background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)', fontFamily: 'var(--font-family-body)', fontSize: 14, outline: 'none', transition: 'all 0.2s',
  },
  select: {
    padding: '10px 16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--color-surface-container-highest)',
    background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)', fontFamily: 'var(--font-family-body)', fontSize: 14, cursor: 'pointer', outline: 'none',
  },
  tableContainer: {
    background: 'var(--color-surface-container-lowest)', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.04)', border: '1px solid var(--color-surface-container-highest)',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    padding: '12px 16px', textAlign: 'left' as const, fontFamily: 'var(--font-family-body)', fontSize: 12, fontWeight: 600,
    color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' as const, letterSpacing: 1,
    borderBottom: '1px solid var(--color-surface-container-highest)',
  },
  td: {
    padding: '12px 16px', fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--color-on-surface)',
    borderBottom: '1px solid var(--color-surface-container-high)',
  },
  row: { transition: 'background 0.15s' },
  loadingCell: { padding: 40, textAlign: 'center' as const, color: 'var(--color-on-surface-variant)', fontSize: 14, fontFamily: 'var(--font-family-body)' },
  badge: {
    padding: '2px 10px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-family-mono)', fontSize: 11, fontWeight: 700, color: '#fff',
  },
  pagination: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20,
  },
  pageBtn: {
    padding: '8px 20px', borderRadius: 'var(--radius-default)', border: '1px solid var(--color-surface-container-highest)',
    background: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface)', cursor: 'pointer', fontFamily: 'var(--font-family-body)', fontSize: 13,
    transition: 'all 0.2s', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.02)',
  },
  pageInfo: { fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--color-on-surface-variant)' },
};

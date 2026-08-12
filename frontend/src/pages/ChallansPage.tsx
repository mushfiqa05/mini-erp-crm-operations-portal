import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { Challan } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Eye } from 'lucide-react';

export const ChallansPage: React.FC = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { hasRole } = useAuth();
  const canCreate = hasRole(['Admin', 'Sales']);

  const loadChallans = async () => {
    setLoading(true);
    let url = `/challans?page=${page}&limit=10`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;

    const res = await apiRequest<{ challans: Challan[]; pagination: any }>(url);
    if (res.success && res.data) {
      setChallans(res.data.challans);
      setTotalPages(res.data.pagination.totalPages);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadChallans();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadChallans();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Sales Challans Workflow</h1>
        {canCreate && (
          <Link to="/challans/new" className="btn btn-primary">
            <Plus size={18} /> Create Sales Challan
          </Link>
        )}
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '38px' }}
              placeholder="Search by challan number, customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button type="submit" className="btn btn-secondary">Search</button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading sales challans...</div>
        ) : challans.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No sales challans recorded matching your search.
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Customer Name</th>
                  <th>Business Name</th>
                  <th>Total Quantity</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/challans/${c.id}`} style={{ fontWeight: 700 }}>
                        {c.challan_number}
                      </Link>
                    </td>
                    <td>{c.customer_name}</td>
                    <td>{c.business_name || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{c.total_quantity}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>{c.created_by}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/challans/${c.id}`} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                        <Eye size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

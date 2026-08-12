import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { Customer } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Eye, Edit } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { hasRole } = useAuth();
  const canEdit = hasRole(['Admin', 'Sales']);

  const loadCustomers = async () => {
    setLoading(true);
    let url = `/customers?page=${page}&limit=10`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
    if (typeFilter) url += `&customer_type=${encodeURIComponent(typeFilter)}`;

    const res = await apiRequest<{ customers: Customer[]; pagination: any }>(url);
    if (res.success && res.data) {
      setCustomers(res.data.customers);
      setTotalPages(res.data.pagination.totalPages);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, [page, statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCustomers();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Customer CRM Directory</h1>
        {canEdit && (
          <Link to="/customers/new" className="btn btn-primary">
            <Plus size={18} /> Add New Customer
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
              placeholder="Search by name, email, mobile, business..."
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
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            className="form-control"
            style={{ width: '160px' }}
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
          </select>

          <button type="submit" className="btn btn-secondary">Search</button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading customers...</div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No customers found matching your criteria.
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Business Name</th>
                  <th>Mobile / Email</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/customers/${c.id}`} style={{ fontWeight: 600 }}>
                        {c.customer_name}
                      </Link>
                    </td>
                    <td>{c.business_name || '—'}</td>
                    <td>
                      <div>{c.mobile}</div>
                      {c.email && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.email}</div>}
                    </td>
                    <td><span className="badge badge-purple">{c.customer_type}</span></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>{c.follow_up_date ? new Date(c.follow_up_date).toLocaleDateString() : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Link to={`/customers/${c.id}`} className="btn btn-secondary" style={{ padding: '6px 12px' }} title="View Profile">
                          <Eye size={14} />
                        </Link>
                        {canEdit && (
                          <Link to={`/customers/${c.id}?edit=true`} className="btn btn-secondary" style={{ padding: '6px 12px' }} title="Edit Customer">
                            <Edit size={14} />
                          </Link>
                        )}
                      </div>
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

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { DashboardStats } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Users, Package, AlertTriangle, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      const res = await apiRequest<DashboardStats>('/dashboard/stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
      setLoading(false);
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading operational metrics...</div>;
  }

  if (!stats) {
    return <div className="alert alert-danger">Failed to load dashboard metrics.</div>;
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card blue">
          <div>
            <div className="stat-label">TOTAL CUSTOMERS</div>
            <div className="stat-value">{stats.totalCustomers}</div>
          </div>
          <div className="stat-icon-wrapper">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card green">
          <div>
            <div className="stat-label">TOTAL PRODUCTS</div>
            <div className="stat-value">{stats.totalProducts}</div>
          </div>
          <div className="stat-icon-wrapper">
            <Package size={22} />
          </div>
        </div>

        <div className="stat-card warning">
          <div>
            <div className="stat-label">LOW STOCK ITEMS</div>
            <div className="stat-value">{stats.lowStockCount}</div>
          </div>
          <div className="stat-icon-wrapper">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="stat-card purple">
          <div>
            <div className="stat-label">PENDING CHALLANS</div>
            <div className="stat-value">{stats.challanCounts.Draft || 0}</div>
          </div>
          <div className="stat-icon-wrapper">
            <FileText size={22} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Low Stock Alerts Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--amber-text)' }}>
              <AlertTriangle size={18} />
              <h3 className="card-title" style={{ margin: 0 }}>Low Stock Warnings</h3>
            </div>
            <Link to="/inventory" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              View Inventory <ArrowRight size={14} />
            </Link>
          </div>

          {stats.lowStockProducts.length === 0 ? (
            <div style={{ color: 'var(--emerald-text)', fontSize: '0.86rem', textAlign: 'center', padding: '24px 16px', background: 'var(--emerald-bg)', border: '1px solid var(--emerald-border)', borderRadius: 'var(--radius-sm)' }}>
              <ShieldCheck size={20} style={{ margin: '0 auto 6px auto' }} />
              <div>All product inventory levels are healthy!</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Stock</th>
                    <th>Min Limit</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lowStockProducts.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.product_name}</strong></td>
                      <td><code className="code-tag">{p.sku}</code></td>
                      <td>
                        <span className="badge badge-warning">{p.current_stock} units</span>
                      </td>
                      <td>{p.minimum_stock} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Challans Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Sales Challans</h3>
            <Link to="/challans" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              All Challans <ArrowRight size={14} />
            </Link>
          </div>

          {stats.recentChallans.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', textAlign: 'center', padding: '24px 16px' }}>
              No sales challans recorded yet.
            </p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Challan #</th>
                    <th>Customer</th>
                    <th>Qty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentChallans.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/challans/${c.id}`}>
                          <code className="code-tag">{c.challan_number}</code>
                        </Link>
                      </td>
                      <td>{c.customer_name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{c.total_quantity}</td>
                      <td><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

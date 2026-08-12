import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, AlertTriangle, Edit } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { hasRole } = useAuth();
  const canEdit = hasRole(['Admin', 'Warehouse']);

  const loadProducts = async () => {
    setLoading(true);
    let url = `/products?page=${page}&limit=10`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
    if (lowStockOnly) url += `&low_stock=true`;

    const res = await apiRequest<{ products: Product[]; pagination: any }>(url);
    if (res.success && res.data) {
      setProducts(res.data.products);
      setTotalPages(res.data.pagination.totalPages);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, [page, categoryFilter, lowStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Product Catalog</h1>
        {canEdit && (
          <Link to="/products/new" className="btn btn-primary">
            <Plus size={18} /> Add New Product
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
              placeholder="Search by product name, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }}
            />
            <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
            Show Low Stock Products Only
          </label>

          <button type="submit" className="btn btn-secondary">Search</button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading products...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No products found matching your filter criteria.
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Unit Price (₹)</th>
                  <th>Current Stock</th>
                  <th>Min Limit</th>
                  <th>Warehouse Location</th>
                  {canEdit && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isLowStock = p.current_stock <= p.minimum_stock;
                  return (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.product_name}</strong>
                      </td>
                      <td><code>{p.sku}</code></td>
                      <td><span className="badge badge-purple">{p.category}</span></td>
                      <td>₹{Number(p.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>
                        <span className={`badge ${isLowStock ? 'badge-danger' : 'badge-success'}`}>
                          {p.current_stock} units
                        </span>
                      </td>
                      <td>{p.minimum_stock} units</td>
                      <td>{p.warehouse_location || '—'}</td>
                      {canEdit && (
                        <td style={{ textAlign: 'right' }}>
                          <Link to={`/products/edit/${p.id}`} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                            <Edit size={14} /> Edit
                          </Link>
                        </td>
                      )}
                    </tr>
                  );
                })}
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

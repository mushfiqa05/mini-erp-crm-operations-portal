import React, { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { Product, StockMovement } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Boxes, ArrowUpRight, ArrowDownLeft, Plus, History, AlertTriangle } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'movements'>('summary');
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [reason, setReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadInventory = async () => {
    setLoading(true);
    const res = await apiRequest<Product[]>('/inventory');
    if (res.success && res.data) {
      setProducts(res.data);
    }
    setLoading(false);
  };

  const loadMovements = async () => {
    setLoading(true);
    const res = await apiRequest<{ movements: StockMovement[]; pagination: any }>('/inventory/movements');
    if (res.success && res.data) {
      setMovements(res.data.movements);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'summary') {
      loadInventory();
    } else {
      loadMovements();
    }
  }, [activeTab]);

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!selectedProductId) {
      setModalError('Please select a product.');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setModalError('Quantity must be greater than 0.');
      return;
    }
    if (!reason.trim()) {
      setModalError('Please provide a reason for the stock movement.');
      return;
    }

    setSubmitting(true);
    const res = await apiRequest('/inventory/movements', {
      method: 'POST',
      body: JSON.stringify({
        product_id: parseInt(selectedProductId, 10),
        quantity: qty,
        movement_type: movementType,
        reason: reason.trim()
      })
    });
    setSubmitting(false);

    if (res.success) {
      setShowModal(false);
      setSelectedProductId('');
      setQuantity('1');
      setReason('');
      if (activeTab === 'summary') loadInventory();
      else loadMovements();
    } else {
      setModalError(res.message || 'Failed to log stock movement.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Inventory & Stock Management</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Record Stock Movement (IN / OUT)
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <button
          className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('summary')}
        >
          <Boxes size={18} /> Current Stock Overview
        </button>
        <button
          className={`btn ${activeTab === 'movements' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('movements')}
        >
          <History size={18} /> Stock Movement Audit Log
        </button>
      </div>

      {/* Tab 1: Current Stock Overview */}
      {activeTab === 'summary' && (
        <div className="card">
          {loading ? (
            <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading inventory overview...</div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Current Stock</th>
                    <th>Min Level</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isLow = p.current_stock <= p.minimum_stock;
                    return (
                      <tr key={p.id}>
                        <td><strong>{p.product_name}</strong></td>
                        <td><code>{p.sku}</code></td>
                        <td><span className="badge badge-purple">{p.category}</span></td>
                        <td>{p.warehouse_location || '—'}</td>
                        <td>
                          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--success)' }}>
                            {p.current_stock} units
                          </span>
                        </td>
                        <td>{p.minimum_stock} units</td>
                        <td>
                          {isLow ? (
                            <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={14} /> Low Stock Alert
                            </span>
                          ) : (
                            <span className="badge badge-success">In Stock</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Stock Movements History */}
      {activeTab === 'movements' && (
        <div className="card">
          {loading ? (
            <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading movement logs...</div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Reason</th>
                    <th>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(m.created_at).toLocaleString()}
                      </td>
                      <td><strong>{m.product_name}</strong></td>
                      <td><code>{m.sku}</code></td>
                      <td>
                        {m.movement_type === 'IN' ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowDownLeft size={14} /> IN
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowUpRight size={14} /> OUT
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700 }}>{m.quantity}</td>
                      <td style={{ fontSize: '0.9rem' }}>{m.reason}</td>
                      <td>{m.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stock Movement Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: 0 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
              Record Stock Movement
            </h2>

            {modalError && (
              <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateMovement}>
              <div className="form-group">
                <label className="form-label">Select Product *</label>
                <select
                  className="form-control"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} ({p.sku}) — Available Stock: {p.current_stock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Movement Type *</label>
                  <select
                    className="form-control"
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as 'IN' | 'OUT')}
                  >
                    <option value="IN">IN (Add Stock)</option>
                    <option value="OUT">OUT (Reduce Stock)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Reference *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Shipment received, Stock audit correction, Damaged item return"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Recording...' : 'Submit Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

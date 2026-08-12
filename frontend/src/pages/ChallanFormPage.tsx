import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { Customer, Product } from '../types';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';

interface SelectedItem {
  product_id: string;
  quantity: number;
}

export const ChallanFormPage: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<SelectedItem[]>([
    { product_id: '', quantity: 1 }
  ]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const [custRes, prodRes] = await Promise.all([
        apiRequest<{ customers: Customer[] }>('/customers?limit=100'),
        apiRequest<{ products: Product[] }>('/products?limit=100')
      ]);

      if (custRes.success && custRes.data) {
        setCustomers(custRes.data.customers);
      }
      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data.products);
      }
      setLoading(false);
    };

    loadInitialData();
  }, []);

  const handleAddItemRow = () => {
    setItems([...items, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof SelectedItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }

    const validItems = items.filter(i => i.product_id && i.quantity > 0);
    if (validItems.length === 0) {
      setError('Please add at least one product with a valid quantity.');
      return;
    }

    setSubmitting(true);
    const res = await apiRequest<{ id: number }>('/challans', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: parseInt(selectedCustomerId, 10),
        items: validItems.map(i => ({
          product_id: parseInt(i.product_id, 10),
          quantity: i.quantity
        }))
      })
    });

    setSubmitting(false);

    if (res.success && res.data) {
      navigate(`/challans/${res.data.id}`);
    } else {
      setError(res.message || 'Failed to create challan.');
    }
  };

  if (loading) return <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading form options...</div>;

  // Calculate totals
  let totalQty = 0;
  let totalVal = 0;

  items.forEach(item => {
    if (item.product_id) {
      const prod = products.find(p => String(p.id) === item.product_id);
      if (prod) {
        totalQty += Number(item.quantity) || 0;
        totalVal += (Number(prod.unit_price) * (Number(item.quantity) || 0));
      }
    }
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate('/challans')} className="btn btn-secondary" style={{ padding: '6px 14px' }}>
          <ArrowLeft size={16} /> Back to Challans
        </button>
      </div>

      <div className="card">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Create New Sales Challan</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
          Draft challans store product snapshots without altering inventory until explicitly confirmed.
        </p>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Customer Selection */}
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label">Select Customer *</label>
            <select
              className="form-control"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.customer_name} {c.business_name ? `(${c.business_name})` : ''} — {c.customer_type}
                </option>
              ))}
            </select>
          </div>

          {/* Product Items Table */}
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Select Products to Add</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {items.map((item, index) => {
              const selectedProduct = products.find(p => String(p.id) === item.product_id);
              const subtotal = selectedProduct ? selectedProduct.unit_price * item.quantity : 0;

              return (
                <div 
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 40px',
                    gap: '12px',
                    alignItems: 'center',
                    background: 'var(--bg-input)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Product</label>
                    <select
                      className="form-control"
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      required
                    >
                      <option value="">-- Select Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.product_name} ({p.sku}) — Stock: {p.current_stock}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Unit Price</label>
                    <div style={{ padding: '10px 0', fontWeight: 600 }}>
                      {selectedProduct ? `₹${Number(selectedProduct.unit_price).toFixed(2)}` : '—'}
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Subtotal</label>
                    <div style={{ padding: '10px 0', fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div style={{ paddingTop: '20px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '8px', color: 'var(--danger)' }}
                      onClick={() => handleRemoveItemRow(index)}
                      disabled={items.length === 1}
                      title="Remove Row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddItemRow}
            style={{ marginBottom: '24px' }}
          >
            <Plus size={16} /> Add Product Line Item
          </button>

          {/* Challan Summary Card */}
          <div style={{ padding: '16px 20px', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Line Items: <strong>{items.length}</strong></span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '20px' }}>Total Items Quantity: <strong>{totalQty} units</strong></span>
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estimated Value: </span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--success)', marginLeft: '8px' }}>
                ₹{totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/challans')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={18} /> {submitting ? 'Saving Draft...' : 'Save Challan as Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

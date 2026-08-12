import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { Product } from '../types';
import { ArrowLeft, Save } from 'lucide-react';

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('0');
  const [minimumStock, setMinimumStock] = useState('5');
  const [warehouseLocation, setWarehouseLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) {
      const fetchProduct = async () => {
        setLoading(true);
        const res = await apiRequest<Product>(`/products/${id}`);
        if (res.success && res.data) {
          const p = res.data;
          setProductName(p.product_name);
          setSku(p.sku);
          setCategory(p.category);
          setUnitPrice(String(p.unit_price));
          setCurrentStock(String(p.current_stock));
          setMinimumStock(String(p.minimum_stock));
          setWarehouseLocation(p.warehouse_location || '');
        } else {
          setError(res.message || 'Failed to fetch product');
        }
        setLoading(false);
      };
      fetchProduct();
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productName.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!sku.trim()) {
      setError('SKU code is required.');
      return;
    }
    if (!category.trim()) {
      setError('Category is required.');
      return;
    }
    if (parseFloat(unitPrice) < 0) {
      setError('Unit price cannot be negative.');
      return;
    }

    setLoading(true);

    const payload = {
      product_name: productName,
      sku,
      category,
      unit_price: parseFloat(unitPrice),
      current_stock: parseInt(currentStock, 10) || 0,
      minimum_stock: parseInt(minimumStock, 10) || 5,
      warehouse_location: warehouseLocation || undefined
    };

    const url = isEdit ? `/products/${id}` : '/products';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await apiRequest<Product>(url, {
      method,
      body: JSON.stringify(payload)
    });

    setLoading(false);

    if (res.success) {
      navigate('/products');
    } else {
      setError(res.message || 'Failed to save product.');
    }
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate('/products')} className="btn btn-secondary" style={{ padding: '6px 14px' }}>
          <ArrowLeft size={16} /> Back to Products
        </button>
      </div>

      <div className="card">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>
          {isEdit ? 'Edit Product Details' : 'Add New Product'}
        </h1>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Wireless Bluetooth Headphones"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">SKU / Code *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. PROD-HEADPHONE-01"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Electronics"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="e.g. 1499.00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
              />
            </div>

            {!isEdit && (
              <div className="form-group">
                <label className="form-label">Initial Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Minimum Stock Alert Limit</label>
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="5"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Warehouse Location</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Warehouse Rack A-1"
                value={warehouseLocation}
                onChange={(e) => setWarehouseLocation(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={18} /> {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

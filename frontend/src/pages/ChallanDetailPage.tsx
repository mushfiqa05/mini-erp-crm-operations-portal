import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { Challan } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Building, Phone, Mail, MapPin } from 'lucide-react';

export const ChallanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const { hasRole } = useAuth();
  const canManage = hasRole(['Admin', 'Sales']);

  const loadChallan = async () => {
    setLoading(true);
    const res = await apiRequest<Challan>(`/challans/${id}`);
    if (res.success && res.data) {
      setChallan(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadChallan();
  }, [id]);

  const handleConfirm = async () => {
    if (!challan) return;
    if (!window.confirm(`Are you sure you want to CONFIRM Challan ${challan.challan_number}? This will validate stock and deduct inventory.`)) return;

    setActionError(null);
    setSuccessMsg(null);
    setProcessing(true);

    const res = await apiRequest<Challan>(`/challans/${id}/confirm`, {
      method: 'POST'
    });

    setProcessing(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Challan confirmed successfully! Inventory updated.');
      loadChallan();
    } else {
      // DISPLAY CLEAR INSUFFICIENT STOCK API ERROR
      setActionError(res.message || 'Failed to confirm challan.');
    }
  };

  const handleCancel = async () => {
    if (!challan) return;
    if (!window.confirm(`Are you sure you want to CANCEL Challan ${challan.challan_number}?`)) return;

    setActionError(null);
    setSuccessMsg(null);
    setProcessing(true);

    const res = await apiRequest<Challan>(`/challans/${id}/cancel`, {
      method: 'POST'
    });

    setProcessing(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Challan cancelled successfully.');
      loadChallan();
    } else {
      setActionError(res.message || 'Failed to cancel challan.');
    }
  };

  if (loading) return <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading sales challan...</div>;
  if (!challan) return <div className="alert alert-danger">Challan record not found.</div>;

  const totalAmount = challan.items ? challan.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) : 0;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/challans')} className="btn btn-secondary" style={{ padding: '6px 14px' }}>
          <ArrowLeft size={16} /> Back to Challans
        </button>

        {canManage && challan.status === 'Draft' && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-danger" onClick={handleCancel} disabled={processing}>
              <XCircle size={18} /> Cancel Draft
            </button>
            <button className="btn btn-success" onClick={handleConfirm} disabled={processing}>
              <CheckCircle size={18} /> {processing ? 'Processing...' : 'Confirm Challan'}
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <div className="alert alert-danger" style={{ marginBottom: '20px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
            <AlertTriangle size={22} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <span>{actionError}</span>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>{challan.challan_number}</h1>
              <StatusBadge status={challan.status} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Created on {new Date(challan.created_at).toLocaleString()} by <strong>{challan.created_by}</strong>
            </p>
          </div>
          {challan.status === 'Draft' && (
            <div className="badge badge-warning" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
              ⚠️ Stock is NOT deducted in Draft status
            </div>
          )}
        </div>

        {/* Customer Snapshot Box */}
        <div style={{ padding: '18px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Customer Information Snapshot
          </h3>
          <div className="form-grid" style={{ fontSize: '0.92rem' }}>
            <div>
              <strong>{challan.customer_name}</strong>
              {challan.business_name && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{challan.business_name}</div>}
            </div>
            <div>
              <Phone size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary)' }} />
              {challan.mobile}
            </div>
            {challan.email && (
              <div>
                <Mail size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary)' }} />
                {challan.email}
              </div>
            )}
            {challan.gst_number && (
              <div>
                <strong>GST:</strong> {challan.gst_number}
              </div>
            )}
            {challan.address && (
              <div style={{ gridColumn: 'span 2' }}>
                <MapPin size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary)' }} />
                {challan.address}
              </div>
            )}
          </div>
        </div>

        {/* Product Items Snapshot Table */}
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Product Items Snapshot</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Unit Price (₹)</th>
                <th>Quantity</th>
                <th style={{ textAlign: 'right' }}>Subtotal (₹)</th>
              </tr>
            </thead>
            <tbody>
              {challan.items?.map((item, idx) => {
                const subtotal = item.unit_price * item.quantity;
                return (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td><strong>{item.product_name}</strong></td>
                    <td><code>{item.sku}</code></td>
                    <td>₹{Number(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ fontWeight: 700 }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>Total:</td>
                <td style={{ fontWeight: 700, fontSize: '1rem' }}>{challan.total_quantity} units</td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
                  ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { Customer, CustomerStatus, CustomerType } from '../types';
import { ArrowLeft, Save } from 'lucide-react';

export const CustomerFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('Retail');
  const [status, setStatus] = useState<CustomerStatus>('Lead');
  const [address, setAddress] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) {
      const fetchCustomer = async () => {
        setLoading(true);
        const res = await apiRequest<Customer>(`/customers/${id}`);
        if (res.success && res.data) {
          const c = res.data;
          setCustomerName(c.customer_name);
          setMobile(c.mobile);
          setEmail(c.email || '');
          setBusinessName(c.business_name || '');
          setGstNumber(c.gst_number || '');
          setCustomerType(c.customer_type);
          setStatus(c.status);
          setAddress(c.address || '');
          setFollowUpDate(c.follow_up_date ? c.follow_up_date.slice(0, 10) : '');
          setNotes(c.notes || '');
        } else {
          setError(res.message || 'Failed to fetch customer');
        }
        setLoading(false);
      };
      fetchCustomer();
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!mobile.trim()) {
      setError('Mobile number is required.');
      return;
    }

    setLoading(true);
    const payload = {
      customer_name: customerName,
      mobile,
      email: email || undefined,
      business_name: businessName || undefined,
      gst_number: gstNumber || undefined,
      customer_type: customerType,
      status,
      address: address || undefined,
      follow_up_date: followUpDate || undefined,
      notes: notes || undefined
    };

    const url = isEdit ? `/customers/${id}` : '/customers';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await apiRequest<Customer>(url, {
      method,
      body: JSON.stringify(payload)
    });

    setLoading(false);

    if (res.success && res.data) {
      navigate(`/customers/${res.data.id}`);
    } else {
      setError(res.message || 'Failed to save customer details.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate('/customers')} className="btn btn-secondary" style={{ padding: '6px 14px' }}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="card">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>
          {isEdit ? 'Edit Customer Details' : 'Add New Customer'}
        </h1>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Rahul Sharma"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. rahul@apex.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Apex Traders"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 27AAAAA0000A1Z5"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Customer Type *</label>
              <select
                className="form-control"
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value as CustomerType)}
              >
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Distributor">Distributor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status *</label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomerStatus)}
              >
                <option value="Lead">Lead</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input
                type="date"
                className="form-control"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Address</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Full business address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Initial customer notes or specific requirements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/customers')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={18} /> {loading ? 'Saving...' : (isEdit ? 'Update Customer' : 'Create Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

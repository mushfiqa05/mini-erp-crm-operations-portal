import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { Customer } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Building, MapPin, Calendar, FileText, Send, ArrowLeft, Edit } from 'lucide-react';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const { hasRole } = useAuth();
  const canEdit = hasRole(['Admin', 'Sales']);

  const isEditMode = searchParams.get('edit') === 'true';

  const loadCustomer = async () => {
    setLoading(true);
    const res = await apiRequest<Customer>(`/customers/${id}`);
    if (res.success && res.data) {
      setCustomer(res.data);
    } else {
      setError(res.message || 'Customer not found');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setSubmittingNote(true);
    const res = await apiRequest(`/customers/${id}/followups`, {
      method: 'POST',
      body: JSON.stringify({
        note: noteText,
        follow_up_date: nextFollowUpDate || undefined
      })
    });

    setSubmittingNote(false);
    if (res.success) {
      setNoteText('');
      setNextFollowUpDate('');
      loadCustomer(); // refresh notes & customer profile
    } else {
      alert(res.message || 'Failed to add follow-up note');
    }
  };

  if (loading) return <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading customer profile...</div>;
  if (error || !customer) return <div className="alert alert-danger">{error || 'Customer not found'}</div>;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate('/customers')} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to Customer List
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Profile Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{customer.customer_name}</h2>
              {customer.business_name && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <Building size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {customer.business_name}
                </span>
              )}
            </div>
            {canEdit && (
              <button 
                onClick={() => navigate(`/customers/edit/${customer.id}`)} 
                className="btn btn-secondary" 
                style={{ padding: '8px 14px' }}
              >
                <Edit size={16} /> Edit
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <StatusBadge status={customer.status} />
            <span className="badge badge-purple">{customer.customer_type}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.92rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Phone size={18} style={{ color: 'var(--primary)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mobile Number</div>
                <div>{customer.mobile}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={18} style={{ color: 'var(--primary)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</div>
                <div>{customer.email || '—'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={18} style={{ color: 'var(--primary)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GST Number</div>
                <div>{customer.gst_number || '—'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={18} style={{ color: 'var(--primary)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Address</div>
                <div>{customer.address || '—'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={18} style={{ color: 'var(--warning)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next Follow-Up Date</div>
                <div>{customer.follow_up_date ? new Date(customer.follow_up_date).toLocaleDateString() : 'None Scheduled'}</div>
              </div>
            </div>

            {customer.notes && (
              <div style={{ marginTop: '10px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>General Notes</div>
                <div style={{ fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>{customer.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* CRM Follow-up Timeline & Add Note */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {canEdit && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '16px' }}>Log New Follow-up Note</h3>
              <form onSubmit={handleAddNote}>
                <div className="form-group">
                  <label className="form-label">Note Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Enter discussion details, customer queries, or call updates..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Next Follow-up Date (Optional)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={submittingNote}>
                  <Send size={16} /> {submittingNote ? 'Saving Note...' : 'Add Follow-up Note'}
                </button>
              </form>
            </div>
          )}

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>Follow-up History</h3>
            {!customer.follow_up_notes || customer.follow_up_notes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No follow-up notes logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {customer.follow_up_notes.map((note) => (
                  <div key={note.id} style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Logged by <strong>{note.created_by}</strong></span>
                      <span>{new Date(note.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>{note.note}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

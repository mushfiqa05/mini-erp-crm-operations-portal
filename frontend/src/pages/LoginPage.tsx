import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Boxes, Lock, Mail, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setLoading(false);

    if (res.success && res.data) {
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } else {
      setError(res.message || 'Login failed. Please check credentials.');
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '8px' }}>
            <Boxes size={36} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Fundsroom ERP</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Mini Operations & CRM Management Portal</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '40px' }}
                placeholder="user@fundsroom.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '40px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '10px' }}>
            Quick Demo Credentials (Password: <code>Password123!</code>):
          </p>
          <div className="demo-account-buttons">
            <button className="demo-btn" onClick={() => fillDemoAccount('admin@fundsroom.com')}>
              🔑 Admin
            </button>
            <button className="demo-btn" onClick={() => fillDemoAccount('sales@fundsroom.com')}>
              💼 Sales
            </button>
            <button className="demo-btn" onClick={() => fillDemoAccount('warehouse@fundsroom.com')}>
              📦 Warehouse
            </button>
            <button className="demo-btn" onClick={() => fillDemoAccount('accounts@fundsroom.com')}>
              📊 Accounts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

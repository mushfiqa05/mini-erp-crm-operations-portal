import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Database, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="top-header">
      <div className="page-title">
        <span>{title}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            fontSize: '0.76rem', 
            color: 'var(--emerald-text)',
            backgroundColor: 'var(--emerald-bg)',
            border: '1px solid var(--emerald-border)',
            padding: '3px 10px',
            borderRadius: '4px',
            fontWeight: 600
          }}
        >
          <Database size={13} />
          <span>PostgreSQL Active</span>
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
            <span>Role: <strong style={{ color: 'var(--text-primary)' }}>{user.role}</strong></span>
          </div>
        )}
      </div>
    </header>
  );
};

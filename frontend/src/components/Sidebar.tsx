import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Boxes, 
  FileText, 
  LogOut,
  Building2
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <aside className="sidebar">
      <div className="brand-header">
        <Building2 size={24} style={{ color: 'var(--primary-hover)' }} />
        <div className="brand-title">
          <span>Fundsroom</span>
          <span className="brand-subtitle">ERP & CRM Operations</span>
        </div>
      </div>

      <nav className="nav-menu">
        <div className="nav-section">
          <div className="nav-section-title">OVERVIEW</div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </NavLink>
        </div>

        {hasRole(['Admin', 'Sales', 'Accounts']) && (
          <div className="nav-section">
            <div className="nav-section-title">CRM & CLIENTS</div>
            <NavLink to="/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={17} />
              <span>Customer CRM</span>
            </NavLink>
          </div>
        )}

        {(hasRole(['Admin', 'Warehouse', 'Sales']) || hasRole(['Admin', 'Warehouse'])) && (
          <div className="nav-section">
            <div className="nav-section-title">INVENTORY & PRODUCTS</div>
            {hasRole(['Admin', 'Warehouse', 'Sales']) && (
              <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Package size={17} />
                <span>Product Catalog</span>
              </NavLink>
            )}
            {hasRole(['Admin', 'Warehouse']) && (
              <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Boxes size={17} />
                <span>Stock Movements</span>
              </NavLink>
            )}
          </div>
        )}

        {hasRole(['Admin', 'Sales', 'Accounts']) && (
          <div className="nav-section">
            <div className="nav-section-title">SALES & TRANSACTIONS</div>
            <NavLink to="/challans" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText size={17} />
              <span>Sales Challans</span>
            </NavLink>
          </div>
        )}
      </nav>

      {user && (
        <div className="sidebar-footer">
          <div className="user-profile-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="user-avatar">
                {getInitials(user.name)}
              </div>
              <div className="user-details">
                <span className="user-name-text">{user.name}</span>
                <span className="badge badge-purple" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>{user.role}</span>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="btn btn-secondary btn-sm" 
              style={{ padding: '6px' }}
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

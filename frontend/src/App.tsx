import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { UserRole } from './types';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { CustomerFormPage } from './pages/CustomerFormPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { InventoryPage } from './pages/InventoryPage';
import { ChallansPage } from './pages/ChallansPage';
import { ChallanDetailPage } from './pages/ChallanDetailPage';
import { ChallanFormPage } from './pages/ChallanFormPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({
  children,
  allowedRoles
}) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading session...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main Layout Wrapper
const AppLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header title={title} />
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout title="Operational Dashboard">
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Customers CRM Routes */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Sales', 'Accounts']}>
              <AppLayout title="Customer Directory">
                <CustomersPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/new"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Sales']}>
              <AppLayout title="Add Customer">
                <CustomerFormPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Sales', 'Accounts']}>
              <AppLayout title="Customer Profile">
                <CustomerDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/edit/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Sales']}>
              <AppLayout title="Edit Customer">
                <CustomerFormPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Product Catalog Routes */}
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Warehouse', 'Sales']}>
              <AppLayout title="Product Catalog">
                <ProductsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/new"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Warehouse']}>
              <AppLayout title="Add Product">
                <ProductFormPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/edit/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Warehouse']}>
              <AppLayout title="Edit Product">
                <ProductFormPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Inventory Routes */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Warehouse']}>
              <AppLayout title="Inventory & Stock">
                <InventoryPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Sales Challan Routes */}
        <Route
          path="/challans"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Sales', 'Accounts']}>
              <AppLayout title="Sales Challans">
                <ChallansPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/challans/new"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Sales']}>
              <AppLayout title="Create Sales Challan">
                <ChallanFormPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/challans/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Sales', 'Accounts']}>
              <AppLayout title="Sales Challan Details">
                <ChallanDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
};

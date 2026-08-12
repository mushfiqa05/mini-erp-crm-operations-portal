export type UserRole = 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor';
export type CustomerStatus = 'Lead' | 'Active' | 'Inactive';

export interface Customer {
  id: number;
  customer_name: string;
  mobile: string;
  email?: string;
  business_name?: string;
  gst_number?: string;
  customer_type: CustomerType;
  address?: string;
  status: CustomerStatus;
  follow_up_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  follow_up_notes?: FollowUpNote[];
}

export interface FollowUpNote {
  id: number;
  customer_id: number;
  note: string;
  created_by: string;
  created_at: string;
}

export interface Product {
  id: number;
  product_name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  warehouse_location?: string;
  created_at: string;
  updated_at: string;
  is_low_stock?: boolean;
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  quantity: number;
  movement_type: MovementType;
  reason: string;
  created_by: string;
  created_at: string;
}

export type ChallanStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface ChallanItem {
  id?: number;
  challan_id?: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
}

export interface Challan {
  id: number;
  challan_number: string;
  customer_id: number;
  customer_name?: string;
  business_name?: string;
  mobile?: string;
  email?: string;
  address?: string;
  gst_number?: string;
  total_quantity: number;
  status: ChallanStatus;
  created_by: string;
  created_at: string;
  items?: ChallanItem[];
}

export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  lowStockProducts: Product[];
  challanCounts: {
    Draft: number;
    Confirmed: number;
    Cancelled: number;
  };
  recentChallans: Challan[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

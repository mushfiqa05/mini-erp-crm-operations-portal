import { Request } from 'express';

export type UserRole = 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';

export interface UserPayload {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

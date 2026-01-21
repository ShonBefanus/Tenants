/**
 * Database Types
 * 
 * TypeScript type definitions for database models
 */

// ============================================
// USER TYPES
// ============================================
export type UserRole = 'OWNER' | 'MANAGER' | 'READ_ONLY';

export interface User {
  id: number;
  firebase_uid: string;
  email: string;
  role: UserRole;
  created_at: number;
  updated_at: number;
}

// ============================================
// PROPERTY TYPES
// ============================================
export interface PropertyData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  notes?: string;
}

export interface Property {
  id: number;
  owner_uid: string;
  encrypted_data: string; // Encrypted PropertyData
  created_at: number;
  updated_at: number;
}

export interface PropertyWithData extends Omit<Property, 'encrypted_data'> {
  data: PropertyData;
}

// ============================================
// UNIT TYPES
// ============================================
export interface Unit {
  id: number;
  property_id: number;
  owner_uid: string;
  unit_number: string | null;
  monthly_rent: number | null;
  created_at: number;
  updated_at: number;
}

// ============================================
// TENANT TYPES
// ============================================
export interface TenantData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
}

export interface Tenant {
  id: number;
  unit_id: number;
  owner_uid: string;
  encrypted_data: string; // Encrypted TenantData
  lease_start_date: number | null;
  lease_end_date: number | null;
  is_active: number; // 0 or 1
  created_at: number;
  updated_at: number;
}

export interface TenantWithData extends Omit<Tenant, 'encrypted_data'> {
  data: TenantData;
}

// ============================================
// PAYMENT TYPES
// ============================================
export type PaymentMethod = 'check' | 'bank_transfer' | 'cash' | 'other';

export interface Payment {
  id: number;
  tenant_id: number;
  owner_uid: string;
  amount: number;
  payment_date: number;
  payment_method: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

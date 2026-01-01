/**
 * Payment Types
 */

export type PaymentMethod = 
  | "credit_card"
  | "debit_card"
  | "paypal"
  | "bank_transfer"
  | "cash"
  | "other";

export type PaymentStatus = 
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";

export interface Payment {
  id: string;
  tenant_id: string;
  booking_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_reference?: string;
  notes?: string;
  processed_at?: Date;
  created_at: Date;
  updated_at?: Date;
  version?: number;
}

export interface CreatePaymentInput {
  booking_id: string;
  amount: number;
  payment_method: PaymentMethod;
  currency?: string;
  transaction_reference?: string;
  notes?: string;
}


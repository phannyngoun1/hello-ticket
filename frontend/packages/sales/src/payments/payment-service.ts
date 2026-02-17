/**
 * Payment Service
 *
 * Handles all payment-related API operations
 */

import type { ApiClient } from "@truths/api";
import type { Payment, CreatePaymentInput, PaymentMethod, PaymentStatus } from "./types";

export interface PaymentServiceConfig {
  apiClient: ApiClient;
  endpoints: {
    payments: string;
  };
}

export class PaymentService {
  private apiClient: ApiClient;
  private endpoints: PaymentServiceConfig["endpoints"];

  constructor(config: PaymentServiceConfig) {
    this.apiClient = config.apiClient;
    this.endpoints = config.endpoints;
  }

  /**
   * Create a payment for a booking
   */
  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    try {
      const response = await this.apiClient.post<PaymentDTO>(
        this.endpoints.payments,
        {
          booking_id: input.booking_id,
          amount: input.amount,
          payment_method: input.payment_method,
          currency: input.currency || "USD",
          transaction_reference: input.transaction_reference,
          notes: input.notes,
        },
        { requiresAuth: true }
      );
      return this.transformPayment(response);
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  }

  /**
   * Get all payments for the current tenant
   */
  async getAllPayments(): Promise<Payment[]> {
    try {
      const baseEndpoint = this.endpoints.payments.replace(/\/$/, "");
      const response = await this.apiClient.get<PaymentListDTO>(
        baseEndpoint,
        { requiresAuth: true }
      );
      return response.items.map((item: PaymentDTO) => this.transformPayment(item));
    } catch (error) {
      console.error("Error fetching all payments:", error);
      throw error;
    }
  }

  /**
   * Get a single payment by ID
   */
  async getPaymentById(paymentId: string): Promise<Payment> {
    try {
      const baseEndpoint = this.endpoints.payments.replace(/\/$/, "");
      const response = await this.apiClient.get<PaymentDTO>(
        `${baseEndpoint}/${paymentId}`,
        { requiresAuth: true }
      );
      return this.transformPayment(response);
    } catch (error) {
      console.error(`Error fetching payment ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Get payments for a booking
   */
  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    try {
      const baseEndpoint = this.endpoints.payments.replace(/\/$/, "");
      const response = await this.apiClient.get<PaymentListDTO>(
        `${baseEndpoint}/booking/${bookingId}`,
        { requiresAuth: true }
      );
      return response.items.map((item: PaymentDTO) => this.transformPayment(item));
    } catch (error) {
      console.error(`Error fetching payments for booking ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * Void/cancel a payment
   */
  async voidPayment(paymentId: string): Promise<Payment> {
    try {
      const baseEndpoint = this.endpoints.payments.replace(/\/$/, "");
      const response = await this.apiClient.post<PaymentDTO>(
        `${baseEndpoint}/${paymentId}/cancel`,
        {},
        { requiresAuth: true }
      );
      return this.transformPayment(response);
    } catch (error) {
      console.error(`Error voiding payment ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Transform API response to domain model
   */
  private transformPayment(dto: PaymentDTO): Payment {
    return {
      id: dto.id,
      tenant_id: dto.tenant_id,
      booking_id: dto.booking_id,
      payment_code: dto.payment_code || undefined,
      amount: dto.amount,
      currency: dto.currency,
      payment_method: dto.payment_method as PaymentMethod,
      status: dto.status as PaymentStatus,
      transaction_reference: dto.transaction_reference || undefined,
      notes: dto.notes || undefined,
      processed_at: dto.processed_at ? new Date(dto.processed_at) : undefined,
      created_at: new Date(dto.created_at),
      updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
      version: dto.version,
    };
  }
}

// DTOs matching backend API response
interface PaymentDTO {
  id: string;
  tenant_id: string;
  booking_id: string;
  payment_code?: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  transaction_reference?: string | null;
  notes?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  version?: number;
}

interface PaymentListDTO {
  items: PaymentDTO[];
  total: number;
  has_next: boolean;
}


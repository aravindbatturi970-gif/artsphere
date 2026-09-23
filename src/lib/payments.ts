import { isSupabaseConfigured } from "@/lib/supabase";
import type { PaymentProvider } from "@/types";

/**
 * Payment gateway seam (Stage 8).
 *
 * Checkout must never pretend money moved. Until a real provider is
 * connected, every order is created with payment_status = 'pending' and
 * the UI says so plainly. When Stripe/Razorpay arrives, implement
 * `startPaymentSession` server-side (or via an edge function) and swap
 * the body of `createPaymentIntent` below — the checkout page already
 * speaks this interface.
 */

export const PAYMENT_PROVIDER: PaymentProvider = "none";

export const PAYMENTS_ENABLED = false;

export function paymentsEnabled(): boolean {
  return PAYMENTS_ENABLED && isSupabaseConfigured;
}

export interface PaymentIntent {
  /** e.g. Stripe PaymentIntent id — null until a provider is wired. */
  reference: string | null;
  provider: PaymentProvider;
  /** Whether the client should redirect to a hosted payment page. */
  redirectUrl: string | null;
}

/**
 * Start a payment for an order. Not implemented on purpose: faking a
 * success here would corrupt order data. Throws instead.
 */
export async function createPaymentIntent(
  _orderId: string,
  _amount: number,
  _currency: string
): Promise<PaymentIntent> {
  throw new Error(
    "Payments are not connected yet. The order was saved with payment status 'pending'."
  );
}

/**
 * Human label for a payment status on order pages.
 */
export function paymentStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "failed":
      return "Payment failed";
    case "refunded":
      return "Refunded";
    default:
      return "Payment pending";
  }
}

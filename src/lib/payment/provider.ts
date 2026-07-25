import {
  createCheckoutSession,
  isStripeConfigured,
  retrieveCheckoutSession,
} from "@/lib/payment/stripe-client";

export type PaymentIntent = {
  id: string;
  amount: number;
  currency: "MAD" | "EUR" | "USD";
  description: string;
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
};

export type PaymentResult = {
  success: boolean;
  paymentId: string;
  provider: string;
  checkoutUrl?: string;
  error?: string;
};

export interface PaymentProvider {
  readonly name: string;
  createCheckout(intent: PaymentIntent): Promise<PaymentResult>;
  verifyPayment(paymentId: string): Promise<{ paid: boolean; amount?: number }>;
}

class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createCheckout(intent: PaymentIntent): Promise<PaymentResult> {
    console.info(`[payment:mock] ${intent.description} — ${intent.amount} ${intent.currency}`);
    return {
      success: true,
      paymentId: `pay_mock_${Date.now()}`,
      provider: this.name,
    };
  }

  async verifyPayment(paymentId: string) {
    return { paid: paymentId.startsWith("pay_mock_") || paymentId.startsWith("pay_demo_"), amount: undefined };
  }
}

class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";

  async createCheckout(intent: PaymentIntent): Promise<PaymentResult> {
    if (!isStripeConfigured()) {
      return new MockPaymentProvider().createCheckout(intent);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await createCheckoutSession({
      amount: intent.amount,
      currency: intent.currency,
      description: intent.description,
      successUrl: intent.successUrl ?? `${appUrl}/fr/dashboard/facturation?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: intent.cancelUrl ?? `${appUrl}/fr/tarifs?cancelled=1`,
      metadata: { ...intent.metadata, intentId: intent.id },
      customerEmail: intent.customerEmail,
    });

    if (!session) {
      return {
        success: false,
        paymentId: "",
        provider: this.name,
        error: "Stripe checkout session creation failed",
      };
    }

    return {
      success: true,
      paymentId: session.id,
      provider: this.name,
      checkoutUrl: session.url,
    };
  }

  async verifyPayment(paymentId: string) {
    if (paymentId.startsWith("cs_")) {
      return retrieveCheckoutSession(paymentId);
    }
    return { paid: paymentId.startsWith("pay_stripe_") || paymentId.startsWith("pay_mock_") };
  }
}

export function createPaymentProvider(): PaymentProvider {
  if (process.env.PAYMENT_PROVIDER === "stripe" && isStripeConfigured()) {
    return new StripePaymentProvider();
  }
  return new MockPaymentProvider();
}

export async function processPayment(intent: PaymentIntent): Promise<PaymentResult> {
  const provider = createPaymentProvider();
  return provider.createCheckout(intent);
}

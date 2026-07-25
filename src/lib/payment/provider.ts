export type PaymentIntent = {
  id: string;
  amount: number;
  currency: "MAD" | "EUR" | "USD";
  description: string;
  metadata?: Record<string, string>;
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
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return new MockPaymentProvider().createCheckout(intent);
    }

    // Stripe stub — wire stripe SDK in production
    console.warn("[payment:stripe] Stripe configured but SDK not wired — falling back to mock");
    return {
      success: true,
      paymentId: `pay_stripe_stub_${Date.now()}`,
      provider: "stripe-stub",
      checkoutUrl: undefined,
    };
  }

  async verifyPayment(paymentId: string) {
    return { paid: paymentId.startsWith("pay_stripe_") || paymentId.startsWith("pay_mock_") };
  }
}

export function createPaymentProvider(): PaymentProvider {
  if (process.env.PAYMENT_PROVIDER === "stripe" && process.env.STRIPE_SECRET_KEY) {
    return new StripePaymentProvider();
  }
  return new MockPaymentProvider();
}

export async function processPayment(intent: PaymentIntent): Promise<PaymentResult> {
  const provider = createPaymentProvider();
  return provider.createCheckout(intent);
}

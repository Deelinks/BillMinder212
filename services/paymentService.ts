/**
 * Payment Service for BillMinder
 * Handles Paystack Inline Checkout integration
 */

const PAYSTACK_PUBLIC_KEY = 'pk_live_34430215ee564fe8df3ef315d29cd50a808797f3';

export const paymentService = {
  /**
   * Initializes a Paystack transaction.
   * @param email User email
   * @param amount Amount in base currency (NGN)
   * @param currency Currency code
   * @param onSuccess Success callback
   * @param onCancel Cancel/Close callback
   */
  initializePaystack: (
    email: string, 
    amount: number, 
    currency: string = 'NGN',
    onSuccess: (reference: string) => void,
    onCancel: () => void
  ) => {
    // Paystack expects the amount in kobo/cents (multiplied by 100)
    const amountInSubunits = Math.round(amount * 100);

    const handler = (window as any).PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: amountInSubunits,
      currency: currency,
      ref: `BM-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      metadata: {
        custom_fields: [
          {
            display_name: "Service Name",
            variable_name: "service_name",
            value: "BillMinder Pro Upgrade"
          }
        ]
      },
      callback: (response: any) => {
        // response contains { message: "Approved", reference: "...", status: "success", trans: "..." }
        onSuccess(response.reference);
      },
      onClose: () => {
        onCancel();
      }
    });

    handler.openIframe();
  },

  /**
   * Legacy method for Stripe compatibility (simulation)
   */
  createCheckoutSession: async (priceId: string, userId: string) => {
    console.log(`Legacy Checkout for ${userId}, Plan: ${priceId}`);
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }
};
import { z } from "zod";

export const attachPaymentMethodSchema = z.object({
  // Stripe PaymentMethod ID returned by `confirmCardSetup` on the client.
  // Format is `pm_…` followed by an opaque token.
  stripePaymentMethodId: z.string().regex(/^pm_[A-Za-z0-9_]+$/),
  isDefault: z.boolean().optional(),
  billingAddressId: z.uuid().optional(),
});

export type AttachPaymentMethodBody = z.infer<typeof attachPaymentMethodSchema>;

export const setupIntentResponseSchema = {
  type: "object",
  properties: {
    clientSecret: { type: "string" },
    customerId: { type: "string" },
  },
};

// Mirrors PaymentMethodDTO from user-management — kept in lockstep so any
// new fields surface here too.
export const attachPaymentMethodResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    type: { type: "string" },
    brand: { type: "string", nullable: true },
    last4: { type: "string", nullable: true },
    expMonth: { type: "integer", nullable: true },
    expYear: { type: "integer", nullable: true },
    billingAddressId: { type: "string", nullable: true },
    providerRef: { type: "string", nullable: true },
    isDefault: { type: "boolean" },
    displayName: { type: "string" },
    expiryDisplay: { type: "string" },
    isExpired: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

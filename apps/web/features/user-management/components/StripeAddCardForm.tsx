"use client";

import { useEffect, useState } from "react";
import {
  Elements,
  CardElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { StripeCardElementOptions } from "@stripe/stripe-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@tasheen/ui";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { getStripe } from "@/lib/stripe";
import {
  attachPaymentMethod,
  createPaymentMethodSetupIntent,
} from "../api";

const CARD_ELEMENT_OPTIONS: StripeCardElementOptions = {
  hidePostalCode: false,
  style: {
    base: {
      color: "#1c1917",
      fontFamily: "var(--ts-font-sans), system-ui, sans-serif",
      fontSize: "15px",
      fontSmoothing: "antialiased",
      "::placeholder": { color: "#a8a29e" },
    },
    invalid: {
      color: "#9f1239",
      iconColor: "#9f1239",
    },
  },
};

interface StripeAddCardFormProps {
  onSuccess: () => void;
}

/**
 * Public component — wraps the inner form in `<Elements>` with the Stripe
 * promise lazily resolved. Each modal mount gets a fresh Elements
 * provider so stale client_secrets / errored intents don't leak between
 * sessions.
 */
export function StripeAddCardForm({ onSuccess }: StripeAddCardFormProps) {
  return (
    <Elements stripe={getStripe()}>
      <StripeAddCardFormInner onSuccess={onSuccess} />
    </Elements>
  );
}

function StripeAddCardFormInner({ onSuccess }: StripeAddCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const queryClient = useQueryClient();

  // Fetch the SetupIntent client_secret as soon as the form mounts so the
  // Stripe iframe is fully primed by the time the user clicks Save.
  // Triggered manually via `mutate()` rather than `useQuery` to keep this
  // a single-use-per-mount affair (no refetch on focus / refocus).
  const setupIntent = useMutation({
    mutationFn: createPaymentMethodSetupIntent,
  });

  useEffect(() => {
    setupIntent.mutate();
    // Intentional: only fire on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStripeError(null);

    if (!stripe || !elements) {
      setStripeError("Stripe has not finished loading. Please try again.");
      return;
    }
    if (setupIntent.isPending || !setupIntent.data) {
      setStripeError("Setup intent not ready. Please try again in a moment.");
      return;
    }
    const card = elements.getElement(CardElement);
    if (!card) {
      setStripeError("Card field unavailable. Please refresh and retry.");
      return;
    }

    setSubmitting(true);
    try {
      const { error, setupIntent: confirmed } = await stripe.confirmCardSetup(
        setupIntent.data.clientSecret,
        { payment_method: { card } },
      );

      if (error) {
        setStripeError(error.message ?? "Card was declined. Please try again.");
        return;
      }
      if (!confirmed?.payment_method) {
        setStripeError("Stripe did not return a payment method. Please retry.");
        return;
      }

      const stripePmId =
        typeof confirmed.payment_method === "string"
          ? confirmed.payment_method
          : confirmed.payment_method.id;

      await attachPaymentMethod({
        stripePaymentMethodId: stripePmId,
        isDefault,
      });

      await queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Card saved");
      onSuccess();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save card";
      setStripeError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const intentLoading = setupIntent.isPending && !setupIntent.data;
  const intentError = setupIntent.error;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-start gap-3 p-4 bg-stone-50 border border-stone-100 rounded-sm">
        <ShieldCheck className="h-4 w-4 text-gold mt-0.5 shrink-0" />
        <p className="text-[11px] text-stone-500 leading-relaxed">
          Card details are sent directly to Stripe — they never touch our
          servers. We only store the brand, last four digits, and expiry.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
          Card Details
        </label>
        <div className="border border-stone-200 px-4 py-4 bg-white focus-within:border-gold transition-colors">
          {intentLoading ? (
            <div className="h-5 flex items-center text-xs text-stone-400">
              Initialising secure card field…
            </div>
          ) : intentError ? (
            <div className="h-5 flex items-center text-xs text-burgundy">
              Couldn&apos;t start a secure session. Please close and retry.
            </div>
          ) : (
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          )}
        </div>
      </div>

      <label className="flex items-center gap-3 text-xs text-charcoal cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-4 w-4 accent-gold"
        />
        <span className="uppercase tracking-[0.2em] text-[10px] font-bold text-stone-500">
          Set as primary payment method
        </span>
      </label>

      {stripeError && (
        <p className="text-[11px] text-burgundy" role="alert">
          {stripeError}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={submitting || intentLoading || !stripe}
        isLoading={submitting}
      >
        Save Card
      </Button>
    </form>
  );
}

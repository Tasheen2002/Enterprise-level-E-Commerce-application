"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, FormField, cn } from "@tasheen/ui";
import { useCart } from "@/providers/CartProvider";
import { toast } from "sonner";
import { imageKitUrl } from "@/lib/imagekit";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { ShieldCheck, Coins } from "lucide-react";
import { api } from "@/lib/api-client";
import { initializeCheckout, createStripePaymentIntent, completeCheckoutWithOrder, calculateCheckoutTax } from "../api";
import { useCurrentIdentity } from "../../user-management/hooks/useCurrentIdentity";
import { useLoyaltyAccount, useRedeemLoyaltyPoints } from "../../user-management/hooks/useLoyalty";

const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  addressLine1: z.string().min(1, "Address line 1 is required").max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State/Province is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().length(2, "Country code must be exactly 2 characters (e.g. US, LK)"),
  phone: z.string().min(1, "Phone number is required").max(30),
  email: z.string().email("Invalid email address").max(255),
});

type AddressValues = z.infer<typeof addressSchema>;

export function CheckoutWizard() {
  const { cart, clearCart, isLoading: cartLoading } = useCart();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [giftItems, setGiftItems] = useState<Record<string, { isGift: boolean; giftMessage: string }>>({});
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  // Loyalty Details
  const { data: identity } = useCurrentIdentity();
  const { data: loyalty } = useLoyaltyAccount();
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);

  // Calculate pricing summary using local states to allow backend Stripe Tax updates
  const subtotal = cart?.summary?.subtotal ?? 0;
  const [shippingCost, setShippingCost] = useState(subtotal > 150 ? 0 : 15);
  const [tax, setTax] = useState(parseFloat((subtotal * 0.08).toFixed(2)));
  const [discount, setDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const total = subtotal + shippingCost + tax - discount - loyaltyDiscount;
  const [calculatingTax, setCalculatingTax] = useState(false);

  useEffect(() => {
    const checkPromo = async () => {
      const storedCode = localStorage.getItem("applied_promo_code");
      if (!storedCode || !cart) return;
      try {
        const productIds = cart.items
          .map((item) => item.product?.productId)
          .filter((id): id is string => !!id);

        const shippingVals = shippingForm.getValues();
        const result = await api.post<{ valid: boolean; discountAmount: number; error?: string }>(
          "/promotions/apply",
          {
            promoCode: storedCode,
            orderAmount: subtotal,
            products: productIds,
            userId: identity?.userId || undefined,
            email: identity?.email || shippingVals.email || undefined,
          }
        );

        if (result.valid) {
          setDiscount(result.discountAmount);
          setPromoCode(storedCode);
        } else {
          setDiscount(0);
          setPromoCode(null);
          localStorage.removeItem("applied_promo_code");
        }
      } catch (err) {
        console.warn("Failed to apply promo code on checkout:", err);
        setDiscount(0);
        setPromoCode(null);
        localStorage.removeItem("applied_promo_code");
      }
    };

    checkPromo();
  }, [subtotal, cart, identity]);

  useEffect(() => {
    if (step < 3) {
      const defaultShipping = subtotal > 150 ? 0 : 15;
      const defaultTax = parseFloat((subtotal * 0.08).toFixed(2));
      setShippingCost(defaultShipping);
      setTax(defaultTax);
    }
  }, [subtotal, step]);

  const shippingForm = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
      phone: "",
      email: "",
    },
  });

  const billingForm = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
      phone: "",
      email: "",
    },
  });

  if (cartLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-stone-800 border-r-2" />
        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-400">Loading Shopping Bag...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-20 bg-stone-50 border border-stone-100 p-8">
        <h2 className="text-xl font-light text-stone-800 tracking-wide mb-4">Your Shopping Bag is Empty</h2>
        <p className="text-sm text-stone-500 max-w-sm mx-auto mb-8 font-light leading-relaxed">
          Please add some exquisite footwear from our collection before proceeding to checkout.
        </p>
        <Button
          variant="primary"
          onClick={() => router.push("/catalog")}
          className="uppercase tracking-[0.2em] text-[10px] font-bold h-12"
        >
          Explore Collection
        </Button>
      </div>
    );
  }

  const handleCalculateTaxAndGoToStep3 = async () => {
    setCalculatingTax(true);
    try {
      const session = await initializeCheckout({ cartId: cart.cartId });
      setCheckoutId(session.checkoutId);

      const shippingVals = shippingForm.getValues();
      const cleanShippingAddress = {
        firstName: shippingVals.firstName,
        lastName: shippingVals.lastName,
        addressLine1: shippingVals.addressLine1,
        addressLine2: shippingVals.addressLine2 || undefined,
        city: shippingVals.city,
        state: shippingVals.state,
        postalCode: shippingVals.postalCode,
        country: shippingVals.country,
        phone: shippingVals.phone || undefined,
        email: shippingVals.email || undefined,
      };

      // Re-validate promotion code if applied
      const storedCode = localStorage.getItem("applied_promo_code");
      if (storedCode) {
        const productIds = cart.items
          .map((item) => item.product?.productId)
          .filter((id): id is string => !!id);

        try {
          const promoResult = await api.post<{ valid: boolean; discountAmount: number; error?: string }>(
            "/promotions/apply",
            {
              promoCode: storedCode,
              orderAmount: subtotal,
              products: productIds,
              userId: identity?.userId || undefined,
              email: identity?.email || shippingVals.email || undefined,
            }
          );

          if (promoResult.valid) {
            setDiscount(promoResult.discountAmount);
            setPromoCode(storedCode);
          } else {
            setDiscount(0);
            setPromoCode(null);
            localStorage.removeItem("applied_promo_code");
            toast.error(promoResult.error || "Promo code is no longer valid for this checkout.");
          }
        } catch (promoErr: unknown) {
          setDiscount(0);
          setPromoCode(null);
          localStorage.removeItem("applied_promo_code");
          const msg = promoErr instanceof Error ? promoErr.message : "Promo code is no longer valid for this checkout.";
          toast.error(msg);
        }
      }

      const result = await calculateCheckoutTax(session.checkoutId, {
        shippingAddress: cleanShippingAddress,
      });

      setTax(result.tax);
      setShippingCost(result.shipping);
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Tax calculation error, using fallback estimated tax:", msg);
      toast.error("Failed to compute precise tax. Using estimated figures.");
      setStep(3);
    } finally {
      setCalculatingTax(false);
    }
  };

  const onShippingSubmit = shippingForm.handleSubmit(async () => {
    if (billingSameAsShipping) {
      await handleCalculateTaxAndGoToStep3();
    } else {
      setStep(2);
    }
  });

  const onBillingSubmit = billingForm.handleSubmit(async () => {
    await handleCalculateTaxAndGoToStep3();
  });

  const toggleGift = (variantId: string) => {
    setGiftItems((prev) => ({
      ...prev,
      [variantId]: {
        isGift: !prev[variantId]?.isGift,
        giftMessage: prev[variantId]?.giftMessage ?? "",
      },
    }));
  };

  const handleGiftMessageChange = (variantId: string, message: string) => {
    setGiftItems((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        isGift: true,
        giftMessage: message,
      },
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
      {/* Checkout Stages Form */}
      <div className="lg:col-span-7 space-y-10">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-6 border-b border-stone-100">
          <div className="flex items-center gap-4">
            <span className={cn(
              "h-8 w-8 rounded-none border flex items-center justify-center text-[10px] font-bold tracking-widest",
              step === 1 ? "bg-charcoal text-cream border-charcoal" : "bg-transparent text-stone-600 border-stone-300"
            )}>01</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-800">Shipping</span>
              <span className="text-[9px] text-stone-600 font-medium">Where to deliver</span>
            </div>
          </div>
          <div className="h-[1px] flex-1 bg-stone-100 max-w-[40px] mx-2" />
          <div className="flex items-center gap-4">
            <span className={cn(
              "h-8 w-8 rounded-none border flex items-center justify-center text-[10px] font-bold tracking-widest",
              step === 2 ? "bg-charcoal text-cream border-charcoal" : "bg-transparent text-stone-600 border-stone-300"
            )}>02</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-800">Billing</span>
              <span className="text-[9px] text-stone-600 font-medium">Payment address</span>
            </div>
          </div>
          <div className="h-[1px] flex-1 bg-stone-100 max-w-[40px] mx-2" />
          <div className="flex items-center gap-4">
            <span className={cn(
              "h-8 w-8 rounded-none border flex items-center justify-center text-[10px] font-bold tracking-widest",
              step === 3 ? "bg-charcoal text-cream border-charcoal" : "bg-transparent text-stone-600 border-stone-300"
            )}>03</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-800">Review</span>
              <span className="text-[9px] text-stone-600 font-medium">Order review</span>
            </div>
          </div>
        </div>

        {/* STEP 1: Shipping Address Form */}
        {step === 1 && (
          <form onSubmit={onShippingSubmit} className="space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <h3 className="text-md uppercase tracking-[0.2em] font-medium text-stone-800">Shipping Address</h3>
              <p className="text-[11px] text-stone-600 font-light leading-relaxed">
                Provide the details of where your custom handcrafted footwear should be delivered.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField id="firstName" label="Given Name" error={shippingForm.formState.errors.firstName?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="firstName"
                  variant="boxed"
                  placeholder="Eleanor"
                  hasError={Boolean(shippingForm.formState.errors.firstName)}
                  {...shippingForm.register("firstName")}
                />
              </FormField>
              <FormField id="lastName" label="Surname" error={shippingForm.formState.errors.lastName?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="lastName"
                  variant="boxed"
                  placeholder="Vance"
                  hasError={Boolean(shippingForm.formState.errors.lastName)}
                  {...shippingForm.register("lastName")}
                />
              </FormField>
            </div>

            <FormField id="addressLine1" label="Primary Address" error={shippingForm.formState.errors.addressLine1?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
              <Input
                id="addressLine1"
                variant="boxed"
                placeholder="1000 Fifth Avenue"
                hasError={Boolean(shippingForm.formState.errors.addressLine1)}
                {...shippingForm.register("addressLine1")}
              />
            </FormField>

            <FormField id="addressLine2" label="Suite / Apartment (Optional)" error={shippingForm.formState.errors.addressLine2?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
              <Input
                id="addressLine2"
                variant="boxed"
                placeholder="Apt 14B"
                hasError={Boolean(shippingForm.formState.errors.addressLine2)}
                {...shippingForm.register("addressLine2")}
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField id="city" label="City" error={shippingForm.formState.errors.city?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="city"
                  variant="boxed"
                  placeholder="New York"
                  hasError={Boolean(shippingForm.formState.errors.city)}
                  {...shippingForm.register("city")}
                />
              </FormField>
              <FormField id="state" label="Province / State" error={shippingForm.formState.errors.state?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="state"
                  variant="boxed"
                  placeholder="NY"
                  hasError={Boolean(shippingForm.formState.errors.state)}
                  {...shippingForm.register("state")}
                />
              </FormField>
              <FormField id="postalCode" label="Postal Code" error={shippingForm.formState.errors.postalCode?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="postalCode"
                  variant="boxed"
                  placeholder="10028"
                  hasError={Boolean(shippingForm.formState.errors.postalCode)}
                  {...shippingForm.register("postalCode")}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField id="country" label="Country (2-Letter Code)" error={shippingForm.formState.errors.country?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="country"
                  variant="boxed"
                  placeholder="US"
                  maxLength={2}
                  className="uppercase"
                  hasError={Boolean(shippingForm.formState.errors.country)}
                  {...shippingForm.register("country")}
                />
              </FormField>
              <FormField id="phone" label="Primary Phone" error={shippingForm.formState.errors.phone?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="phone"
                  variant="boxed"
                  placeholder="+1 (555) 000-0000"
                  hasError={Boolean(shippingForm.formState.errors.phone)}
                  {...shippingForm.register("phone")}
                />
              </FormField>
            </div>

            <FormField id="email" label="Contact Email Address" error={shippingForm.formState.errors.email?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
              <Input
                id="email"
                variant="boxed"
                placeholder="eleanor@vance.com"
                hasError={Boolean(shippingForm.formState.errors.email)}
                {...shippingForm.register("email")}
              />
            </FormField>

            <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
              <input
                type="checkbox"
                id="billingSame"
                checked={billingSameAsShipping}
                onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-stone-800 focus:ring-stone-600 cursor-pointer"
              />
              <label htmlFor="billingSame" className="text-xs text-stone-600 font-medium cursor-pointer">
                Billing address is the same as shipping address
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              className="h-14 uppercase tracking-[0.2em] text-[10px] font-bold rounded-none shadow-md mt-6"
            >
              Continue to {billingSameAsShipping ? "Review" : "Billing"}
            </Button>
          </form>
        )}

        {/* STEP 2: Custom Billing Address Form */}
        {step === 2 && !billingSameAsShipping && (
          <form onSubmit={onBillingSubmit} className="space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <h3 className="text-md uppercase tracking-[0.2em] font-medium text-stone-800">Billing Address</h3>
              <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                Provide the details corresponding to your credit card or payment billing records.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField id="billFirstName" label="Given Name" error={billingForm.formState.errors.firstName?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="billFirstName"
                  variant="boxed"
                  placeholder="Eleanor"
                  hasError={Boolean(billingForm.formState.errors.firstName)}
                  {...billingForm.register("firstName")}
                />
              </FormField>
              <FormField id="billLastName" label="Surname" error={billingForm.formState.errors.lastName?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="billLastName"
                  variant="boxed"
                  placeholder="Vance"
                  hasError={Boolean(billingForm.formState.errors.lastName)}
                  {...billingForm.register("lastName")}
                />
              </FormField>
            </div>

            <FormField id="billAddressLine1" label="Primary Address" error={billingForm.formState.errors.addressLine1?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
              <Input
                id="billAddressLine1"
                variant="boxed"
                placeholder="1000 Fifth Avenue"
                hasError={Boolean(billingForm.formState.errors.addressLine1)}
                {...billingForm.register("addressLine1")}
              />
            </FormField>

            <FormField id="billAddressLine2" label="Suite / Apartment (Optional)" error={billingForm.formState.errors.addressLine2?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
              <Input
                id="billAddressLine2"
                variant="boxed"
                placeholder="Apt 14B"
                hasError={Boolean(billingForm.formState.errors.addressLine2)}
                {...billingForm.register("addressLine2")}
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField id="billCity" label="City" error={billingForm.formState.errors.city?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="billCity"
                  variant="boxed"
                  placeholder="New York"
                  hasError={Boolean(billingForm.formState.errors.city)}
                  {...billingForm.register("city")}
                />
              </FormField>
              <FormField id="billState" label="Province / State" error={billingForm.formState.errors.state?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="billState"
                  variant="boxed"
                  placeholder="NY"
                  hasError={Boolean(billingForm.formState.errors.state)}
                  {...billingForm.register("state")}
                />
              </FormField>
              <FormField id="billPostalCode" label="Postal Code" error={billingForm.formState.errors.postalCode?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="billPostalCode"
                  variant="boxed"
                  placeholder="10028"
                  hasError={Boolean(billingForm.formState.errors.postalCode)}
                  {...billingForm.register("postalCode")}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField id="billCountry" label="Country (2-Letter Code)" error={billingForm.formState.errors.country?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="billCountry"
                  variant="boxed"
                  placeholder="US"
                  maxLength={2}
                  className="uppercase"
                  hasError={Boolean(billingForm.formState.errors.country)}
                  {...billingForm.register("country")}
                />
              </FormField>
              <FormField id="billPhone" label="Primary Phone" error={billingForm.formState.errors.phone?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="billPhone"
                  variant="boxed"
                  placeholder="+1 (555) 000-0000"
                  hasError={Boolean(billingForm.formState.errors.phone)}
                  {...billingForm.register("phone")}
                />
              </FormField>
            </div>

            <FormField id="billEmail" label="Contact Email Address" error={billingForm.formState.errors.email?.message} className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
              <Input
                id="billEmail"
                variant="boxed"
                placeholder="eleanor@vance.com"
                hasError={Boolean(billingForm.formState.errors.email)}
                {...billingForm.register("email")}
              />
            </FormField>

            <div className="flex gap-4 pt-4 border-t border-stone-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(1)}
                className="flex-1 h-14 uppercase tracking-[0.15em] text-[10px] font-bold rounded-none"
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-[2] h-14 uppercase tracking-[0.2em] text-[10px] font-bold rounded-none"
              >
                Continue to Review
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: Review Order & Gift Messages */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <h3 className="text-md uppercase tracking-[0.2em] font-medium text-stone-800">Review & Customize</h3>
              <p className="text-[11px] text-stone-600 font-light leading-relaxed">
                Review your products, specify custom gift wraps, and authorize order placement.
              </p>
            </div>

            <div className="space-y-6">
              {cart.items.map((item) => (
                <div key={item.variantId} className="p-4 bg-stone-50 border border-stone-100 space-y-4">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 bg-stone-50 border border-stone-200/50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.product?.images?.[0]?.url ? (
                        <img
                          src={
                            item.product.images[0].url.startsWith("http") ||
                            item.product.images[0].url.startsWith("/")
                              ? item.product.images[0].url
                              : imageKitUrl(item.product.images[0].url)
                          }
                          alt={item.product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[9px] font-bold text-stone-400">BAG</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-medium text-stone-800 uppercase tracking-wider truncate">
                        {item.product?.title}
                      </h4>
                      <p className="text-[9px] text-stone-600 uppercase tracking-widest font-bold mt-1 flex flex-wrap items-center gap-2">
                        <span>Size: {item.variant?.size || "One Size"} | Color: {item.variant?.color || "N/A"}</span>
                        {item.variant && (item.variant.inventory ?? 0) <= 0 && (
                          <>
                            {item.variant.allowPreorder ? (
                              <span className="px-1.5 py-0.5 bg-ivory text-gold text-[8px] font-bold border border-sand/30 tracking-widest">Pre-order</span>
                            ) : item.variant.allowBackorder ? (
                              <span className="px-1.5 py-0.5 bg-ivory text-gold text-[8px] font-bold border border-sand/30 tracking-widest">Back-order</span>
                            ) : null}
                          </>
                        )}
                      </p>
                      <p className="text-[10px] text-stone-700 mt-1">
                        {item.quantity} x ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-medium text-stone-800">${item.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Gift Customization */}
                  <div className="pt-3 border-t border-stone-200 border-dashed">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`gift-${item.variantId}`}
                        checked={giftItems[item.variantId]?.isGift ?? false}
                        onChange={() => toggleGift(item.variantId)}
                        className="h-3 w-3 rounded border-stone-300 text-stone-800 focus:ring-stone-600 cursor-pointer"
                      />
                      <label htmlFor={`gift-${item.variantId}`} className="text-[10px] uppercase font-bold tracking-widest text-stone-600 cursor-pointer">
                        This item is an elegant gift
                      </label>
                    </div>
                    {(giftItems[item.variantId]?.isGift) && (
                      <div className="mt-3">
                        <textarea
                          placeholder="Include a sophisticated personal gift message here..."
                          maxLength={500}
                          value={giftItems[item.variantId]?.giftMessage ?? ""}
                          onChange={(e) => handleGiftMessageChange(item.variantId, e.target.value)}
                          className="w-full text-xs p-3 border border-stone-200 focus:outline-none focus:border-stone-800 bg-white min-h-[70px] resize-none font-light placeholder:text-stone-300"
                        />
                        <div className="text-right text-[8px] text-stone-400 uppercase font-bold tracking-widest mt-1">
                          {(giftItems[item.variantId]?.giftMessage || "").length} / 500 characters
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Loyalty Points Redemption Box */}
            {identity && loyalty && loyalty.currentBalance > 0 && (
              <div className="p-5 bg-ivory border border-sand/30 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-gold animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-charcoal">Slipperze Loyalty Rewards</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-stone-600 bg-sand/10 px-2.5 py-1">
                    {loyalty.currentBalance.toLocaleString()} pts available
                  </span>
                </div>

                <p className="text-[10px] text-stone-500 font-light leading-relaxed">
                  You have <strong>{loyalty.currentBalance.toLocaleString()}</strong> reward points (worth <strong>${(loyalty.currentBalance / 100).toFixed(2)}</strong>). You can apply them as a discount on this bespoke purchase.
                </p>

                <div className="flex items-center gap-4 pt-2">
                  <input
                    type="number"
                    min={0}
                    max={Math.min(loyalty.currentBalance, Math.floor((subtotal - discount + shippingCost + tax) * 100))}
                    value={pointsToRedeem || ""}
                    onChange={(e) => {
                      const maxVal = Math.min(
                        loyalty.currentBalance,
                        Math.floor((subtotal - discount + shippingCost + tax) * 100)
                      );
                      const val = Math.min(
                        maxVal,
                        Math.max(0, parseInt(e.target.value) || 0)
                      );
                      setPointsToRedeem(val);
                      setLoyaltyDiscount(parseFloat((val / 100).toFixed(2)));
                    }}
                    placeholder="Points to redeem (e.g. 500)"
                    className="flex-1 text-xs p-3 border border-stone-200 focus:outline-none focus:border-stone-850 bg-white"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      const maxPossiblePoints = Math.min(
                        loyalty.currentBalance,
                        Math.floor((subtotal - discount + shippingCost + tax) * 100)
                      );
                      setPointsToRedeem(maxPossiblePoints);
                      setLoyaltyDiscount(parseFloat((maxPossiblePoints / 100).toFixed(2)));
                    }}
                    className="uppercase tracking-[0.1em] text-[9px] font-bold h-10 px-4 rounded-none border border-stone-200"
                  >
                    Apply Max
                  </Button>
                </div>

                {loyaltyDiscount > 0 && (
                  <p className="text-[10px] text-emerald-700 font-medium">
                    ✓ Applied ${loyaltyDiscount.toFixed(2)} discount using {pointsToRedeem.toLocaleString()} points.
                  </p>
                )}
              </div>
            )}

            {/* Delivery address details summary */}
            <div className="p-4 bg-stone-50 border border-stone-100 rounded-none grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-[8px] uppercase tracking-widest font-bold text-stone-600">Delivery Address</span>
                <div className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                  {shippingForm.getValues().firstName} {shippingForm.getValues().lastName}<br />
                  {shippingForm.getValues().addressLine1} {shippingForm.getValues().addressLine2 && `, ${shippingForm.getValues().addressLine2}`}<br />
                  {shippingForm.getValues().city}, {shippingForm.getValues().state} {shippingForm.getValues().postalCode}<br />
                  {shippingForm.getValues().country}
                </div>
              </div>
              <div>
                <span className="text-[8px] uppercase tracking-widest font-bold text-stone-600">Billing Address</span>
                <div className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                  {billingSameAsShipping ? (
                    <span className="italic text-stone-500">Same as shipping address</span>
                  ) : (
                    <>
                      {billingForm.getValues().firstName} {billingForm.getValues().lastName}<br />
                      {billingForm.getValues().addressLine1} {billingForm.getValues().addressLine2 && `, ${billingForm.getValues().addressLine2}`}<br />
                      {billingForm.getValues().city}, {billingForm.getValues().state} {billingForm.getValues().postalCode}<br />
                      {billingForm.getValues().country}
                    </>
                  )}
                </div>
              </div>
            </div>

            <StripePaymentForm
              cart={cart}
              checkoutId={checkoutId}
              shippingAddress={shippingForm.getValues()}
              billingAddress={billingSameAsShipping ? shippingForm.getValues() : billingForm.getValues()}
              clearCart={clearCart}
              onBack={() => setStep(billingSameAsShipping ? 1 : 2)}
              total={total}
              pointsToRedeem={pointsToRedeem}
              promoCode={promoCode}
            />
          </div>
        )}
      </div>

      {/* Summary Box sidebar */}
      <div className="lg:col-span-5">
        <div className="p-6 bg-stone-50 border border-stone-100 rounded-none sticky top-24 space-y-6">
          <h3 className="text-xs uppercase tracking-[0.25em] font-bold text-stone-850 pb-4 border-b border-stone-200">
            Billing Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between text-xs">
              <span className="text-stone-700 font-medium">Subtotal</span>
              <span className="text-stone-850 font-bold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-stone-700 font-medium">Standard Delivery</span>
              <span className="text-stone-850 font-bold">
                {shippingCost === 0 ? <span className="text-stone-600 uppercase tracking-widest text-[9px] font-bold">FREE</span> : `$${shippingCost.toFixed(2)}`}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-gold font-bold">
                <span>Promotional Discount {promoCode ? `(${promoCode})` : ""}</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            {loyaltyDiscount > 0 && (
              <div className="flex justify-between text-xs text-gold font-bold">
                <span>Loyalty Points Discount</span>
                <span>-${loyaltyDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-stone-700 font-medium">Estimated Sales Tax</span>
              <span className="text-stone-850 font-bold">${tax.toFixed(2)}</span>
            </div>
            <div className="h-[1px] bg-stone-200 w-full" />
            <div className="flex justify-between text-sm">
              <span className="text-stone-800 uppercase tracking-wider font-bold">Total Estimated</span>
              <div className="flex items-center gap-2">
                {(discount > 0 || loyaltyDiscount > 0) && (
                  <span className="text-stone-400 line-through text-xs font-light">
                    ${(total + discount + loyaltyDiscount).toFixed(2)}
                  </span>
                )}
                <span className="text-stone-850 font-bold text-md">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 space-y-3">
            <p className="text-[9px] uppercase tracking-widest font-bold text-stone-700">Authentic Luxury Guarantee</p>
            <p className="text-[10px] text-stone-600 font-light leading-relaxed">
              Every single pair is hand-numbered and dispatched in our signature Slipperze protective custom-fit wooden packaging.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const CARD_ELEMENT_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: {
      color: "#1c1917",
      fontFamily: "var(--ts-font-sans), system-ui, sans-serif",
      fontSize: "14px",
      fontSmoothing: "antialiased",
      "::placeholder": { color: "#a8a29e" },
    },
    invalid: {
      color: "#9f1239",
      iconColor: "#9f1239",
    },
  },
};

interface StripePaymentFormProps {
  cart: { cartId: string };
  checkoutId: string | null;
  shippingAddress: AddressValues;
  billingAddress: AddressValues;
  clearCart: () => Promise<boolean>;
  onBack: () => void;
  total: number;
  pointsToRedeem?: number;
  promoCode?: string | null;
}

export function StripePaymentForm({
  cart,
  checkoutId,
  shippingAddress,
  billingAddress,
  clearCart,
  onBack,
  total,
  pointsToRedeem = 0,
  promoCode,
}: StripePaymentFormProps) {
  return (
    <Elements stripe={getStripe()}>
      <StripePaymentFormInner
        cart={cart}
        checkoutId={checkoutId}
        shippingAddress={shippingAddress}
        billingAddress={billingAddress}
        clearCart={clearCart}
        onBack={onBack}
        total={total}
        pointsToRedeem={pointsToRedeem}
        promoCode={promoCode}
      />
    </Elements>
  );
}

function StripePaymentFormInner({
  cart,
  checkoutId,
  shippingAddress,
  billingAddress,
  clearCart,
  onBack,
  total,
  pointsToRedeem = 0,
  promoCode,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const { data: identity } = useCurrentIdentity();
  const { mutateAsync: redeemPoints } = useRedeemLoyaltyPoints();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeIntentId, setStripeIntentId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [updatingSession, setUpdatingSession] = useState(false);

  useEffect(() => {
    if (!checkoutId) return;
    setUpdatingSession(true);

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setInitError(null);

        // Create Stripe PaymentIntent
        const intent = await createStripePaymentIntent({
          checkoutId,
          amount: total,
        });

        if (active) {
          setClientSecret(intent.clientSecret);
          setStripeIntentId(intent.stripeIntentId);
        }
      } catch (err: unknown) {
        if (active) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("Failed to initialize payment session:", msg);
          setInitError(msg || "Failed to initialize secure payment session. Please try again.");
          toast.error("Stripe initialization failed.");
        }
      } finally {
        if (active) {
          setUpdatingSession(false);
        }
      }
    }, 500); // 500ms debounce

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [checkoutId, total]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!stripe || !elements) {
      setPaymentError("Stripe has not finished loading. Please try again.");
      return;
    }

    if (!clientSecret || !checkoutId || !stripeIntentId || updatingSession) {
      setPaymentError("Payment session is not fully initialized. Please wait a moment.");
      return;
    }

    const card = elements.getElement(CardElement);
    if (!card) {
      setPaymentError("Credit card field is not available. Please refresh and retry.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Confirm Card Payment client-side with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: `${billingAddress.firstName} ${billingAddress.lastName}`,
            email: billingAddress.email || undefined,
            phone: billingAddress.phone || undefined,
            address: {
              line1: billingAddress.addressLine1,
              line2: billingAddress.addressLine2 || undefined,
              city: billingAddress.city,
              state: billingAddress.state,
              postal_code: billingAddress.postalCode,
              country: billingAddress.country,
            },
          },
        },
      });

      if (error) {
        setPaymentError(error.message ?? "Your card was declined. Please try again.");
        toast.error(error.message ?? "Payment failed.");
        setSubmitting(false);
        return;
      }

      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        setPaymentError("Stripe payment capture was incomplete. Please try again.");
        toast.error("Payment status incomplete.");
        setSubmitting(false);
        return;
      }

      // 2. Map addresses perfectly matching backend schema (including email)
      const cleanShippingAddress = {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 || undefined,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone || undefined,
        email: shippingAddress.email || undefined,
      };

      const cleanBillingAddress = {
        firstName: billingAddress.firstName,
        lastName: billingAddress.lastName,
        addressLine1: billingAddress.addressLine1,
        addressLine2: billingAddress.addressLine2 || undefined,
        city: billingAddress.city,
        state: billingAddress.state,
        postalCode: billingAddress.postalCode,
        country: billingAddress.country,
        phone: billingAddress.phone || undefined,
        email: billingAddress.email || undefined,
      };

      // 3. Complete Checkout & Create Order on Backend
      const result = await completeCheckoutWithOrder(checkoutId, {
        paymentIntentId: stripeIntentId,
        shippingAddress: cleanShippingAddress,
        billingAddress: cleanBillingAddress,
        promoCode: promoCode || undefined,
      });

      // 4. Deduct loyalty points if used
      if (pointsToRedeem && pointsToRedeem > 0 && identity?.userId) {
        try {
          await redeemPoints({
            userId: identity.userId,
            points: pointsToRedeem,
            orderId: result.orderId,
            reason: `Redeemed ${pointsToRedeem} points at checkout for order #${result.orderNo}`,
          });
        } catch (err: unknown) {
          console.error("Failed to deduct loyalty points:", err);
        }
      }

      toast.success("Order placed successfully!");
      localStorage.removeItem("applied_promo_code");
      await clearCart();
      router.push(`/checkout/confirmation?orderNumber=${result.orderNo}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Order finalization failure:", err);
      setPaymentError(msg || "Failed to finalize order on server.");
      toast.error(msg || "Checkout completion failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = !clientSecret && !initError;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
          Artisanal Credit Card Details
        </label>
        <div className="border border-stone-200 px-4 py-4 bg-white focus-within:border-stone-850 transition-colors">
          {isLoading ? (
            <div className="h-5 flex items-center text-xs text-stone-400 gap-2">
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-stone-400 border-r-2" />
              Initialising secure card gateway…
            </div>
          ) : initError ? (
            <div className="h-5 flex items-center text-xs text-rose-800">
              {initError}
            </div>
          ) : (
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-stone-50 border border-stone-100 rounded-none">
        <ShieldCheck className="h-4 w-4 text-stone-600 mt-0.5 shrink-0" />
        <p className="text-[10px] text-stone-500 leading-relaxed font-light">
          Your payment credentials are processed securely using bank-grade AES-256 Stripe sandbox encryption.
        </p>
      </div>

      {paymentError && (
        <p className="text-[11px] text-rose-850 font-medium" role="alert">
          {paymentError}
        </p>
      )}

      <div className="flex gap-4 pt-4 border-t border-stone-100">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={submitting}
          className="flex-1 h-14 uppercase tracking-[0.15em] text-[10px] font-bold rounded-none"
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-[2] h-14 uppercase tracking-[0.2em] text-[10px] font-bold rounded-none"
          disabled={submitting || isLoading || updatingSession || !stripe}
          isLoading={submitting}
          onClick={handleSubmit}
        >
          {updatingSession ? "Updating Payment..." : `Confirm & Pay $${total.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
}

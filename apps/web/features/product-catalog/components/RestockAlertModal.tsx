"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Bell } from "lucide-react";
import { cn } from "@tasheen/ui";
import { toast } from "sonner";
import { useRestockReminder } from "../hooks/useRestockReminder";
import { useCurrentIdentity } from "@/features/user-management/hooks/useCurrentIdentity";

interface RestockAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  variantId: string;
  sizeName: string;
  colorName: string;
  productName: string;
}

export function RestockAlertModal({
  isOpen,
  onClose,
  variantId,
  sizeName,
  colorName,
  productName,
}: RestockAlertModalProps) {
  const { subscribe, isSubmitting } = useRestockReminder();
  const { data: identity } = useCurrentIdentity();

  const [channel, setChannel] = useState<"email" | "sms" | "whatsapp">("email");
  const [contactValue, setContactValue] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-fill contact email when user info is available
  useEffect(() => {
    if (identity?.email && channel === "email") {
      setContactValue(identity.email);
    } else {
      setContactValue("");
    }
  }, [identity, channel]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const contactStr = contactValue.trim();
    if (!contactStr) {
      setErrorMsg(`Please enter your ${channel === "email" ? "email address" : "phone number"}.`);
      return;
    }

    // Basic regex validation
    if (channel === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactStr)) {
        setErrorMsg("Please enter a valid email address.");
        return;
      }
    } else {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 phone format
      if (!phoneRegex.test(contactStr.replace(/[\s()-]/g, ""))) {
        setErrorMsg("Please enter a valid phone number (e.g. +1234567890).");
        return;
      }
    }

    try {
      await subscribe({
        type: "restock",
        variantId,
        contact: channel === "email" ? "email" : "phone",
        channel: channel === "email" ? "email" : channel === "sms" ? "sms" : "whatsapp",
      });

      toast.success("Subscription active! We will alert you immediately upon restock.", {
        description: `Alert configured for ${productName} (Size ${sizeName}, ${colorName}) via ${channel.toUpperCase()}.`,
        className: "rounded-xl font-sans tracking-wide uppercase text-[10px]",
      });

      onClose();
    } catch (err: any) {
      console.warn("[RestockAlertModal] subscription failed:", err);
      const msg = err.message || "Failed to subscribe. Please try again.";
      setErrorMsg(msg);
      toast.error(msg, {
        className: "rounded-xl font-sans tracking-wide uppercase text-[10px]",
      });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-charcoal/60 transition-opacity duration-500 animate-in fade-in"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-cream border border-sand/20 rounded-xl shadow-2xl overflow-hidden p-6 lg:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-sand/20 pb-4">
          <div className="space-y-1">
            <h2 className="font-serif text-lg lg:text-xl text-charcoal uppercase tracking-widest font-bold flex items-center gap-2">
              <Bell className="h-5 w-5 text-gold stroke-[1.5]" />
              Stock Alert
            </h2>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">
              Notify me when back in stock
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-charcoal transition-colors p-2"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product specs snippet */}
        <div className="bg-ivory/50 p-4 border border-sand/15 rounded-sm space-y-1 text-[10px] uppercase tracking-wider text-stone-600">
          <p className="font-bold text-charcoal">{productName}</p>
          <div className="flex gap-4 font-semibold text-stone-400">
            <span>Size: {sizeName}</span>
            <span>Color: {colorName}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="bg-burgundy/10 border border-burgundy/25 text-burgundy text-[10px] p-3 rounded-lg uppercase tracking-wider font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Channel Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal">
              Choose Notification Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["email", "sms", "whatsapp"] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={cn(
                    "py-2.5 border text-[9px] font-bold uppercase tracking-widest transition-all duration-300",
                    channel === ch
                      ? "bg-charcoal text-cream border-charcoal"
                      : "bg-white text-charcoal border-sand/20 hover:border-charcoal"
                  )}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Input */}
          <div className="space-y-1.5">
            <label htmlFor="contactInput" className="text-[10px] font-bold uppercase tracking-widest text-charcoal">
              {channel === "email" ? "Email Address" : "Phone Number (with country code)"}
            </label>
            <input
              id="contactInput"
              type={channel === "email" ? "email" : "text"}
              placeholder={channel === "email" ? "e.g. collector@tasheen.com" : "e.g. +15550199"}
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              className="w-full text-[11px] bg-white/70 border border-sand/20 rounded-lg p-3 text-charcoal placeholder-stone-400 focus:outline-none focus:border-charcoal transition-colors focus:ring-0"
              required
            />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-sand/15 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-full border border-sand/30 hover:border-charcoal text-[9px] font-bold uppercase tracking-widest text-stone-600 hover:text-charcoal transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-2.5 rounded-full bg-charcoal hover:bg-gold disabled:bg-stone-300 text-white text-[9px] font-bold uppercase tracking-widest transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  Subscribing
                </>
              ) : (
                "Subscribe Alert"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

/**
 * Newsletter sign-up form. Isolated as a client island so the surrounding
 * footer can be a Server Component — the email input's controlled state
 * was previously forcing the entire footer (3 link columns + trust bar +
 * social row) to re-render on every keystroke.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/engagement/newsletter/subscribe", {
        email,
        source: "footer_form",
      });

      toast.success("Subscribed successfully! Your 10% coupon code is on its way.");
      setEmail("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to subscribe. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your e-mail address"
          required
          disabled={isSubmitting}
          className="flex-1 bg-ivory/60 border border-sand/60 border-r-0 px-4 py-3 text-xs text-charcoal placeholder:text-slate-muted/50 focus:outline-none focus:border-gold transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isSubmitting || !email}
          className="bg-charcoal text-cream px-4 py-3 text-[10px] font-bold uppercase tracking-wider hover:bg-gold hover:text-charcoal transition-colors duration-300 disabled:opacity-50 min-w-[50px] flex items-center justify-center"
        >
          {isSubmitting ? (
            <div className="w-3.5 h-3.5 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
          ) : (
            "OK"
          )}
        </button>
      </form>
      <p className="text-[9px] text-slate-muted/60 italic leading-relaxed">
        (*) Does not apply to discounted products.{" "}
        <Link
          href="/legal/privacy"
          className="underline underline-offset-2 hover:text-charcoal transition-colors"
        >
          Learn more about your data management and rights
        </Link>
      </p>
    </>
  );
}

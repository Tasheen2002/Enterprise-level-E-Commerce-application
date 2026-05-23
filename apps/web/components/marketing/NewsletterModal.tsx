"use client";

import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import Image from "next/image";
import { imageKitUrl } from "@/lib/imagekit";

export function NewsletterModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // 1. Check if user already dismissed or subscribed
    const hasDismissed = localStorage.getItem("ts_newsletter_dismissed_or_subscribed");
    if (hasDismissed) return;

    // 2. Set an elegant 3-second delay on entry
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // 3. Listen for Escape key to close the modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("ts_newsletter_dismissed_or_subscribed", "true");
  };

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
      // Call our modular monolith's engagement service endpoint!
      await api.post("/engagement/newsletter/subscribe", {
        email,
        source: "popup_modal",
      });

      setIsSuccess(true);
      toast.success("Subscribed successfully! Your 10% coupon code is on its way.");
      localStorage.setItem("ts_newsletter_dismissed_or_subscribed", "true");
      
      // Auto close after 2.5 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to subscribe. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-charcoal/40 backdrop-blur-[2px] transition-opacity duration-500 animate-in fade-in">
      {/* Backdrop overlay click to dismiss */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-[900px] bg-white shadow-2xl flex flex-col md:flex-row z-10 border border-stone-200/50 rounded-none overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Close Button ("X") */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 md:right-[calc(50%+16px)] z-50 w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-charcoal/50 hover:text-charcoal transition-all hover:bg-stone-50"
          aria-label="Close newsletter modal"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>

        {/* Left Side: Typography and Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 md:p-16 flex flex-col justify-center bg-white min-h-[350px]">
          {isSuccess ? (
            <div className="text-center space-y-4 py-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-500/10 flex items-center justify-center text-emerald-600 mx-auto">
                <Check className="w-5 h-5" strokeWidth={2} />
              </div>
              <h3 className="font-serif text-2xl text-charcoal tracking-wide">Subscription Complete</h3>
              <p className="text-xs text-charcoal/60 leading-relaxed font-sans max-w-[280px] mx-auto">
                Thank you for subscribing! Your exclusive **10% OFF** coupon has been emailed to you.
              </p>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8 text-center animate-in fade-in duration-500">
              <div className="space-y-3">
                <h2 className="font-serif text-3xl sm:text-4xl text-charcoal tracking-[0.05em] uppercase leading-none">
                  10% OFF*
                </h2>
                <p className="font-serif text-[15px] sm:text-[17px] text-charcoal/80 tracking-wide leading-relaxed lowercase max-w-[320px] mx-auto">
                  your first order when you subscribe to our newsletter.
                </p>
                <div className="pt-2">
                  <p className="text-[9px] text-charcoal/50 leading-relaxed font-sans max-w-[280px] mx-auto uppercase tracking-wider italic">
                    (*) Does not apply to discounted products. Valid only in the current country of delivery (Sri Lanka).
                  </p>
                </div>
              </div>

              {/* Form Input Group */}
              <form onSubmit={handleSubmit} className="flex border border-charcoal bg-[#F9F8F4]">
                <input
                  type="email"
                  required
                  placeholder="Your e-mail address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="flex-1 bg-transparent px-4 py-3.5 text-xs text-charcoal placeholder-charcoal/30 focus:outline-none font-sans"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="bg-charcoal hover:bg-burgundy text-white w-14 flex items-center justify-center text-xs font-bold transition-all uppercase tracking-widest disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "OK"
                  )}
                </button>
              </form>

              <div className="pt-2">
                <a
                  href="/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-charcoal/40 hover:text-charcoal/80 underline font-sans transition-colors tracking-wide"
                >
                  Learn more about your data management and rights
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Lifestyle Image Backdrop */}
        <div className="hidden md:block w-1/2 relative min-h-[450px]">
          <Image
            src={imageKitUrl("lifestyle-newsletter.jpg")}
            alt="Tasheen premium footwear curation"
            fill
            sizes="50vw"
            loading="lazy"
            className="object-cover"
          />
          {/* Subtle warm overlay matches general website aesthetic */}
          <div className="absolute inset-0 bg-charcoal/5" />
        </div>
      </div>
    </div>
  );
}

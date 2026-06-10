"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inquiryType, setInquiryType] = useState("general");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      toast.success("Message received. Our concierge will contact you within 24 hours.");
      setName("");
      setEmail("");
      setInquiryType("general");
      setMessage("");
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <label htmlFor="name" className="text-[10px] uppercase font-sans font-bold tracking-widest text-stone-400">
          Your Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Arthur Pendragon"
          className="w-full bg-transparent border-b border-sand/40 focus:border-gold py-2.5 outline-none font-serif text-base placeholder:italic text-charcoal transition-colors duration-300"
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-[10px] uppercase font-sans font-bold tracking-widest text-stone-400">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. arthur@camelot.com"
          className="w-full bg-transparent border-b border-sand/40 focus:border-gold py-2.5 outline-none font-serif text-base placeholder:italic text-charcoal transition-colors duration-300"
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="inquiryType" className="text-[10px] uppercase font-sans font-bold tracking-widest text-stone-400">
          Inquiry Type
        </label>
        <select
          id="inquiryType"
          value={inquiryType}
          onChange={(e) => setInquiryType(e.target.value)}
          className="w-full bg-transparent border-b border-sand/40 focus:border-gold py-2.5 outline-none font-serif text-base text-charcoal transition-colors duration-300 cursor-pointer appearance-none"
        >
          <option value="general" className="bg-cream">General Inquiries</option>
          <option value="orders" className="bg-cream">Order &amp; Shipping Status</option>
          <option value="sizing" className="bg-cream">Fit &amp; Sizing Advice</option>
          <option value="bespoke" className="bg-cream">Bespoke &amp; Private Fitting</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="message" className="text-[10px] uppercase font-sans font-bold tracking-widest text-stone-400">
          Message
        </label>
        <textarea
          id="message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How may our concierge assist you?"
          className="w-full bg-transparent border-b border-sand/40 focus:border-gold py-2.5 outline-none font-serif text-base placeholder:italic text-charcoal transition-colors duration-300 resize-none"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-charcoal text-cream hover:bg-gold hover:text-charcoal text-[11px] font-sans font-bold uppercase tracking-widest py-4 transition-all duration-300 flex items-center justify-center gap-2 rounded-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Sending Inquiry...
          </>
        ) : (
          "Send Message"
        )}
      </button>
    </form>
  );
}

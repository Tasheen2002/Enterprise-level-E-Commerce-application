"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Newsletter sign-up form. Isolated as a client island so the surrounding
 * footer can be a Server Component — the email input's controlled state
 * was previously forcing the entire footer (3 link columns + trust bar +
 * social row) to re-render on every keystroke.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Wire to newsletter API
    setEmail("");
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
          className="flex-1 bg-ivory/60 border border-sand/60 border-r-0 px-4 py-3 text-xs text-charcoal placeholder:text-slate-muted/50 focus:outline-none focus:border-gold transition-colors"
        />
        <button
          type="submit"
          className="bg-charcoal text-cream px-4 py-3 text-[10px] font-bold uppercase tracking-wider hover:bg-gold hover:text-charcoal transition-colors duration-300"
        >
          OK
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

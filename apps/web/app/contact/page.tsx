import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Container } from "@tasheen/ui";
import { buildMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/contact/ContactForm";
import { Mail, Phone, MessageSquare, Clock } from "lucide-react";

export const metadata = buildMetadata({
  title: "Contact Concierge — Client Care",
  description: "Reach the Slipperze concierge service. Email, WhatsApp, phone coordinates, or send an direct inquiry.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-charcoal">
      <MarketingHeader variant="solid" />

      <main className="flex-grow py-16 sm:py-24">
        <Container size="default" className="space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gold">Client Care</span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl italic tracking-wide">Contact Concierge</h1>
            <p className="font-serif text-lg text-stone-500 max-w-xl mx-auto mt-4">
              Our support team is at your disposal for sizing, orders, and custom consultations.
            </p>
            <div className="h-[1px] w-20 bg-gold/30 mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 pt-8">
            {/* Left Column: Coordinates */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-widest font-sans font-bold text-stone-500">Coordinates</span>
                <h2 className="font-serif text-2xl italic text-charcoal">How to Reach Us</h2>
                <p className="font-serif text-base text-stone-800 leading-relaxed">
                  We aim to respond to all inquiries within 24 business hours. If you require immediate assistance regarding an active order, please call or message our WhatsApp concierge.
                </p>
              </div>

              <div className="space-y-6 font-sans text-xs text-stone-800 font-medium">
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-ivory border border-sand/30 rounded-sm text-gold mt-1">
                    <Mail className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-stone-500">Concierge Email</p>
                    <p className="text-base font-serif text-charcoal mt-1">darshikatasheen99@gmail.com</p>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-ivory border border-sand/30 rounded-sm text-gold mt-1">
                    <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-stone-500">WhatsApp Support</p>
                    <p className="text-base font-serif text-charcoal mt-1">+94766940529</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-ivory border border-sand/30 rounded-sm text-gold mt-1">
                    <Phone className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-stone-500">Telephone</p>
                    <p className="text-base font-serif text-charcoal mt-1">+94766940529</p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-ivory border border-sand/30 rounded-sm text-gold mt-1">
                    <Clock className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-stone-500">Concierge Hours</p>
                    <p className="text-base font-serif text-charcoal mt-1">Mon - Fri: 09:00 - 18:00 (CET)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Feedback Form */}
            <div className="lg:col-span-7 bg-ivory/30 border border-sand/25 p-8 sm:p-10 rounded-sm relative">
              <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.02]" />
              <div className="relative z-10 space-y-6">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-widest font-sans font-bold text-gold">Direct Inquiry</span>
                  <h3 className="font-serif text-xl italic text-charcoal">Send an Message</h3>
                </div>
                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </main>

      <MarketingFooter />
    </div>
  );
}

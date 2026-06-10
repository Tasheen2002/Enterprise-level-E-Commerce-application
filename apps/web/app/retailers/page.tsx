import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Container } from "@tasheen/ui";
import { buildMetadata } from "@/lib/seo";
import { MapPin, Clock, Calendar } from "lucide-react";

export const metadata = buildMetadata({
  title: "Ateliers & Retailers — The House",
  description: "Find a Slipperze flagship atelier or luxury partner boutique near you. Schedule an in-person curation and fitting session.",
  path: "/retailers",
});

interface Store {
  city: string;
  type: string;
  name: string;
  address: string[];
  hours: string[];
  phone: string;
}

const STORES: Store[] = [
  {
    city: "Paris",
    type: "Creative Studio",
    name: "Slipperze Administrative Office",
    address: [
      "14 Rue de l'Odéon",
      "75006 Paris, France"
    ],
    hours: [
      "Mon - Fri: 09:00 - 18:00",
      "Administrative Only (Not open to public)"
    ],
    phone: "+94766940529"
  },
  {
    city: "Tasheen's Warehouse",
    type: "Fulfillment Center",
    name: "Primary Logistics Facility",
    address: [
      "Fulfillment Hub",
      "All online orders are dispatched from here"
    ],
    hours: [
      "Mon - Fri: 08:00 - 17:00",
      "Logistics Only (Not open to public)"
    ],
    phone: "+94766940529"
  }
];

export default function RetailersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-charcoal">
      <MarketingHeader variant="solid" />

      <main className="flex-grow py-16 sm:py-24">
        <Container size="default" className="space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gold">The House</span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl italic tracking-wide">Our Retailers &amp; Ateliers</h1>
            <p className="font-serif text-lg text-stone-850 max-w-xl mx-auto mt-4">
              Experience Slipperze in person at our dedicated flagship ateliers and selected multi-brand partners.
            </p>
            <div className="h-[1px] w-20 bg-gold/30 mx-auto mt-6" />
          </div>

          {/* Virtual Styling Callout */}
          <div className="max-w-4xl mx-auto border border-sand/35 bg-ivory/40 p-8 sm:p-10 rounded-sm relative overflow-hidden text-center">
            <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03]" />
            
            <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
              <Calendar className="h-6 w-6 text-gold mx-auto" strokeWidth={1.5} />
              <h2 className="font-serif text-2.5xl italic text-charcoal">Virtual Styling Consultations</h2>
              <p className="font-serif text-base text-stone-850 leading-relaxed">
                Connect with our team online. Get personalized advice on sizing, materials, or order details before your purchase.
              </p>
              <div className="pt-2">
                <a
                  href="/contact"
                  className="inline-block bg-charcoal text-cream font-sans text-[11px] font-bold uppercase tracking-widest px-8 py-3.5 hover:bg-gold hover:text-charcoal transition-all duration-300 rounded-sm"
                >
                  Schedule Consultation
                </a>
              </div>
            </div>
          </div>

          {/* Ateliers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {STORES.map((store) => (
              <div
                key={store.name}
                className="border border-sand/30 bg-ivory/10 hover:bg-ivory/40 p-8 rounded-sm space-y-6 transition-all duration-500 hover:border-gold/30"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-widest font-sans font-bold text-gold">{store.type}</span>
                    <h3 className="font-serif text-2xl italic text-charcoal">{store.name}</h3>
                  </div>
                  <span className="font-serif text-lg text-stone-600 italic">{store.city}</span>
                </div>

                <div className="h-[1px] w-full bg-sand/20" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans text-xs text-stone-850 leading-relaxed">
                  {/* Address */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-stone-500">
                      <MapPin className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} />
                      <span className="text-[9px] uppercase tracking-wider font-bold">Address</span>
                    </div>
                    <div>
                      {store.address.map((line, i) => (
                        <p key={i} className="font-medium">{line}</p>
                      ))}
                      <p className="mt-1 font-bold text-stone-900">{store.phone}</p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-stone-500">
                      <Clock className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} />
                      <span className="text-[9px] uppercase tracking-wider font-bold">Hours</span>
                    </div>
                    <div className="font-medium">
                      {store.hours.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </main>

      <MarketingFooter />
    </div>
  );
}

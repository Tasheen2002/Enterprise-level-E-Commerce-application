import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Container } from "@tasheen/ui";
import { buildMetadata } from "@/lib/seo";
import { Truck, RotateCcw, ShieldCheck, Mail } from "lucide-react";

export const metadata = buildMetadata({
  title: "Delivery & Returns — Client Care",
  description: "Review Slipperze shipping rates, delivery timelines, customs details, and our complimentary 14-day worldwide returns process.",
  path: "/delivery-returns",
});

interface DeliveryZone {
  zone: string;
  courier: string;
  timeline: string;
  cost: string;
}

const DELIVERY_ZONES: DeliveryZone[] = [
  {
    zone: "United Kingdom",
    courier: "DHL Express / Royal Mail",
    timeline: "1 - 2 Business Days",
    cost: "Complimentary (over £200) or £10"
  },
  {
    zone: "European Union",
    courier: "DHL Express",
    timeline: "2 - 3 Business Days",
    cost: "Complimentary (over €250) or €15"
  },
  {
    zone: "United States & Canada",
    courier: "FedEx Priority",
    timeline: "2 - 4 Business Days",
    cost: "Complimentary (over $300) or $20"
  },
  {
    zone: "Rest of the World",
    courier: "DHL Express International",
    timeline: "3 - 5 Business Days",
    cost: "Flat rate $35"
  }
];

export default function DeliveryReturnsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-charcoal">
      <MarketingHeader variant="solid" />

      <main className="flex-grow py-16 sm:py-24">
        <Container size="default" className="space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gold">Client Care</span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl italic tracking-wide">Delivery &amp; Returns</h1>
            <p className="font-serif text-lg text-stone-850 max-w-xl mx-auto mt-4">
              Our shipping standards are designed to match the premium quality of our footwear.
            </p>
            <div className="h-[1px] w-20 bg-gold/30 mx-auto mt-6" />
          </div>

          {/* Delivery & Returns Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 pt-8">
            {/* Delivery Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4 border-b border-sand/30 pb-4">
                <Truck className="h-5 w-5 text-gold" strokeWidth={1.5} />
                <h2 className="font-serif text-2xl italic text-charcoal">Delivery Service</h2>
              </div>
              <p className="font-serif text-base text-stone-800 leading-relaxed">
                All Slipperze orders are dispatched in our signature boutique packaging from our primary logistics facility, Tasheen's Warehouse. Orders are processed Monday through Friday, excluding public holidays.
              </p>

              {/* Shipping Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-sand/40 text-[9px] uppercase tracking-widest text-stone-500 font-bold">
                      <th className="py-3 pr-4">Zone</th>
                      <th className="py-3 px-4">Courier</th>
                      <th className="py-3 px-4">Timeline</th>
                      <th className="py-3 pl-4">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand/20 text-stone-800 font-medium">
                    {DELIVERY_ZONES.map((zone) => (
                      <tr key={zone.zone}>
                        <td className="py-3.5 pr-4 font-bold text-charcoal">{zone.zone}</td>
                        <td className="py-3.5 px-4">{zone.courier}</td>
                        <td className="py-3.5 px-4">{zone.timeline}</td>
                        <td className="py-3.5 pl-4 font-serif italic text-gold">{zone.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 text-xs font-sans text-stone-800 leading-relaxed bg-ivory/30 p-6 border border-sand/20 rounded-sm">
                <p className="font-bold text-charcoal flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} />
                  Duty &amp; Custom Fees Included
                </p>
                <p className="text-stone-700">
                  For shipments to the UK, US, and EU, all import duties and local taxes are pre-calculated and covered by Slipperze. No additional charges will be collected at delivery.
                </p>
              </div>
            </div>

            {/* Returns Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4 border-b border-sand/30 pb-4">
                <RotateCcw className="h-5 w-5 text-gold" strokeWidth={1.5} />
                <h2 className="font-serif text-2xl italic text-charcoal">Returns &amp; Exchanges</h2>
              </div>
              <p className="font-serif text-base text-stone-800 leading-relaxed">
                If you are not entirely satisfied with your purchase, we provide a complimentary, hassle-free returns service within 14 days of delivery.
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-serif text-lg italic text-charcoal">How to Initiate a Return</h3>
                  <ol className="list-decimal list-inside font-sans text-xs text-stone-850 space-y-3 pl-2 leading-relaxed font-medium">
                    <li>
                      Ensure the footwear is in its original, unworn condition with all protective tissue and tags intact, inside the Slipperze shoe box.
                    </li>
                    <li>
                      Visit our <a href="/contact" className="text-gold font-bold underline">Contact Concierge</a> page or email us with your order number to request a return label.
                    </li>
                    <li>
                      Affix the prepaid shipping label to the shipping carton and drop it off at any authorized carrier point, or request a concierge pickup.
                    </li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif text-lg italic text-charcoal">Exchanges &amp; Refunds</h3>
                  <p className="font-serif text-base text-stone-800 leading-relaxed">
                    Once received and inspected by our quality assurance team, refunds will be credited to the original payment method within 5 to 7 business days. If you require a different size or finish, we recommend initiating a return and placing a new order to reserve your pair immediately.
                  </p>
                </div>

                <div className="space-y-2 text-xs font-sans text-stone-800 leading-relaxed bg-ivory/30 p-6 border border-sand/20 rounded-sm">
                  <p className="font-bold text-charcoal flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} />
                    Need Assistance?
                  </p>
                  <p className="text-stone-700">
                    Please contact our customer care concierge at <span className="font-bold text-charcoal">darshikatasheen99@gmail.com</span> for any questions regarding custom sizing orders or return exceptions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <MarketingFooter />
    </div>
  );
}

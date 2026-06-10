import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Container } from "@tasheen/ui";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Service — Legal",
  description: "Review the official terms of service, ordering policies, preorder regulations, and governing laws of Slipperze.",
  path: "/legal/terms",
});

interface Section {
  id: string;
  title: string;
  content: string[];
}

const TERMS_SECTIONS: Section[] = [
  {
    id: "introduction",
    title: "1. Introduction & Scope",
    content: [
      "Welcome to Slipperze. These Terms of Service govern your access to and use of our website (slipperze.com), including any purchases made from our online boutique.",
      "By placing an order or using our services, you agree to be bound in full by these Terms. If you do not agree to these Terms, please refrain from using our website."
    ]
  },
  {
    id: "intellectual-property",
    title: "2. Intellectual Property",
    content: [
      "All content, imagery, design layouts, graphics, logos, and custom code on Slipperze are the exclusive intellectual property of Slipperze Paris, protected under international copyright and trademark laws.",
      "Any unauthorized reproduction, modification, distribution, or commercial exploitation of our materials is strictly prohibited without explicit written consent."
    ]
  },
  {
    id: "purchases-preorders",
    title: "3. Purchase & Preorder Terms",
    content: [
      "We offer select products on a preorder basis. Preorder items are manufactured in limited artisanal quantities and ship according to the timeline displayed on the product detail page.",
      "Payment is collected at the time of order placement to reserve your materials and secure production. While we strive to meet all estimated timelines, minor shipping delays may occur due to atelier constraints."
    ]
  },
  {
    id: "shipping-duties",
    title: "4. Shipping & Customs",
    content: [
      "We ship internationally to selected destinations. Slipperze is proud to provide Delivery Duty Paid (DDP) shipments to the UK, EU, USA, and Canada, meaning import taxes and custom clearance charges are pre-paid by us.",
      "Title and risk of loss pass to you upon delivery of the items to the carrier. We recommend reviewing our Delivery & Returns page for detailed Courier guidelines."
    ]
  },
  {
    id: "governing-law",
    title: "5. Governing Law & Jurisdictions",
    content: [
      "These Terms of Service and any separate agreements shall be governed by and construed in accordance with the laws of France, without regard to conflict of law principles.",
      "Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Paris, France."
    ]
  }
];

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-charcoal">
      <MarketingHeader variant="solid" />

      <main className="flex-grow py-16 sm:py-24">
        <Container size="default" className="space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gold">Legal Agreements</span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl italic tracking-wide">Terms of Service</h1>
            <p className="font-serif text-xs text-stone-600 uppercase tracking-widest font-sans font-bold">
              Last Updated: June 2026
            </p>
            <div className="h-[1px] w-20 bg-gold/30 mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 pt-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-4 lg:sticky lg:top-28 h-fit space-y-6 hidden lg:block">
              <span className="text-[9px] uppercase tracking-widest font-sans font-bold text-stone-500">Sections</span>
              <ul className="space-y-3 font-sans text-xs text-stone-700 font-medium">
                {TERMS_SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="hover:text-gold hover:underline transition-colors duration-300"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Legal Content Pane */}
            <div className="lg:col-span-8 space-y-10">
              {TERMS_SECTIONS.map((section) => (
                <div key={section.id} id={section.id} className="scroll-mt-32 space-y-4">
                  <h2 className="font-serif text-xl sm:text-2xl italic text-charcoal border-b border-sand/20 pb-2">
                    {section.title}
                  </h2>
                  <div className="space-y-4 font-serif text-base text-stone-850 leading-relaxed">
                    {section.content.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </main>

      <MarketingFooter />
    </div>
  );
}

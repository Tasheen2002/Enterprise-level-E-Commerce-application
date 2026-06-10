import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Container } from "@tasheen/ui";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy — Legal",
  description: "Understand Slipperze's data practices, including details on how we collect, process, and secure your personal coordinates.",
  path: "/legal/privacy",
});

interface Section {
  id: string;
  title: string;
  content: string[];
}

const PRIVACY_SECTIONS: Section[] = [
  {
    id: "collection",
    title: "1. Information We Collect",
    content: [
      "We collect personal coordinates you provide directly to us when making a purchase, subscribing to our newsletter, or contacting customer care. This may include your name, email address, billing/shipping address, telephone number, and payment preferences.",
      "Additionally, we collect automated browsing data (IP addresses, device metadata, cookies) to improve website usability and store security."
    ]
  },
  {
    id: "usage",
    title: "2. How We Use Your Data",
    content: [
      "Your coordinates are processed primarily to fulfill orders, process payments, facilitate deliveries, and coordinate returns.",
      "We also utilize email addresses to send styling curations and promotion codes, subject to your explicit marketing consent, which can be withdrawn at any time."
    ]
  },
  {
    id: "security",
    title: "3. Data Security & Retention",
    content: [
      "Slipperze employs administrative, technical, and physical safeguards designed to protect personal information against accidental, unlawful, or unauthorized destruction, loss, alteration, access, or disclosure.",
      "We retain your personal coordinates only for as long as necessary to fulfill the transactions and legal compliance obligations outlined in this policy."
    ]
  },
  {
    id: "user-rights",
    title: "4. Your Rights (GDPR / CCPA)",
    content: [
      "If you reside in the United Kingdom or European Union, you are entitled to specific rights under General Data Protection Regulation (GDPR), including the right to access, rectify, or request deletion of your personal data.",
      "To exercise these rights, or to file an inquiry regarding California Consumer Privacy Act (CCPA) provisions, please contact our data officer using the contact coordinates below."
    ]
  },
  {
    id: "contact-legal",
    title: "5. Contacting Our Data Officer",
    content: [
      "For any queries regarding this Privacy Policy or your data coordinates, please email us at privacy@slipperze.com, or mail us at: Slipperze Legal Division, 14 Rue de l'Odéon, 75006 Paris, France."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-charcoal">
      <MarketingHeader variant="solid" />

      <main className="flex-grow py-16 sm:py-24">
        <Container size="default" className="space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gold">Legal Agreements</span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl italic tracking-wide">Privacy Policy</h1>
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
                {PRIVACY_SECTIONS.map((section) => (
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
              {PRIVACY_SECTIONS.map((section) => (
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

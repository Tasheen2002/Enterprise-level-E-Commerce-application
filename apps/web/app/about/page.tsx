import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Container } from "@tasheen/ui";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About Us — The House",
  description: "The philosophy and vision behind Slipperze.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-charcoal">
      <MarketingHeader variant="solid" />

      <main className="flex-grow py-16 sm:py-24">
        <Container size="default" className="space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gold">The House</span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl italic tracking-wide">About Slipperze</h1>
            <div className="h-[1px] w-20 bg-gold/30 mx-auto mt-6" />
          </div>

          {/* Grid Layout for Narrative & Image */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-6">
            {/* Left: Narrative Content */}
            <div className="lg:col-span-7 space-y-6 font-serif text-base sm:text-lg leading-relaxed text-stone-800">
              <p className="first-letter:text-6xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:font-bold first-letter:text-charcoal">
                Founded in the heart of Paris, Slipperze was born out of a simple but uncompromising pursuit: to create the ultimate everyday luxury. By merging traditional French cordwaining heritage with modern, minimalist architectural lines, we craft footwear that feels remarkable to wear and is beautiful to behold.
              </p>
              
              <p>
                We believe that true luxury lies in the details that go unnoticed by the crowd but are cherished by the wearer. It is in the selected grain of our vegetable-tanned calfskin, the tension of the hand-stitched welt, and the subtle comfort that molds perfectly to the foot over time.
              </p>

              <blockquote className="border-l-2 border-gold pl-6 py-2 my-8 font-serif italic text-charcoal text-lg sm:text-xl">
                &ldquo;We do not design for seasons; we curate for lifetimes. Our creations are intended to accompany you through the quiet moments of elegance and the grand journeys alike.&rdquo;
              </blockquote>

              <p>
                Every pair of Slipperze sandals and slippers is produced in limited editions inside our family-owned partner ateliers in Tuscany and Portugal. This micro-scale production ensures that every curve, buckle, and seam is personally inspected and finished by hands that have practiced the craft for generations.
              </p>
            </div>

            {/* Right: Atelier Image */}
            <div className="lg:col-span-5">
              <div className="relative border border-sand/40 p-3 bg-ivory/30 rounded-sm">
                <img
                  src="/images/paris_atelier.png"
                  alt="Slipperze Parisian cordwaining atelier"
                  className="w-full h-auto object-cover rounded-sm border border-sand/20"
                />
                <div className="absolute bottom-6 right-6 bg-cream/90 backdrop-blur-sm border border-sand/30 px-4 py-2 rounded-sm text-center">
                  <p className="font-serif text-xs italic text-charcoal">The Paris Atelier</p>
                </div>
              </div>
            </div>
          </div>

          {/* Design Collective Note */}
          <div className="pt-12 border-t border-sand/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-1">
              <h3 className="font-serif text-xl italic text-charcoal">The Slipperze Design Collective</h3>
              <p className="text-[9px] uppercase tracking-widest text-stone-500 font-sans font-bold">Parisian Design Team</p>
            </div>
            <div className="font-serif text-3xl italic text-gold/60 select-none">
              Slipperze Paris
            </div>
          </div>
        </Container>
      </main>

      <MarketingFooter />
    </div>
  );
}

import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Container } from "@tasheen/ui";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "The Journal — The House",
  description: "A curation of styling, notes from the atelier, and seasonal looks from Slipperze.",
  path: "/journal",
});

interface Article {
  slug: string;
  category: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
}

const ARTICLES: Article[] = [
  {
    slug: "curation-of-noir",
    category: "Curation",
    title: "The Curation of Noir: A Study in Monochrome Luxury",
    date: "May 28, 2026",
    excerpt: "Exploring the emotional depth of absolute black. How our master dyers achieve the perfect obsidian hue for our calfskin collection, and tips for pairing monochrome tones in summer.",
    author: "Atelier Design Team"
  },
  {
    slug: "summer-saint-tropez",
    category: "Lookbook",
    title: "Summer in Saint-Tropez: Ease Meets Elegance",
    date: "May 12, 2026",
    excerpt: "A look at our seasonal resort collection styled against the sun-washed plaster walls and azure waters of the French Riviera. Featuring our double-strap natural linen slides.",
    author: "Atelier Styling"
  },
  {
    slug: "evolution-of-sandal",
    category: "Heritage",
    title: "The Evolution of the Sandal: From Utility to Atelier",
    date: "April 18, 2026",
    excerpt: "Tracing the historical lineage of the stitch-down sandal from ancient Mediterranean cordwainers to its place as the definitive modern statement of relaxed, refined luxury.",
    author: "Atelier Design Team"
  }
];

export default function JournalPage() {
  const [featuredArticle, ...remainingArticles] = ARTICLES;

  return (
    <div className="flex min-h-screen flex-col bg-cream text-charcoal">
      <MarketingHeader variant="solid" />

      <main className="flex-grow py-16 sm:py-24">
        <Container size="default" className="space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gold">The House</span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl italic tracking-wide">The Journal</h1>
            <p className="font-serif text-lg text-stone-850 max-w-xl mx-auto mt-4">
              Notes on design, styling, and the art of slow living.
            </p>
            <div className="h-[1px] w-20 bg-gold/30 mx-auto mt-6" />
          </div>

          {/* Featured Article (First one) */}
          {featuredArticle && (
            <div className="max-w-4xl mx-auto border border-sand/35 bg-ivory/30 p-8 sm:p-12 rounded-sm relative group hover:border-gold/30 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03]" />
              
              {/* Featured Text */}
              <div className="relative z-10 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] tracking-widest font-sans font-bold text-stone-500">
                    <span>FEATURED • {featuredArticle.category.toUpperCase()}</span>
                    <span>{featuredArticle.date}</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-4xl italic text-charcoal group-hover:text-gold transition-colors duration-300 leading-snug">
                    {featuredArticle.title}
                  </h2>
                  <p className="font-serif text-base text-stone-850 leading-relaxed max-w-3xl">
                    {featuredArticle.excerpt}
                  </p>
                </div>
                <div className="pt-6 flex justify-between items-center border-t border-sand/20">
                  <span className="text-[10px] font-sans font-bold tracking-widest text-stone-500 uppercase">BY {featuredArticle.author}</span>
                  <span className="font-serif text-xs italic text-gold border-b border-gold/30 pb-0.5 group-hover:border-gold transition-colors duration-300">Read Essay →</span>
                </div>
              </div>
            </div>
          )}

          {/* Remaining Articles List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {remainingArticles.map((article) => (
              <div key={article.slug} className="border-b border-sand/30 pb-8 space-y-4 group hover:border-gold/30 transition-all duration-500">
                <div className="flex justify-between items-center text-[9px] tracking-widest font-sans font-bold text-stone-500">
                  <span>{article.category.toUpperCase()}</span>
                  <span>{article.date}</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl italic text-charcoal group-hover:text-gold transition-colors duration-300">
                  {article.title}
                </h3>
                <p className="font-serif text-base text-stone-800 leading-relaxed">
                  {article.excerpt}
                </p>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[9px] font-sans font-bold tracking-widest text-stone-500 uppercase">BY {article.author}</span>
                  <span className="font-serif text-xs italic text-gold border-b border-gold/30 pb-0.5">Read Essay →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Pagination Info */}
          <div className="pt-8 text-center">
            <span className="font-serif text-xs italic text-stone-500">Subscribers are notified weekly of new journal releases and lookbooks.</span>
          </div>
        </Container>
      </main>

      <MarketingFooter />
    </div>
  );
}

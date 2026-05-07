import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Search, Play } from "lucide-react";
import { Button } from "@tasheen/ui";
import { AccountPopover } from "../features/user-management/components/AccountPopover";

export default function HomePage() {
  return (
    <div className="bg-cream selection:bg-gold selection:text-white">
      {/* Immersive Hero Section */}
      <section className="relative h-[100vh] w-full overflow-hidden">
        <Image
          src="/slipperze_heritage_hero_lifestyle_1777799747121.png"
          alt="Slipperze Artisanal Heritage"
          fill
          priority
          className="object-cover transition-transform duration-[10000ms] hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Boutique Floating Header */}
        <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-10 py-8 text-white bg-gradient-to-b from-black/40 to-transparent">
          <div className="flex gap-8 text-[10px] uppercase tracking-[0.3em] font-bold">
            <Link href="/collection" className="hover:text-gold transition-colors">Collection</Link>
            <Link href="/editorial" className="hover:text-gold transition-colors">Editorial</Link>
            <Link href="/craftsmanship" className="hover:text-gold transition-colors hidden md:block">Craftsmanship</Link>
          </div>
          
          <Link href="/" className="font-serif text-3xl tracking-[0.2em] uppercase italic pr-8">
            Slipperze
          </Link>
          
          <div className="flex items-center gap-6">
            <Search className="h-4 w-4 cursor-pointer hover:text-gold transition-colors" />
            <AccountPopover />
            <Link href="/cart" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 cursor-pointer hover:text-gold transition-colors" />
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 className="font-serif text-7xl md:text-9xl text-white tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-bottom-12 duration-1000">
            The everyday made <br /> <span className="italic">remarkable</span>
          </h1>
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Link href="/collection">
              <Button 
                variant="ghost" 
                className="text-white border-white/40 hover:bg-white hover:text-charcoal px-12 h-14 uppercase tracking-[0.4em] text-[10px] font-bold rounded-none"
              >
                Shop the edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
           <div className="w-[1px] h-16 bg-gradient-to-b from-white/60 to-transparent" />
           <span className="text-[8px] uppercase tracking-[0.4em] text-white/60 font-bold">Descend</span>
        </div>
      </section>

      {/* Curated Lifestyles Section */}
      <section className="py-32 px-10 lg:px-20 bg-cream">
        <header className="text-center space-y-4 mb-20">
          <h2 className="font-serif text-5xl text-charcoal italic">Curated Lifestyles</h2>
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold max-w-lg mx-auto leading-relaxed">
            Discover the intersection of artisanal craft and modern wardrobing.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Collection 1: Urban Explorer */}
          <div className="group cursor-pointer">
            <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 mb-8">
              <Image
                src="/slipperze_urban_explorer_boots_1777799771137.png"
                alt="The Urban Explorer"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-serif text-2xl text-charcoal italic">The Urban Explorer</h3>
              <p className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold group-hover:text-gold transition-colors">Explore Boots</p>
            </div>
          </div>

          {/* Collection 2: Weekend Refinement */}
          <div className="group cursor-pointer md:mt-12">
            <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 mb-8">
              <Image
                src="/slipperze_weekend_refinement_loafers_1777799795741.png"
                alt="Weekend Refinement"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-serif text-2xl text-charcoal italic">Weekend Refinement</h3>
              <p className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold group-hover:text-gold transition-colors">Discover Loafers</p>
            </div>
          </div>

          {/* Collection 3: Evening Elegance */}
          <div className="group cursor-pointer">
            <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 mb-8">
              <Image
                src="/slipperze_evening_elegance_heels_1777799825995.png"
                alt="Evening Elegance"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-serif text-2xl text-charcoal italic">Evening Elegance</h3>
              <p className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold group-hover:text-gold transition-colors">View Heels</p>
            </div>
          </div>
        </div>
      </section>

      {/* Heritage Craftsmanship Section */}
      <section className="relative py-40 overflow-hidden bg-charcoal text-white">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 grayscale pointer-events-none">
           <div className="relative w-full h-full">
              <Image 
                src="/slipperze_heritage_hero_lifestyle_1777799747121.png"
                alt="Heritage Texture"
                fill
                className="object-cover scale-150 rotate-12"
              />
           </div>
        </div>
        
        <div className="relative z-10 px-10 lg:px-20 max-w-4xl space-y-12">
          <header className="space-y-4">
             <p className="text-[10px] uppercase tracking-[0.5em] text-gold font-bold">The Atelier</p>
             <h2 className="font-serif text-6xl md:text-8xl italic leading-tight">Mastery in <br /> every stitch</h2>
          </header>
          
          <p className="text-stone-400 font-serif text-xl md:text-2xl leading-relaxed italic max-w-2xl">
            "We do not build footwear for seasons; we construct companions for decades. Each pair represents over 120 hours of artisanal dedication in our European workshop."
          </p>
          
          <div className="pt-8">
            <Link href="/craftsmanship" className="flex items-center gap-6 group">
               <div className="h-16 w-16 rounded-full border border-gold flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-charcoal transition-all duration-500">
                  <Play className="h-5 w-5 fill-current ml-1" />
               </div>
               <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Observe the craft</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Boutique Footer Footer */}
      <footer className="py-20 px-10 lg:px-20 bg-cream border-t border-stone-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
           <div className="space-y-4">
              <p className="font-serif text-2xl text-charcoal italic pr-8 tracking-widest uppercase">Slipperze</p>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">© 2024 Slipperze. Artisanal Excellence.</p>
           </div>
           
           <div className="flex flex-wrap gap-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">
              <Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-gold transition-colors">Terms</Link>
              <Link href="/shipping" className="hover:text-gold transition-colors">Shipping</Link>
              <Link href="/contact" className="hover:text-gold transition-colors">Contact</Link>
              <Link href="/sustainability" className="hover:text-gold transition-colors">Sustainability</Link>
           </div>
        </div>
      </footer>
    </div>
  );
}

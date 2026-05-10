import Image from "next/image";
import Link from "next/link";
import { imageKitUrl } from "@/lib/imagekit";

/**
 * Entry Landing Page — Bobbies-inspired Split Gate.
 *
 * - Mobile (<lg): the two universes stack vertically. Each panel is
 *   ~55vh so both are visible in two short scrolls; the brand wordmark
 *   sits absolutely centered on the seam between them.
 * - Desktop (lg+): full-screen split — WOMEN | MEN side by side, brand
 *   wordmark anchored at the top of the seam.
 */
export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-cream selection:bg-gold selection:text-white">
      <main className="relative grid grid-cols-1 lg:grid-cols-2 lg:h-screen">
        {/* Women Universe */}
        <Link
          href="/catalog?gender=women"
          className="relative group h-[55vh] lg:h-full w-full overflow-hidden flex items-center justify-center"
        >
          <Image
            src={imageKitUrl("hero-women.png")}
            alt="Women's Collection"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-[3000ms] ease-editorial group-hover:scale-105"
          />
          {/* Subtle warm grain overlay */}
          <div className="absolute inset-0 bg-charcoal/10 group-hover:bg-charcoal/0 transition-colors duration-1000" />

          <div className="relative z-10 text-center animate-in fade-in slide-in-from-left-8 duration-1000">
            <span className="font-serif text-4xl sm:text-5xl lg:text-7xl text-cream tracking-[0.1em] drop-shadow-2xl select-none">
              WOMEN
            </span>
          </div>
        </Link>

        {/* Men Universe */}
        <Link
          href="/catalog?gender=men"
          className="relative group h-[55vh] lg:h-full w-full overflow-hidden flex items-center justify-center"
        >
          <Image
            src={imageKitUrl("hero-men.png")}
            alt="Men's Collection"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-[3000ms] ease-editorial group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-charcoal/10 group-hover:bg-charcoal/0 transition-colors duration-1000" />

          <div className="relative z-10 text-center animate-in fade-in slide-in-from-right-8 duration-1000">
            <span className="font-serif text-4xl sm:text-5xl lg:text-7xl text-cream tracking-[0.1em] drop-shadow-2xl select-none">
              MEN
            </span>
          </div>
        </Link>

        {/* ─── The Central Brand Mark ───
            Mobile: sits exactly on the seam between the two stacked
            panels (top: 55vh = bottom of the WOMEN panel) so it visually
            bridges them like in the bobbies layout.
            Desktop: anchored near the top, bridging both side-by-side
            panels horizontally. */}
        <div className="absolute left-1/2 top-[55vh] lg:top-[20%] -translate-x-1/2 -translate-y-1/2 lg:translate-y-0 z-40 flex flex-col items-center pointer-events-none">
          <h1 className="font-serif text-[36px] sm:text-[56px] lg:text-[100px] text-cream tracking-[0.15em] sm:tracking-[0.2em] leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in duration-1000">
            slipperze
          </h1>
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.5em] sm:tracking-[1em] text-cream/90 font-bold mt-3 sm:mt-6 drop-shadow-md animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            paris
          </span>
        </div>
      </main>
    </div>
  );
}

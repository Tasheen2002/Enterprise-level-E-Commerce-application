"use client";

import Image from "next/image";
import { useState } from "react";

export interface AuthHeroProps {
  imageSrc: string;
  imageAlt: string;
}

/**
 * Editorial side image for the auth pages. Falls back to a styled
 * placeholder block (cream backdrop, brand wordmark watermark) when the
 * file isn't available — so dev environments without the bundled brand
 * asset still render the page layout correctly.
 *
 * Drop the production file at `apps/web/public/images/auth/{name}.jpg`
 * to switch over to the real image.
 */
export function AuthHero({ imageSrc, imageAlt }: AuthHeroProps) {
  const [errored, setErrored] = useState(false);

  return (
    <div className="relative hidden overflow-hidden bg-ivory lg:block">
      {!errored ? (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="select-none font-serif text-[clamp(3rem,6vw,5rem)] tracking-[0.32em] text-charcoal/10">
            TASHEEN
          </span>
        </div>
      )}
    </div>
  );
}

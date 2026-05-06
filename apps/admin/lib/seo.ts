import type { Metadata } from "next";
import { config } from "./config";

/**
 * Builds Next.js Metadata objects with the canonical Tasheen defaults
 * (title template, OG tags, locale). Pages override only what differs.
 */
export interface PageSeo {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
}

export function buildMetadata(seo: PageSeo): Metadata {
  const title = seo.title;
  const description = seo.description ?? "Footwear, refined. Tasheen.";
  const url = seo.path ? `${config.appUrl}${seo.path}` : config.appUrl;
  const image = seo.image ?? `${config.appUrl}/og-default.jpg`;

  return {
    title: { default: title, template: `%s — ${config.brand}` },
    description,
    metadataBase: new URL(config.appUrl),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: config.brand,
      type: "website",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: seo.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

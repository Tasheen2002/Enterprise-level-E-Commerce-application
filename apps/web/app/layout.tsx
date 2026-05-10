import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "@/styles/globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ModalProvider } from "@/providers/ModalProvider";
import { buildMetadata } from "@/lib/seo";
import { Toaster } from "sonner";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--ts-font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--ts-font-sans",
  display: "swap",
});

export const metadata: Metadata = buildMetadata({
  title: "Tasheen — Footwear, refined.",
  description:
    "The everyday made remarkable. Discover Tasheen — premium leather footwear with editorial soul.",
});

const TOAST_OPTIONS = {
  style: {
    background: "white",
    border: "1px solid #f5f5f4", // stone-100
    borderRadius: "0px",
    fontFamily: "var(--ts-font-sans)",
    fontSize: "11px",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    fontWeight: "600",
    color: "#1c1917", // charcoal
    boxShadow:
      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Origins the browser will hit early on most pages. Preconnect opens
  // the TCP + TLS handshake (~100–300 ms saved per origin) before the
  // first asset request, so images / API calls don't pay that cost
  // sequentially after the page chunk arrives.
  const apiOrigin = process.env.NEXT_PUBLIC_API_BASE_URL
    ? new URL(process.env.NEXT_PUBLIC_API_BASE_URL).origin
    : null;

  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <head>
        {apiOrigin && (
          <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
        )}
        <link rel="preconnect" href="https://ik.imagekit.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <ModalProvider>{children}</ModalProvider>
              {/* Bottom-fixed banner — only renders when no consent
                  decision exists. Sits outside ModalProvider so it
                  layers above everything but its own preferences modal
                  (z-90 banner, z-110 modal). */}
              <CookieConsentBanner />
              <Toaster
                position="top-center"
                expand={false}
                richColors
                closeButton
                toastOptions={TOAST_OPTIONS}
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

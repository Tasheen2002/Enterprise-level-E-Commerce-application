import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "@/styles/globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ModalProvider } from "@/providers/ModalProvider";
import { Toaster } from "sonner";

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
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    padding: "16px",
  },
};

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

export const metadata: Metadata = {
  title: "Tasheen — Admin Console",
  description: "Tasheen staff and operations console.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <ModalProvider>{children}</ModalProvider>
              <Toaster
                position="top-center"
                expand={false}
                richColors
                closeButton
                theme="light"
                toastOptions={TOAST_OPTIONS}
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

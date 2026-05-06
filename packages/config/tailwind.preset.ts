import type { Config } from "tailwindcss";

/**
 * Tasheen Tailwind preset. Imported by both apps/web and apps/admin so the
 * design tokens (colors, fonts, spacing rhythm) stay in lockstep.
 *
 * Brand palette mirrors `apps/*\/styles/tokens.css` CSS custom properties so
 * runtime themeable values (dark mode, tier-specific accents) flow through
 * without touching Tailwind config.
 */
const preset: Partial<Config> = {
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "3rem",
        "2xl": "5rem",
      },
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        ivory: "rgb(var(--ts-ivory) / <alpha-value>)",
        cream: "rgb(var(--ts-cream) / <alpha-value>)",
        charcoal: "rgb(var(--ts-charcoal) / <alpha-value>)",
        gold: {
          DEFAULT: "rgb(var(--ts-gold) / <alpha-value>)",
          deep: "rgb(var(--ts-gold-deep) / <alpha-value>)",
        },
        burgundy: "rgb(var(--ts-burgundy) / <alpha-value>)",
        sage: "rgb(var(--ts-sage) / <alpha-value>)",
        slate: {
          muted: "rgb(var(--ts-slate-muted) / <alpha-value>)",
        },
      },
      fontFamily: {
        serif: ["var(--ts-font-serif)", "ui-serif", "Georgia", "serif"],
        sans: [
          "var(--ts-font-sans)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--ts-font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      borderRadius: {
        soft: "12px",
      },
      transitionDuration: {
        300: "300ms",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      boxShadow: {
        editorial: "0 4px 16px -4px rgb(0 0 0 / 0.08)",
        gold: "0 0 0 2px rgb(var(--ts-gold) / 0.4)",
      },
    },
  },
  plugins: [],
};

export default preset;

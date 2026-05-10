import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@tasheen/ui";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Cookie Policy",
  description:
    "How Tasheen uses cookies on the storefront — what each category does and how to change your choices.",
  path: "/legal/cookies",
});

/**
 * Cookie disclosure page. Static content (no dynamic data) so it's
 * pre-rendered at build time and served from the CDN. The banner +
 * preferences modal link here for the legally-required full notice.
 *
 * If you add a new tracking script later, list its cookie name + purpose
 * + retention in the relevant category section below.
 */
export default function CookiePolicyPage() {
  return (
    <Container size="default" className="py-16 lg:py-24">
      <article className="prose-style space-y-12 max-w-3xl mx-auto">
        <header className="space-y-4 text-center pb-8 border-b border-stone-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
            Legal
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl text-charcoal italic tracking-tight">
            Cookie policy
          </h1>
          <p className="text-xs text-stone-400">Last updated: 10 May 2026</p>
        </header>

        <section className="space-y-4 text-sm text-stone-600 leading-relaxed">
          <p>
            This page explains the cookies and similar technologies used on
            tasheen.com, why we use them, and how you can change your
            choices at any time.
          </p>
          <p>
            You can revisit your preferences from the link at the bottom of
            every page or by clearing your browser&apos;s site data. Changes
            apply immediately across all open tabs.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-charcoal italic">
            What is a cookie?
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            A cookie is a small text file that a website stores in your
            browser. Cookies allow the site to recognise you between pages
            and visits, keep you signed in, remember your preferences, and
            measure how the site is used.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="font-serif text-2xl text-charcoal italic">
            Categories we use
          </h2>

          <div className="space-y-2 border-l-2 border-charcoal pl-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-charcoal">
              Strictly necessary
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Required to operate the site. Cannot be disabled.
            </p>
            <ul className="text-sm text-stone-600 list-disc pl-5 space-y-1">
              <li>
                <code className="text-xs bg-stone-50 px-1.5 py-0.5 rounded">
                  tasheen.access_token
                </code>{" "}
                — keeps you signed in. httpOnly, expires after 24 hours.
              </li>
              <li>
                <code className="text-xs bg-stone-50 px-1.5 py-0.5 rounded">
                  tasheen.refresh_token
                </code>{" "}
                — issues fresh access tokens so you don&apos;t have to
                sign in repeatedly. httpOnly, expires after 30 days.
              </li>
              <li>
                <code className="text-xs bg-stone-50 px-1.5 py-0.5 rounded">
                  tasheen.cookie_consent
                </code>{" "}
                — stored in localStorage (not technically a cookie). Records
                your choice on this page so we don&apos;t ask again.
              </li>
            </ul>
          </div>

          <div className="space-y-2 border-l-2 border-stone-200 pl-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-stone-500">
              Analytics &amp; performance
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Anonymous measurement of page views, response times, and
              errors so we can improve the boutique. None are currently in
              use; we will update this section before adding any.
            </p>
          </div>

          <div className="space-y-2 border-l-2 border-stone-200 pl-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-stone-500">
              Marketing &amp; personalisation
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Used to show you relevant collections on other sites and to
              measure the effectiveness of our advertising. None are
              currently in use; we will update this section before adding
              any.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-charcoal italic">
            Changing your choices
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Your choices are stored locally in your browser. To change
            them, click &quot;Customise&quot; in the cookie banner (if it&apos;s
            still showing) or clear the boutique&apos;s site data in your
            browser settings, then refresh the page.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-charcoal italic">
            Questions?
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Write to us at{" "}
            <a
              href="mailto:privacy@tasheen.com"
              className="underline underline-offset-2 hover:text-charcoal"
            >
              privacy@tasheen.com
            </a>{" "}
            — we usually reply within two business days. See also our{" "}
            <Link
              href="/legal/privacy"
              className="underline underline-offset-2 hover:text-charcoal"
            >
              privacy policy
            </Link>
            .
          </p>
        </section>
      </article>
    </Container>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@tasheen/ui";
import {
  LayoutDashboard,
  History,
  BookUser,
  CreditCard,
  ShieldCheck,
  UserX,
  LogOut,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { useLogout } from "../hooks/useLogout";

const navItems = [
  { label: "Dashboard", href: "/account", icon: LayoutDashboard },
  { label: "Order History", href: "/account/orders", icon: History },
  { label: "Address Book", href: "/account/addresses", icon: BookUser },
  { label: "Payment Methods", href: "/account/payment-methods", icon: CreditCard },
  { label: "Security & Settings", href: "/account/settings", icon: ShieldCheck },
  { label: "Account Deletion", href: "/account/delete", icon: UserX },
];

/**
 * Account section navigation. Two layouts:
 *
 * - **Mobile (<lg):** compact toggle bar showing the active section
 *   name + a chevron. Tap to expand a dropdown with all sections plus
 *   "Return to Boutique" and "Sign Out". Auto-closes on selection.
 *
 * - **Desktop (lg+):** sticky vertical sidebar on the left with the
 *   "Slipperze Member" header, full nav list, and Sign Out pinned to
 *   the bottom — exactly the editorial layout the design calls for.
 */
export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  // Pre-warm the /sign-in route bundle once the Sign Out control gets
  // pointer/keyboard attention so the post-logout redirect feels instant.
  const prefetchSignIn = () => router.prefetch("/sign-in");

  // Close the mobile dropdown on route change (e.g. user tapped a link).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ESC closes the mobile dropdown.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const currentItem =
    navItems.find((item) => item.href === pathname) ?? navItems[0]!;
  const CurrentIcon = currentItem.icon;

  return (
    <aside className="w-full lg:w-72 flex flex-col bg-stone-50/30 lg:border-r border-stone-100 lg:sticky lg:top-0 lg:h-[calc(100vh-4rem)]">
      {/* ─── Mobile: compact toggle bar ─── */}
      <div className="lg:hidden border-b border-stone-100">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle account menu"
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors"
        >
          <span className="flex items-center gap-3 min-w-0">
            <CurrentIcon className="h-4 w-4 text-burgundy shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-charcoal truncate">
              {currentItem.label}
            </span>
          </span>
          <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-stone-500 shrink-0">
            Menu
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                open && "rotate-180",
              )}
            />
          </span>
        </button>

        {open && (
          <div className="border-t border-stone-100 animate-in slide-in-from-top-2 fade-in duration-300">
            <ul className="divide-y divide-stone-100">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-4 px-5 py-4 text-[10px] uppercase tracking-[0.25em] transition-colors",
                        isActive
                          ? "text-burgundy font-bold bg-stone-50/60"
                          : "text-stone-500 hover:text-charcoal hover:bg-stone-50/40",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5",
                          isActive ? "text-burgundy" : "text-stone-300",
                        )}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Return + Sign Out group — visually separated so users
                see them as "exit actions" rather than account sections. */}
            <div className="border-t border-stone-100 divide-y divide-stone-100 bg-stone-50/30">
              <Link
                href="/"
                className="flex items-center gap-4 px-5 py-4 text-[10px] uppercase tracking-[0.25em] text-stone-500 hover:text-gold transition-colors group"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-stone-300 group-hover:-translate-x-1 transition-transform" />
                Return to Boutique
              </Link>
              <button
                type="button"
                onMouseEnter={prefetchSignIn}
                onFocus={prefetchSignIn}
                onClick={() => {
                  setOpen(false);
                  logout.mutate();
                }}
                disabled={logout.isPending}
                className="w-full flex items-center gap-4 px-5 py-4 text-[10px] uppercase tracking-[0.25em] text-stone-500 hover:text-burgundy transition-colors group"
              >
                <LogOut className="h-3.5 w-3.5 text-stone-300 group-hover:-translate-x-1 transition-transform" />
                {logout.isPending ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Desktop: sticky sidebar ─── */}
      <Link
        href="/"
        className="hidden lg:block p-8 border-b border-stone-100 group cursor-pointer hover:bg-stone-50 transition-colors"
      >
        <h2 className="font-serif text-lg tracking-widest uppercase text-charcoal group-hover:text-gold transition-colors">
          Slipperze Member
        </h2>
        <p className="text-[10px] tracking-widest uppercase text-stone-400 mt-1">
          Artisanal Excellence
        </p>
      </Link>

      <nav className="hidden lg:block flex-1 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-10 py-5 text-[10px] tracking-[0.25em] uppercase transition-all duration-500 ease-editorial",
                    isActive
                      ? "text-burgundy font-bold bg-stone-50/50"
                      : "text-stone-500 hover:text-charcoal hover:translate-x-1",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 transition-colors duration-500",
                      isActive ? "text-burgundy" : "text-stone-300",
                    )}
                  />
                  {item.label}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-burgundy rounded-r-full" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hidden lg:block p-4 border-t border-stone-100">
        <button
          type="button"
          onMouseEnter={prefetchSignIn}
          onFocus={prefetchSignIn}
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="w-full flex items-center gap-4 px-4 py-4 text-[11px] tracking-widest uppercase text-stone-400 hover:text-burgundy transition-all duration-300 group"
        >
          <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {logout.isPending ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </aside>
  );
}

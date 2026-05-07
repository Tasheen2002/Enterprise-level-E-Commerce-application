"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@tasheen/ui";
import { 
  LayoutDashboard, 
  History, 
  BookUser, 
  CreditCard, 
  ShieldCheck, 
  UserX,
  LogOut
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

export function AccountSidebar() {
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <aside className="w-full lg:w-72 flex flex-col bg-stone-50/30 border-r border-stone-100 lg:sticky lg:top-0 lg:h-[calc(100vh-4rem)]">
      <Link href="/" className="p-8 border-b border-stone-100 block group cursor-pointer hover:bg-stone-50 transition-colors">
        <h2 className="font-serif text-lg tracking-widest uppercase text-charcoal group-hover:text-gold transition-colors">
          Slipperze Member
        </h2>
        <p className="text-[10px] tracking-widest uppercase text-stone-400 mt-1">
          Artisanal Excellence
        </p>
      </Link>

      <nav className="flex-1 py-4">
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
                      : "text-stone-500 hover:text-charcoal hover:translate-x-1"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5 transition-colors duration-500", isActive ? "text-burgundy" : "text-stone-300")} />
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

      <div className="p-4 border-t border-stone-100">
        <button
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

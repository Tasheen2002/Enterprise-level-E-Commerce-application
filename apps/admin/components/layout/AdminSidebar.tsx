"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Box,
  Truck,
  Image as ImageIcon,
  Tag,
  PenTool,
  Settings,
  Users,
  Shield,
} from "lucide-react";

const NAV_GROUPS = [
  {
    title: "Overview",
    items: [{ title: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    title: "Catalog",
    items: [
      { title: "Products", href: "/products", icon: Package },
      { title: "Categories", href: "/categories", icon: Layers },
      { title: "Tags", href: "/tags", icon: Tag },
    ],
  },
  {
    title: "Sales",
    items: [
      { title: "Orders", href: "/orders", icon: ShoppingCart },
      { title: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    title: "Inventory",
    items: [
      { title: "Stock", href: "/inventory", icon: Box },
      { title: "Purchase Orders", href: "/inventory/purchase-orders", icon: Truck },
    ],
  },
  {
    title: "Content",
    items: [
      { title: "Editorial Looks", href: "/editorial", icon: PenTool },
      { title: "Media Library", href: "/media", icon: ImageIcon },
    ],
  },
  {
    title: "System",
    items: [
      { title: "Team", href: "/team", icon: Shield },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] flex-shrink-0 bg-[#F5F1E8] text-charcoal flex flex-col h-screen sticky top-0 overflow-y-auto no-scrollbar">
      {/* Brand */}
      <div className="pt-10 pb-12 px-8 flex-shrink-0">
        <Link href="/" className="group block">
          <h2 className="text-[13px] font-serif tracking-[0.25em] uppercase text-charcoal mb-1">
            Tasheen Admin
          </h2>
          <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-charcoal/60 leading-none">
            Artisanal Excellence
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="px-4 text-[10px] text-charcoal/80 uppercase tracking-[0.4em] mb-4 font-bold">
              {group.title}
            </h3>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <li key={item.title} className="relative">
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] bg-burgundy" />
                    )}
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-[0.2em] transition-all duration-300 ${
                        isActive
                          ? "text-burgundy font-semibold"
                          : "text-charcoal/70 hover:text-charcoal"
                      }`}
                    >
                      <item.icon className={`w-[14px] h-[14px] ${isActive ? "text-burgundy" : "text-charcoal/50"}`} strokeWidth={1.2} />
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div className="p-6 flex-shrink-0">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 text-[11px] text-charcoal/70 hover:text-charcoal uppercase tracking-[0.2em] transition-colors"
        >
          <Settings className="w-[14px] h-[14px] text-charcoal/40 group-hover:text-charcoal" strokeWidth={1.2} />
          Settings
        </Link>
      </div>
    </aside>
  );
}

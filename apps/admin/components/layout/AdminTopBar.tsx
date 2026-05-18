"use client";

import Link from "next/link";
import { Search, Bell, User, LogOut } from "lucide-react";
import { clearAuthToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export function AdminTopBar() {
  const router = useRouter();
  const { user } = useAuth();

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email?.split('@')[0] || "Admin User";

  const handleLogout = () => {
    clearAuthToken();
    window.location.href = "/login";
  };

  return (
    <header className="flex items-center justify-between px-12 py-6 bg-[#F5F1E8] flex-shrink-0">
      <div className="flex flex-col gap-3 flex-1">
        <Link
          href="http://localhost:3000"
          className="text-[9px] tracking-[0.35em] uppercase text-charcoal/70 hover:text-charcoal transition-colors flex items-center gap-2 group w-fit font-medium"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span> Return to Storefront
        </Link>
        <div className="relative w-80 group">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/50 group-focus-within:text-charcoal transition-colors duration-300" strokeWidth={1.2} />
          <input
            type="text"
            placeholder="Search products, orders, customers..."
            className="w-full bg-transparent border-b border-charcoal/10 text-charcoal text-[11px] font-medium pl-6 pr-4 py-1.5 focus:outline-none focus:border-charcoal/30 placeholder:text-charcoal/50 transition-colors duration-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button className="p-2 text-charcoal/30 hover:text-charcoal transition-colors duration-300 relative group">
          <Bell className="w-[18px] h-[18px]" strokeWidth={1.2} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-burgundy rounded-full"></span>
        </button>

        <div className="flex items-center gap-6">
          <Link href="/profile" className="flex items-center gap-3 text-[11px] text-charcoal/60 group hover:opacity-80 transition-all">
            <div className="w-8 h-8 rounded-full bg-[#EFEBE0] flex items-center justify-center border border-charcoal/5 group-hover:border-burgundy/20 transition-colors">
              <User className="w-3.5 h-3.5 text-charcoal/40 group-hover:text-burgundy/50 transition-colors" strokeWidth={1.2} />
            </div>
            <span className="hidden md:block tracking-wide font-medium group-hover:text-charcoal transition-colors">
              {displayName}
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 text-charcoal/30 hover:text-charcoal transition-colors duration-300 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold border-l border-charcoal/5 pl-6 ml-2"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.2} />
            <span className="hidden lg:block">Exit</span>
          </button>
        </div>
      </div>
    </header>
  );
}

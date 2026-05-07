"use client";

import Link from "next/link";
import { User, LogIn, UserPlus, ShoppingBag, Settings, LogOut } from "lucide-react";
import { useState, useRef } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useLogout } from "../hooks/useLogout";

interface AccountPopoverProps {
  // We'll use the hook internally, but keep the prop for overrides if needed
  isLoggedIn?: boolean;
}

export function AccountPopover({ isLoggedIn: isLoggedInProp }: AccountPopoverProps) {
  const { isAuthenticated } = useAuth();
  const logout = useLogout();
  const isLoggedIn = isLoggedInProp ?? isAuthenticated;
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpen = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleClose = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <Link 
        href={isLoggedIn ? "/account" : "/sign-in"}
        className="flex items-center gap-2 hover:text-gold transition-colors py-2"
      >
        <User className="h-4 w-4" />
      </Link>

      {isOpen && (
        <div 
          className="absolute right-0 top-full w-64 bg-white shadow-2xl border border-stone-100 animate-in fade-in zoom-in-95 duration-300 z-[100]"
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
          {/* Header */}
          <div className="p-6 border-b border-stone-50 bg-stone-50/50">
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-400 mb-1">
              {isLoggedIn ? "Member" : "Identity"}
            </p>
            <p className="font-serif text-lg text-charcoal italic leading-tight">
              {isLoggedIn ? "Welcome back" : "Boutique Access"}
            </p>
          </div>

          {/* Links */}
          <div className="p-4 space-y-1">
            {!isLoggedIn ? (
              <>
                <Link 
                  href="/sign-in" 
                  className="flex items-center gap-3 px-4 py-3 text-[9px] uppercase tracking-[0.2em] font-bold text-stone-500 hover:text-gold hover:bg-stone-50 transition-all group"
                >
                  <LogIn className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  Sign In
                </Link>
                <Link 
                  href="/sign-up" 
                  className="flex items-center gap-3 px-4 py-3 text-[9px] uppercase tracking-[0.2em] font-bold text-stone-500 hover:text-gold hover:bg-stone-50 transition-all group"
                >
                  <UserPlus className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  Commission Account
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href="/account" 
                  className="flex items-center gap-3 px-4 py-3 text-[9px] uppercase tracking-[0.2em] font-bold text-stone-500 hover:text-gold hover:bg-stone-50 transition-all group"
                >
                  <User className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  Heritage Portfolio
                </Link>
                <Link 
                  href="/account/orders" 
                  className="flex items-center gap-3 px-4 py-3 text-[9px] uppercase tracking-[0.2em] font-bold text-stone-500 hover:text-gold hover:bg-stone-50 transition-all group"
                >
                  <ShoppingBag className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  Order Archive
                </Link>
                <Link 
                  href="/account/settings" 
                  className="flex items-center gap-3 px-4 py-3 text-[9px] uppercase tracking-[0.2em] font-bold text-stone-500 hover:text-gold hover:bg-stone-50 transition-all group"
                >
                  <Settings className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  Security Protocol
                </Link>
                <div className="h-px bg-stone-100 my-2 mx-4" />
                <button 
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[9px] uppercase tracking-[0.2em] font-bold text-burgundy/60 hover:text-burgundy hover:bg-burgundy/5 transition-all group disabled:opacity-50"
                >
                  <LogOut className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  {logout.isPending ? "Terminating..." : "Terminate Session"}
                </button>
              </>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-4 bg-stone-50/30 border-t border-stone-50">
            <p className="text-[8px] uppercase tracking-[0.1em] text-stone-400 font-bold leading-relaxed italic">
              Need assistance? Our concierge is available to guide your selection.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { useAuth } from "@/providers/AuthProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [mounted, isAuthenticated, isLoading, router, pathname]);

  // Safely check for token presence on the client to skip the loading state once mounted
  const hasToken = typeof window !== "undefined" && !!window.localStorage.getItem("tasheen.access_token");

  if (!mounted || (isLoading && !hasToken)) {
    return (
      <div className="h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-charcoal/10 border-t-charcoal animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-[#F5F1E8]">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminTopBar />
        <main className="flex-1 overflow-y-auto px-12 py-10 text-charcoal">
          {children}
        </main>
      </div>
    </div>
  );
}



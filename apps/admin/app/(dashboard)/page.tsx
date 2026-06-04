import { DashboardMetrics } from "@/features/dashboard/components/DashboardMetrics";
import { RevenueAnalyticsCard } from "@/features/dashboard/components/RevenueAnalyticsCard";
import { TodaysPulseCard } from "@/features/dashboard/components/TodaysPulseCard";
import { BestSellerCard } from "@/features/dashboard/components/BestSellerCard";
import { RecentOrdersTable } from "@/features/dashboard/components/RecentOrdersTable";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-14 max-w-6xl">

      {/* ─── Hero Header ─── */}
      <div className="space-y-4">
        <h1 className="text-6xl font-serif text-charcoal">Dashboard Overview</h1>
        <p className="text-[10px] font-bold text-charcoal/60 uppercase tracking-[0.3em] max-w-2xl leading-relaxed">
          Monitor your store&apos;s performance, track active orders, and manage customer interactions across the Slipperze boutique ecosystem in real-time.
        </p>
        <div className="flex items-center gap-5 pt-2">
          <p className="text-[9px] font-bold text-charcoal/50 uppercase tracking-[0.4em]">Operational Status: <span className="text-burgundy">Active</span></p>
          <div className="h-px w-10 bg-sand/40" />
          <button className="text-[9px] font-bold text-charcoal uppercase tracking-[0.4em] hover:text-burgundy transition-colors flex items-center gap-2 group">
            <span className="group-hover:rotate-12 transition-transform duration-500">⚙</span> EDIT DASHBOARD
          </button>
        </div>
      </div>

      {/* ─── Metrics ─── */}
      <DashboardMetrics />

      {/* ─── Analytics Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Revenue Chart Card */}
        <div className="lg:col-span-8">
          <RevenueAnalyticsCard />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">

          {/* Quick Stats */}
          <TodaysPulseCard />

          {/* Top Product */}
          <BestSellerCard />

        </div>
      </div>

      {/* ─── Recent Orders Table ─── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] text-charcoal/70 uppercase tracking-[0.2em] font-medium">Recent Orders</h3>
          <Link href="/orders" className="text-[10px] text-charcoal/60 hover:text-charcoal uppercase tracking-[0.15em] transition-colors flex items-center gap-1.5 group font-medium">
            View All <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={1.5} />
          </Link>
        </div>

        <RecentOrdersTable />
      </div>

    </div>
  );
}

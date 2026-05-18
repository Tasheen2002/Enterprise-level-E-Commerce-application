import { DashboardMetrics } from "@/features/dashboard/components/DashboardMetrics";
import { ArrowUpRight, Clock, TrendingUp } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-14 max-w-6xl">

      {/* ─── Hero Header ─── */}
      <div className="space-y-4">
        <h1 className="text-6xl font-serif text-charcoal">Dashboard Overview</h1>
        <p className="text-[10px] font-bold text-charcoal/60 uppercase tracking-[0.3em] max-w-2xl leading-relaxed">
          Monitor your store&apos;s performance, track active orders, and manage customer interactions across the Tasheen boutique ecosystem in real-time.
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
        <div className="lg:col-span-8 bg-[#EBE6D9] rounded-2xl p-8 space-y-6 shadow-sm border border-charcoal/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[11px] text-charcoal font-bold uppercase tracking-[0.2em]">Revenue Analytics</h3>
              <p className="text-3xl font-serif text-charcoal mt-1">$45,231.89</p>
            </div>
            <div className="flex items-center gap-2 bg-ivory rounded-full px-4 py-2 shadow-sm">
              <TrendingUp className="w-3 h-3 text-burgundy" strokeWidth={1.5} />
              <span className="text-[10px] text-burgundy font-medium tracking-wide">+20.1%</span>
            </div>
          </div>

          {/* Simulated chart bars */}
          <div className="flex items-end gap-2 h-[220px] pt-4">
            {[45, 62, 38, 78, 55, 90, 72, 85, 68, 95, 60, 88].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-charcoal/8 hover:bg-burgundy/20 transition-colors duration-500 cursor-pointer relative group"
                  style={{ height: `${h}%` }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-charcoal/15 group-hover:bg-burgundy/40 transition-all duration-500"
                    style={{ height: `${h * 0.6}%` }}
                  />
                </div>
                <span className="text-[9px] text-charcoal/60 font-bold uppercase tracking-widest">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">

          {/* Quick Stats */}
          <div className="bg-charcoal rounded-2xl p-6 text-cream space-y-5 shadow-lg shadow-charcoal/20">
            <h3 className="text-[10px] text-cream/60 uppercase tracking-[0.25em] font-bold">Today&apos;s Pulse</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-cream/70">Orders Today</span>
                <span className="text-2xl font-serif text-cream">24</span>
              </div>
              <div className="h-px bg-cream/10" />
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-cream/70">Avg. Order Value</span>
                <span className="text-2xl font-serif text-cream">$186</span>
              </div>
              <div className="h-px bg-cream/10" />
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-cream/70">Items Shipped</span>
                <span className="text-2xl font-serif text-cream">67</span>
              </div>
            </div>
          </div>

          {/* Top Product */}
          <div className="bg-[#EBE6D9] rounded-2xl p-6 space-y-4 shadow-sm border border-charcoal/5">
            <h3 className="text-[10px] text-charcoal/80 uppercase tracking-[0.3em] font-bold">Best Seller</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-ivory shadow-sm flex items-center justify-center">
                <span className="text-xl">👠</span>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-serif text-charcoal leading-tight">Lenka Mocha</p>
                <p className="text-[10px] text-charcoal/70 font-medium">142 units · $28,400</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-charcoal/40 group-hover:text-charcoal transition-colors" strokeWidth={1.5} />
            </div>
          </div>

        </div>
      </div>

      {/* ─── Recent Orders Table ─── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] text-charcoal/70 uppercase tracking-[0.2em] font-medium">Recent Orders</h3>
          <button className="text-[10px] text-charcoal/60 hover:text-charcoal uppercase tracking-[0.15em] transition-colors flex items-center gap-1.5 group font-medium">
            View All <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={1.5} />
          </button>
        </div>

        <div className="bg-[#EBE6D9] rounded-2xl overflow-hidden shadow-sm border border-charcoal/5">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 text-[9px] text-charcoal/70 uppercase tracking-[0.2em] font-bold">
            <div className="col-span-3">Order</div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>

          {/* Table Rows */}
          {[
            { id: "#1001", customer: "Sarah Mitchell", status: "Processing", date: "2 mins ago", amount: "$342.00" },
            { id: "#1002", customer: "James Park", status: "Shipped", date: "18 mins ago", amount: "$128.50" },
            { id: "#1003", customer: "Elena Rossi", status: "Delivered", date: "1 hour ago", amount: "$567.00" },
            { id: "#1004", customer: "Marcus Chen", status: "Processing", date: "2 hours ago", amount: "$89.99" },
            { id: "#1005", customer: "Amélie Dubois", status: "Shipped", date: "3 hours ago", amount: "$412.00" },
          ].map((order) => (
            <div key={order.id} className="grid grid-cols-12 gap-4 px-6 py-5 border-t border-charcoal/[0.04] hover:bg-[#EFEBE0]/40 transition-colors duration-300 group cursor-pointer">
              <div className="col-span-3">
                <p className="text-[12px] text-charcoal font-medium">{order.id}</p>
              </div>
              <div className="col-span-3">
                <p className="text-[12px] text-charcoal/80 font-medium">{order.customer}</p>
              </div>
              <div className="col-span-2">
                <span className={`text-[9px] uppercase tracking-[0.15em] font-medium ${
                  order.status === "Processing" ? "text-gold-deep" :
                  order.status === "Shipped" ? "text-charcoal/70" :
                  "text-sage"
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="col-span-2 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-charcoal/40" strokeWidth={1.2} />
                <p className="text-[11px] text-charcoal/60 font-medium">{order.date}</p>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-[13px] font-serif text-charcoal group-hover:text-burgundy transition-colors duration-300">{order.amount}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

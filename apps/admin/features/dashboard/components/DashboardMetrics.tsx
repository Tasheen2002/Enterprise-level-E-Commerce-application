"use client";

import { TrendingUp, Users, ShoppingBag, DollarSign } from "lucide-react";

export function DashboardMetrics() {
  const metrics = [
    { title: "Total Revenue", value: "$45,231.89", icon: DollarSign, trend: "+20.1% from last month", up: true },
    { title: "Active Orders", value: "142", icon: ShoppingBag, trend: "+12.5% from last month", up: true },
    { title: "New Customers", value: "2,350", icon: Users, trend: "+18.2% from last month", up: true },
    { title: "Conversion Rate", value: "3.24%", icon: TrendingUp, trend: "+1.2% from last month", up: true },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((m) => (
        <div key={m.title} className="bg-[#EBE6D9] rounded-2xl p-6 group hover:bg-[#EBE6D9]/80 transition-all duration-500 cursor-default shadow-sm border border-charcoal/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[9px] text-charcoal/60 uppercase tracking-[0.2em] font-bold">{m.title}</h3>
            <m.icon className="w-3.5 h-3.5 text-charcoal/30 group-hover:text-burgundy/50 transition-colors duration-500" strokeWidth={1.2} />
          </div>
          <p className="text-3xl font-serif text-charcoal tracking-tight">{m.value}</p>
          <p className="text-[9px] text-charcoal/50 mt-2 uppercase tracking-[0.1em] font-bold">{m.trend}</p>
        </div>
      ))}
    </div>
  );
}

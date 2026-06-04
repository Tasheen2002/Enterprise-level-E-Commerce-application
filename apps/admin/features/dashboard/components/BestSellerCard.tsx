"use client";

import { ArrowUpRight, Award } from "lucide-react";
import { useAdminDashboardMetrics } from "../../orders/hooks/useAdminOrders";
import Image from "next/image";
import Link from "next/link";
import { imageKitUrl } from "../../../lib/imagekit";

export function BestSellerCard() {
  const { data, isLoading } = useAdminDashboardMetrics();
  const bestSeller = data?.bestSeller;

  if (isLoading) {
    return (
      <div className="bg-[#EBE6D9] rounded-2xl p-6 space-y-4 shadow-sm border border-charcoal/5 animate-pulse">
        <div className="h-3 w-16 bg-charcoal/10 rounded" />
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-charcoal/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 bg-charcoal/10 rounded" />
            <div className="h-3 w-20 bg-charcoal/10 rounded" />
          </div>
          <div className="w-4 h-4 bg-charcoal/10 rounded" />
        </div>
      </div>
    );
  }

  // Fallback to mock data if there are absolutely no sales recorded in the DB
  const displayProduct = bestSeller || {
    productId: "",
    title: "Lenka Mocha",
    units: 142,
    revenue: 28400,
    image: null,
  };

  const imageUrl = displayProduct.image
    ? (displayProduct.image.startsWith("http") ? displayProduct.image : imageKitUrl(displayProduct.image))
    : null;

  return (
    <div className="bg-[#EBE6D9] rounded-2xl p-6 space-y-4 shadow-sm border border-charcoal/5 group hover:bg-[#EBE6D9]/80 transition-all duration-500 cursor-default">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] text-charcoal/80 uppercase tracking-[0.3em] font-bold">Best Seller</h3>
        <Award className="w-3.5 h-3.5 text-charcoal/30 group-hover:text-gold transition-colors duration-500" strokeWidth={1.5} />
      </div>
      
      {displayProduct.productId ? (
        <Link 
          href={`/products/${displayProduct.productId}`}
          className="flex items-center gap-4 group/link"
        >
          <div className="w-14 h-14 rounded-xl bg-ivory shadow-sm flex items-center justify-center overflow-hidden relative border border-charcoal/5">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={displayProduct.title}
                fill
                className="object-cover group-hover/link:scale-110 transition-transform duration-500"
              />
            ) : (
              <span className="text-xl group-hover/link:scale-110 transition-transform duration-500">👠</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-serif text-charcoal leading-tight truncate group-hover/link:text-burgundy transition-colors duration-300">
              {displayProduct.title}
            </p>
            <p className="text-[10px] text-charcoal/70 font-medium mt-0.5">
              {displayProduct.units} {displayProduct.units === 1 ? "unit" : "units"} · {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(displayProduct.revenue)}
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-charcoal/40 group-hover/link:text-charcoal group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-all duration-300" strokeWidth={1.5} />
        </Link>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-ivory shadow-sm flex items-center justify-center overflow-hidden relative border border-charcoal/5">
            <span className="text-xl">👠</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-serif text-charcoal leading-tight truncate">
              {displayProduct.title}
            </p>
            <p className="text-[10px] text-charcoal/70 font-medium mt-0.5">
              {displayProduct.units} units · {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(displayProduct.revenue)}
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-charcoal/40" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}

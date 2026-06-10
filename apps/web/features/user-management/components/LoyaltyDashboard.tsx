"use client";

import Link from "next/link";
import { useLoyaltyAccount, useLoyaltyTransactions } from "../hooks/useLoyalty";
import {
  Coins,
  Star,
  Award,
  History,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

const TIER_BENEFITS: Record<string, string[]> = {
  STYLE_LOVER: [
    "Earn 1 point per $1 spent on all custom collections",
    "Welcome sign-up bonus of 500 reward points",
    "Standard access to seasonal bespoke shoe drops",
  ],
  FASHION_FAN: [
    "Earn 1.25x points multiplier on all custom creations",
    "Welcome bonus points",
    "Early access (24 hours) to limited footwear releases",
    "Complimentary cleaning kit with orders over $250",
  ],
  STYLE_INSIDER: [
    "Earn 1.5x points multiplier on all orders",
    "Free express courier delivery on all acquisitions",
    "Exclusive private invitations to virtual lookbooks",
    "Priority support channel",
  ],
  VIP_STYLIST: [
    "Earn 2.0x points multiplier on all orders",
    "Dedicated personal concierge for custom fittings",
    "Priority fulfillment dispatch queue",
    "Exclusive VIP events and brand showcase invitations",
  ],
};

const TIER_NAMES: Record<string, string> = {
  STYLE_LOVER: "Style Lover",
  FASHION_FAN: "Fashion Fan",
  STYLE_INSIDER: "Style Insider",
  VIP_STYLIST: "VIP Stylist",
};

export function LoyaltyDashboard() {
  const { data: loyalty, isLoading: accountLoading } = useLoyaltyAccount();
  const { data: transactions, isLoading: txsLoading } = useLoyaltyTransactions(loyalty?.id);

  const isLoading = accountLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-stone-850 border-r-2" />
        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-400">Loading Rewards Ledger...</p>
      </div>
    );
  }

  const currentPoints = loyalty?.currentBalance ?? 0;
  const lifetimePoints = loyalty?.lifetimePoints ?? 0;
  const rawTier = loyalty?.tier ?? "STYLE_LOVER";
  const displayTier = TIER_NAMES[rawTier] || rawTier.replace(/_/g, " ");
  const currentBenefits = TIER_BENEFITS[rawTier] ?? TIER_BENEFITS.STYLE_LOVER;

  // Progress calculations
  const nextTier = loyalty?.nextTier;
  const pointsToNext = loyalty?.pointsToNextTier ?? 0;
  const nextTierName = nextTier ? TIER_NAMES[nextTier] || nextTier.replace(/_/g, " ") : null;
  const nextTierThreshold = nextTier ? lifetimePoints + pointsToNext : 0;
  const progressPercent = nextTierThreshold > 0 ? Math.min(100, (lifetimePoints / nextTierThreshold) * 100) : 100;

  return (
    <div className="flex-1 p-5 sm:p-8 lg:px-16 lg:pb-16 lg:pt-24 space-y-10 sm:space-y-16 max-w-7xl mx-auto">
      {/* Return Link */}
      <div className="mb-4">
        <Link
          href="/account"
          className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] font-bold text-stone-500 hover:text-gold transition-all duration-500 group"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
          Return to Dashboard
        </Link>
      </div>

      {/* Main Header / Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Tier Status Card */}
        <div className="lg:col-span-7 bg-ivory border border-sand/20 p-6 sm:p-10 space-y-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-40 w-40 bg-sand/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-gold/5 transition-colors duration-700" />
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-none bg-stone-100 border border-sand/30 flex items-center justify-center text-gold">
              <Award className="h-6 w-6 stroke-[1.2]" />
            </div>
            <div>
              <p className="text-[9px] font-bold tracking-[0.3em] text-stone-500 uppercase">Rewards Membership</p>
              <h1 className="font-serif text-3xl sm:text-4xl text-charcoal tracking-tight italic mt-0.5">
                {displayTier} Status
              </h1>
            </div>
          </div>

          {/* Points Progress */}
          {nextTier && (
            <div className="space-y-4 pt-4 border-t border-sand/20">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-charcoal">Progress to {nextTierName}</p>
                  <p className="text-xs text-stone-600 font-medium leading-relaxed">
                    Earn <span className="font-semibold text-gold">{pointsToNext.toLocaleString()}</span> points to unlock
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono font-bold text-stone-850">
                    {lifetimePoints.toLocaleString()} / {nextTierThreshold.toLocaleString()} LP
                  </span>
                </div>
              </div>
              <div className="h-[3px] w-full bg-sand/15 overflow-hidden">
                <div
                  className="h-full bg-gold transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {!nextTier && (
            <div className="pt-4 border-t border-sand/20 space-y-2">
              <div className="flex items-center gap-2 text-gold">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold tracking-widest uppercase">Maximum Tier Achieved</span>
              </div>
              <p className="text-xs text-stone-600 font-medium leading-relaxed">
                You are currently at the highest rewards tier. Enjoy your ultimate bespoke concierge benefits.
              </p>
            </div>
          )}
        </div>

        {/* Balance Card */}
        <div className="lg:col-span-5 bg-charcoal text-cream p-6 sm:p-10 space-y-6 shadow-md flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 h-48 w-48 bg-cream/5 rounded-full blur-3xl -mr-20 -mb-20" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[9px] font-bold tracking-[0.3em] text-cream/70 uppercase">Points Balance</p>
              <h2 className="text-5xl sm:text-6xl font-serif tracking-tight mt-1">{currentPoints.toLocaleString()}</h2>
            </div>
            <div className="text-cream/30 group-hover:text-gold transition-colors duration-700">
              <Coins className="h-10 w-10 stroke-[1.0]" />
            </div>
          </div>

          <div className="pt-6 border-t border-cream/10 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold tracking-[0.2em] text-cream/70 uppercase">Est. Redeemable Value</p>
              <p className="text-md font-medium text-gold font-mono mt-0.5">${(currentPoints / 100).toFixed(2)} USD</p>
            </div>
            {loyalty?.tierMultiplier && loyalty.tierMultiplier > 1 && (
              <div className="flex items-center gap-1.5 bg-cream/5 border border-cream/10 px-3 py-1 text-[9px] font-bold tracking-widest uppercase text-gold">
                <TrendingUp className="h-3 w-3" />
                {loyalty.tierMultiplier}x Earn Rate
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tier Benefits */}
      <section className="space-y-6">
        <h2 className="font-serif text-2xl italic text-charcoal tracking-wide">Tier Privileges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(TIER_BENEFITS).map(([key, benefits]) => {
            const isActive = rawTier === key;
            const name = TIER_NAMES[key] || key.replace(/_/g, " ");

            return (
              <div
                key={key}
                className={`p-6 border transition-all duration-500 shadow-sm relative ${
                  isActive
                    ? "bg-ivory border-gold/40 ring-1 ring-gold/15"
                    : "bg-white/40 border-sand/20 hover:border-sand/40"
                }`}
              >
                {isActive && (
                  <div className="absolute top-4 right-4 bg-gold px-2 py-0.5 text-[8px] font-bold tracking-widest text-white uppercase">
                    Active
                  </div>
                )}
                <h3 className="font-serif text-lg italic text-charcoal">{name}</h3>
                <ul className="mt-4 space-y-2.5">
                  {benefits.map((b, idx) => (
                    <li key={idx} className="flex gap-2 items-start text-[10.5px] text-stone-600 font-medium leading-relaxed">
                      <ChevronRight className="h-3.5 w-3.5 text-sand shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transaction History Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl italic text-charcoal tracking-wide flex items-center gap-2">
            <History className="h-5 w-5 stroke-[1.2] text-stone-500" />
            Reward History
          </h2>
          <span className="text-[10px] font-bold tracking-wider uppercase text-stone-500">
            {transactions?.length ?? 0} Transactions
          </span>
        </div>

        {txsLoading ? (
          <div className="flex justify-center py-20 bg-ivory border border-sand/20">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-stone-850 border-r-2" />
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-16 bg-ivory border border-sand/20">
            <p className="text-xs text-stone-600 font-medium">No transaction records found on this account.</p>
          </div>
        ) : (
          <div className="bg-ivory border border-sand/20 shadow-sm overflow-hidden divide-y divide-sand/20">
            {transactions.map((tx) => {
              const isEarn = tx.type === "EARN" || tx.type === "ADJUST" && tx.points > 0;
              const pointsDisplay = `${isEarn ? "+" : "-"}${Math.abs(tx.points).toLocaleString()} pts`;
              const reasonDisplay = tx.reason.replace(/_/g, " ");
              const dateStr = new Date(tx.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={tx.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 gap-4 hover:bg-white/40 transition-colors duration-300">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase ${
                        tx.type === "EARN"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                          : tx.type === "REDEEM"
                          ? "bg-charcoal text-cream border border-charcoal/20"
                          : tx.type === "ADJUST"
                          ? "bg-blue-50 text-blue-800 border border-blue-100"
                          : "bg-stone-50 text-stone-600 border border-stone-100"
                      }`}>
                        {tx.type}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal">{reasonDisplay}</span>
                    </div>
                    {tx.description && <p className="text-xs text-stone-600 font-medium leading-relaxed">{tx.description}</p>}
                    <p className="text-[9px] font-mono text-stone-500">{dateStr}</p>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-sand/10 sm:border-0 pt-2 sm:pt-0">
                    {tx.orderId && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
                        Order Attached
                      </span>
                    )}
                    <span className={`text-md font-serif font-bold ${isEarn ? "text-emerald-700" : "text-stone-850"}`}>
                      {pointsDisplay}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

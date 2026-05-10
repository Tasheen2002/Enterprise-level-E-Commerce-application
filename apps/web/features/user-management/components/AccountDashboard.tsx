"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { imageKitUrl } from "@/lib/imagekit";
const EditProfileForm = dynamic(() => import("./EditProfileForm").then(m => ({ default: m.EditProfileForm })), {
  loading: () => <div className="flex items-center justify-center py-20"><div className="h-6 w-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>,
});
const AvatarUploadForm = dynamic(() => import("./AvatarUploadForm").then(m => ({ default: m.AvatarUploadForm })), {
  loading: () => <div className="flex items-center justify-center py-20"><div className="h-6 w-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>,
});
import { useCurrentIdentity } from "../hooks/useCurrentIdentity";
import { useUserProfile } from "../hooks/useUserProfile";
import {
  Package,
  Heart,
  Coins,
  ChevronRight,
  Star,
  Loader2,
  Settings,
  Camera,
  ArrowLeft,
} from "lucide-react";

export function AccountDashboard() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  // Identity + profile are SSR-prefetched in `app/account/layout.tsx`
  // and rehydrated via HydrationBoundary, so first paint already has
  // data. The route is gated by middleware, so by the time we render
  // we know the user is authenticated.
  const { data: identity, isLoading: identityLoading } = useCurrentIdentity();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  const isLoading = identityLoading || profileLoading;

  // Only show the spinner on the genuine first load. Cached data should
  // render immediately so navigation back to the dashboard doesn't flash.
  if (isLoading && !identity && !profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-gold animate-spin" />
      </div>
    );
  }

  // Combine identity and profile data
  const fallbackAvatarUrl = imageKitUrl("profile.jpg");
  const user = {
    firstName: profile?.firstName || "Guest",
    lastName: profile?.lastName || "Member",
    avatarUrl: profile?.avatarUrl ?? null,
    email: identity?.email || "N/A",
    phone: profile?.phone || "Not provided",
    birthday: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) : "Not provided",
    currency: profile?.currency || "GBP (£)",
    memberSince: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric'
    }) : "Recently",
    tier: "VIP MEMBER",
    activeOrders: 2, // TODO: Fetch from orders API
    wishlistItems: 14, // TODO: Fetch from wishlist API
    rewardPoints: "4,250" // TODO: Fetch from loyalty API
  };

  return (
    <div className="flex-1 p-5 sm:p-8 lg:p-20 space-y-10 sm:space-y-16 bg-cream/40">

      {/* Utility Return Link */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] font-bold text-slate-muted/60 hover:text-gold transition-all duration-500 group"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
          Return to Boutique
        </Link>
      </div>
      {/* Header Profile Section */}
      <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-10 lg:gap-12">
        <div
          className="relative group cursor-pointer"
          onClick={() => setIsAvatarModalOpen(true)}
        >
          <div className="h-32 w-32 sm:h-40 sm:w-40 lg:h-48 lg:w-48 rounded-full overflow-hidden border-4 border-white shadow-xl ring-1 ring-sand/30 relative">
            <Image
              src={user.avatarUrl ?? fallbackAvatarUrl}
              alt={`${user.firstName} ${user.lastName}`}
              width={192}
              height={192}
              sizes="(max-width: 640px) 128px, (max-width: 1024px) 160px, 192px"
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="text-white text-center">
                <Camera className="h-6 w-6 mx-auto mb-1" />
                <span className="text-[10px] font-bold tracking-widest uppercase">Change Photo</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white border border-gold px-4 py-1.5 rounded-sm shadow-md whitespace-nowrap z-20">
            <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-gold">
              <Star className="h-3 w-3 fill-gold" />
              {user.tier}
            </span>
          </div>
        </div>

        <div className="text-center lg:text-left space-y-2 max-w-full">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-7xl text-charcoal tracking-tight italic break-words">
            {user.firstName} {user.lastName}
          </h1>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <p className="text-[10px] tracking-[0.3em] text-slate-muted/60 uppercase font-bold">
              Member since {user.memberSince}
            </p>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase text-gold hover:text-charcoal transition-colors font-bold group"
            >
              <Settings className="h-3 w-3 group-hover:rotate-45 transition-transform" />
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 pt-8">
            <div className="space-y-1 border-b border-sand/20 pb-2">
              <p className="text-[9px] font-bold tracking-[0.3em] text-slate-muted/50 uppercase">Email Address</p>
              <p className="text-sm text-charcoal font-medium">{user.email}</p>
            </div>
            <div className="space-y-1 border-b border-sand/20 pb-2">
              <p className="text-[9px] font-bold tracking-[0.3em] text-slate-muted/50 uppercase">Phone Number</p>
              <p className="text-sm text-charcoal font-medium">{user.phone}</p>
            </div>
            <div className="space-y-1 border-b border-sand/20 pb-2">
              <p className="text-[9px] font-bold tracking-[0.3em] text-slate-muted/50 uppercase">Birthday</p>
              <p className="text-sm text-charcoal font-medium">{user.birthday}</p>
            </div>
            <div className="space-y-1 border-b border-sand/20 pb-2">
              <p className="text-[9px] font-bold tracking-[0.3em] text-slate-muted/50 uppercase">Pref. Currency</p>
              <p className="text-sm text-charcoal font-medium">{user.currency}</p>
            </div>
            <div className="space-y-1 border-b border-sand/20 pb-2">
              <p className="text-[9px] font-bold tracking-[0.3em] text-slate-muted/50 uppercase">Language (Locale)</p>
              <p className="text-sm text-charcoal font-medium">{profile?.locale || "en-GB"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <section className="space-y-8">
        <h2 className="font-serif text-2xl text-charcoal tracking-wide">Recent Activity</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-sand/30 divide-x divide-sand/20 bg-ivory/30 shadow-sm">
          <ActivityCard
            icon={Package}
            label="Active Orders"
            value={user.activeOrders}
            href="/account/orders"
          />
          <ActivityCard
            icon={Heart}
            label="Wishlist Items"
            value={user.wishlistItems}
            href="/account/wishlist"
          />
          <ActivityCard
            icon={Coins}
            label="Reward Points"
            value={user.rewardPoints}
            href="/account/loyalty"
          />
        </div>
      </section>

      {/* Edit Profile Modal — only mount when open so the dynamic chunk
          for EditProfileForm is fetched on first open, not on every page
          render. */}
      {isEditModalOpen && (
        <Modal
          isOpen
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Personal Information"
        >
          <EditProfileForm />
        </Modal>
      )}

      {/* Avatar Update Modal — only mount when open so its dynamic chunk
          and SetupIntent-equivalent (signed upload token) are requested
          lazily. */}
      {isAvatarModalOpen && (
        <Modal
          isOpen
          onClose={() => setIsAvatarModalOpen(false)}
          title="Update Profile Picture"
        >
          <AvatarUploadForm
            currentAvatarUrl={user.avatarUrl}
            fallbackImageUrl={fallbackAvatarUrl}
            onSuccess={() => setIsAvatarModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function ActivityCard({
  icon: Icon,
  label,
  value,
  href
}: {
  icon: React.ComponentType<{ className?: string }>,
  label: string,
  value: string | number,
  href: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col p-6 sm:p-10 transition-all duration-500 hover:bg-white/40"
    >
      <div className="flex justify-between items-start mb-6 sm:mb-10">
        <div className="text-slate-muted/30 group-hover:text-gold transition-colors duration-500">
          <Icon className="h-6 w-6 stroke-[1.2]" />
        </div>
        <ChevronRight className="h-4 w-4 text-sand/40 group-hover:text-gold group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <p className="text-[9px] font-bold tracking-[0.3em] text-slate-muted/50 uppercase">{label}</p>
        <p className="text-4xl sm:text-5xl font-serif text-charcoal group-hover:text-gold transition-colors duration-500">{value}</p>
      </div>
    </Link>
  );
}

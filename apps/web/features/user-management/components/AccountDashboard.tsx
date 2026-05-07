"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { EditProfileForm } from "./EditProfileForm";
import { useCurrentIdentity } from "../hooks/useCurrentIdentity";
import { useUserProfile } from "../hooks/useUserProfile";
import { Button, cn } from "@tasheen/ui";
import { 
  Package, 
  Heart, 
  Coins, 
  ChevronRight,
  Star,
  Loader2,
  Settings,
  Camera,
  ArrowLeft
} from "lucide-react";

export function AccountDashboard() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const { data: identity, isLoading: identityLoading } = useCurrentIdentity();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  const isLoading = identityLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-gold animate-spin" />
      </div>
    );
  }

  // Combine identity and profile data
  const user = {
    firstName: profile?.firstName || "Guest",
    lastName: profile?.lastName || "Member",
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
    <div className="flex-1 p-10 lg:p-20 space-y-16 bg-stone-50/20">
      {/* Utility Return Link */}
      <div className="mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-3 text-[9px] uppercase tracking-[0.4em] font-bold text-stone-400 hover:text-gold transition-all duration-500 group"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
          Return to Boutique
        </Link>
      </div>
      {/* Header Profile Section */}
      <div className="flex flex-col lg:flex-row items-center gap-12">
        <div 
          className="relative group cursor-pointer"
          onClick={() => setIsAvatarModalOpen(true)}
        >
          <div className="h-48 w-48 rounded-full overflow-hidden border-4 border-white shadow-xl ring-1 ring-stone-100 relative">
            <Image
              src="/images/placeholders/profile.jpg"
              alt={`${user.firstName} ${user.lastName}`}
              width={192}
              height={192}
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

        <div className="text-center lg:text-left space-y-2">
          <h1 className="font-serif text-5xl lg:text-7xl text-charcoal tracking-tight italic">
            {user.firstName} {user.lastName}
          </h1>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <p className="text-xs tracking-widest text-stone-400 uppercase">
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
            <div className="space-y-1 border-b border-stone-100 pb-2">
              <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Email Address</p>
              <p className="text-sm text-charcoal">{user.email}</p>
            </div>
            <div className="space-y-1 border-b border-stone-100 pb-2">
              <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Phone Number</p>
              <p className="text-sm text-charcoal">{user.phone}</p>
            </div>
            <div className="space-y-1 border-b border-stone-100 pb-2">
              <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Birthday</p>
              <p className="text-sm text-charcoal">{user.birthday}</p>
            </div>
            <div className="space-y-1 border-b border-stone-100 pb-2">
              <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Pref. Currency</p>
              <p className="text-sm text-charcoal">{user.currency}</p>
            </div>
            <div className="space-y-1 border-b border-stone-100 pb-2">
              <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Language (Locale)</p>
              <p className="text-sm text-charcoal">{profile?.locale || "en-GB"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <section className="space-y-8">
        <h2 className="font-serif text-2xl text-charcoal tracking-wide">Recent Activity</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-stone-100 divide-x divide-stone-100 bg-white shadow-sm">
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

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Personal Information"
      >
        <EditProfileForm />
      </Modal>

      {/* Avatar Update Modal */}
      <Modal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        title="Update Profile Picture"
      >
        <div className="space-y-8 py-4">
          <div className="flex flex-col items-center gap-6">
            <div className="h-40 w-40 rounded-full overflow-hidden border-2 border-stone-100 shadow-inner">
              <Image
                src="/images/placeholders/profile.jpg"
                alt="Current profile"
                width={160}
                height={160}
                className="object-cover"
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-charcoal">Upload a new photograph</p>
              <p className="text-xs text-stone-400">Preferred format: JPG or PNG, max 5MB.</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button variant="primary" fullWidth>
              Choose Image
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setIsAvatarModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ActivityCard({ 
  icon: Icon, 
  label, 
  value, 
  href 
}: { 
  icon: any, 
  label: string, 
  value: string | number, 
  href: string 
}) {
  return (
    <a 
      href={href}
      className="group flex flex-col p-10 transition-all duration-500 hover:bg-stone-50/50"
    >
      <div className="flex justify-between items-start mb-10">
        <div className="text-stone-300 group-hover:text-gold transition-colors duration-500">
          <Icon className="h-6 w-6 stroke-[1.5]" />
        </div>
        <ChevronRight className="h-4 w-4 text-stone-200 group-hover:text-gold group-hover:translate-x-1 transition-all" />
      </div>
      <div className="space-y-2">
        <p className="text-[9px] font-bold tracking-[0.3em] text-stone-400 uppercase">{label}</p>
        <p className="text-5xl font-serif text-charcoal">{value}</p>
      </div>
    </a>
  );
}

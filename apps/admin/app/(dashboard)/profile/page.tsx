"use client";

import React, { useState, useEffect } from "react";
import { Mail, Shield, Save, Globe, Phone, Briefcase, Edit, X } from "lucide-react";
import { api, unwrap } from "../../../lib/api-client";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import { SecuritySection } from "@/components/profile/SecuritySection";
import { AvatarUpload } from "@/components/profile/AvatarUpload";

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  phone: string | null;
  residentOf: string | null;
  nationality: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
}

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lastLogin");
      if (stored) {
        setLastLogin(stored);
      } else {
        const nowStr = new Date().toISOString();
        localStorage.setItem("lastLogin", nowStr);
        setLastLogin(nowStr);
      }
    }
  }, []);

  const formatLastLogin = (isoString: string | null) => {
    if (!isoString) return "Unknown";
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    if (isToday) {
      return `Today, ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      return `${dateStr}, ${timeStr}`;
    }
  };
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    title: "",
    phone: "",
    residentOf: "",
    nationality: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await api.GET("/api/v1/users/me/profile", {});
        if (error) throw error;
        const userData = unwrap(data) as UserProfile;
        setProfile(userData);
        setFormData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          title: userData.title || "",
          phone: userData.phone || "",
          residentOf: userData.residentOf || "",
          nationality: userData.nationality || "",
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        toast.error("Failed to load your profile details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [authUser]);



  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await api.PATCH("/api/v1/users/me/profile", {
        body: {
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          title: formData.title || undefined,
          phone: formData.phone || undefined,
          residentOf: formData.residentOf || undefined,
          nationality: formData.nationality || undefined,
        }
      });
      if (error) throw error;
      
      setProfile(prev => prev ? { 
        ...prev, 
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        title: formData.title || null,
        phone: formData.phone || null,
        residentOf: formData.residentOf || null,
        nationality: formData.nationality || null,
      } : null);

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      toast.error(err?.message || "Failed to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        title: profile.title || "",
        phone: profile.phone || "",
        residentOf: profile.residentOf || "",
        nationality: profile.nationality || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-charcoal/10 border-t-charcoal animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-12 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-serif text-charcoal mb-2">Member Profile</h1>
        <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-[0.3em]">
          Manage your identity within the Tasheen ecosystem
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#EBE6D9] border border-charcoal/5 rounded-2xl p-8 text-center space-y-6 shadow-sm">
            <AvatarUpload profile={profile} setProfile={setProfile} />

            <div className="pt-6 border-t border-charcoal/5 space-y-4">
              <div className="flex items-center gap-3 text-[11px] text-charcoal/60 justify-center">
                <Mail className="w-3.5 h-3.5 opacity-40" strokeWidth={1.5} />
                {profile?.email}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-charcoal/60 justify-center">
                <Shield className="w-3.5 h-3.5 opacity-40" strokeWidth={1.5} />
                Access Level: <span className="font-bold text-burgundy uppercase tracking-widest text-[9px] bg-burgundy/5 border border-burgundy/10 px-2 py-0.5 rounded">
                  {(profile?.role || authUser?.role || "Staff").replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#1c1917] rounded-2xl p-6 text-cream space-y-4 shadow-lg shadow-charcoal/20">
            <h3 className="text-[9px] uppercase tracking-[0.25em] font-bold text-cream/40">Security Status</h3>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-cream/60">Account Status</span>
              <span className="text-sage font-bold uppercase tracking-widest text-[9px]">Active</span>
            </div>
            <div className="h-px bg-cream/10" />
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-cream/60">Last Login</span>
              <span className="text-cream/80 italic">{formatLastLogin(lastLogin)}</span>
            </div>
          </div>
        </div>

         {/* Edit Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleUpdateProfile} className="space-y-8">
            <div className="bg-white border border-charcoal/5 rounded-2xl p-8 shadow-sm space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full border-0 border-b px-0 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none transition-all duration-300 ${isEditing ? "bg-[#F9F8F4] border-charcoal/10 px-3 focus:border-burgundy" : "bg-transparent border-transparent cursor-not-allowed"}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full border-0 border-b px-0 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none transition-all duration-300 ${isEditing ? "bg-[#F9F8F4] border-charcoal/10 px-3 focus:border-burgundy" : "bg-transparent border-transparent cursor-not-allowed"}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Professional Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/20" />
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Lead Curator, Inventory Specialist"
                    disabled={!isEditing}
                    className={`w-full border-0 border-b py-2.5 text-[12px] font-medium text-charcoal focus:outline-none transition-all duration-300 ${isEditing ? "bg-[#F9F8F4] border-charcoal/10 pl-8 pr-3 focus:border-burgundy" : "bg-transparent border-transparent pl-6 cursor-not-allowed"}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/20" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full border-0 border-b py-2.5 text-[12px] font-medium text-charcoal focus:outline-none transition-all duration-300 ${isEditing ? "bg-[#F9F8F4] border-charcoal/10 pl-8 pr-3 focus:border-burgundy" : "bg-transparent border-transparent pl-6 cursor-not-allowed"}`}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Nationality</label>
                  <div className="relative">
                    <Globe className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/20" />
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full border-0 border-b py-2.5 text-[12px] font-medium text-charcoal focus:outline-none transition-all duration-300 ${isEditing ? "bg-[#F9F8F4] border-charcoal/10 pl-8 pr-3 focus:border-burgundy" : "bg-transparent border-transparent pl-6 cursor-not-allowed"}`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Place of Residence</label>
                <input
                  type="text"
                  value={formData.residentOf}
                  onChange={(e) => setFormData({ ...formData, residentOf: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full border-0 border-b px-0 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none transition-all duration-300 ${isEditing ? "bg-[#F9F8F4] border-charcoal/10 px-3 focus:border-burgundy" : "bg-transparent border-transparent cursor-not-allowed"}`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="border border-charcoal/20 text-charcoal px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-charcoal/5 transition-all duration-300 rounded-sm flex items-center gap-2"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-charcoal text-cream px-10 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-burgundy transition-all duration-500 rounded-sm shadow-lg shadow-charcoal/10 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-charcoal text-cream px-10 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-burgundy transition-all duration-500 rounded-sm shadow-lg shadow-charcoal/10 flex items-center gap-2"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <SecuritySection />
    </div>
  );
}

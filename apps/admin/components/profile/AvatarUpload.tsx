"use client";

import React, { useState, useRef } from "react";
import { User, Camera, ZoomIn, X } from "lucide-react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/cropImage";
import { api, unwrap } from "@/lib/api-client";
import { toast } from "sonner";

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

interface AvatarUploadProps {
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

export function AvatarUpload({ profile, setProfile }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setIsCropping(true);
  };

  const uploadAvatar = async (fileToUpload: File) => {
    setIsUploading(true);
    try {
      const { data: tokenData, error: tokenError } = await api.GET("/api/v1/users/me/profile/avatar/upload-token", {});
      if (tokenError) throw tokenError;
      const auth = unwrap(tokenData);

      if (!auth.publicKey || !auth.token || !auth.signature || !auth.folder || !auth.uploadEndpoint) {
        throw new Error("Invalid upload token received from server");
      }

      const form = new FormData();
      form.append("file", fileToUpload);
      form.append("fileName", `avatar-${Date.now()}-cropped.jpg`);
      form.append("publicKey", auth.publicKey);
      form.append("token", auth.token);
      form.append("expire", String(auth.expire));
      form.append("signature", auth.signature);
      form.append("folder", auth.folder);
      form.append("useUniqueFileName", "true");

      const response = await fetch(auth.uploadEndpoint, {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        throw new Error("ImageKit upload failed");
      }

      const uploadResult = await response.json();

      const { error: updateError } = await api.PATCH("/api/v1/users/me/profile", {
        body: { avatarUrl: uploadResult.url }
      });
      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatarUrl: uploadResult.url } : null);
      toast.success("Profile picture updated successfully");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("profile-updated"));
      }

      // Reset
      setPreviewUrl(null);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyCrop = async () => {
    if (!previewUrl || !croppedAreaPixels) return;
    try {
      setIsUploading(true);
      const croppedImage = await getCroppedImg(previewUrl, croppedAreaPixels);
      if (croppedImage) {
        await uploadAvatar(croppedImage);
        setIsCropping(false);
      }
    } catch (e) {
      toast.error("Failed to crop image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {isCropping && previewUrl ? (
        <div className="w-full space-y-4">
          <div className="relative h-64 w-full bg-[#1c1917] rounded-2xl overflow-hidden border border-charcoal/5">
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
              onZoomChange={setZoom}
              restrictPosition={true}
              minZoom={1}
              maxZoom={3}
            />
          </div>

          <div className="flex items-center gap-3 px-1 text-[11px] text-charcoal/50">
            <ZoomIn className="w-3.5 h-3.5" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-charcoal h-1 bg-charcoal/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => {
                setIsCropping(false);
                setPreviewUrl(null);
              }}
              className="flex-1 text-[10px] uppercase tracking-[0.2em] font-bold py-3 border border-charcoal/20 hover:bg-charcoal/5 transition-colors rounded-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyCrop}
              disabled={isUploading}
              className="flex-1 text-[10px] uppercase tracking-[0.2em] font-bold py-3 bg-charcoal text-cream hover:bg-burgundy transition-colors rounded-sm shadow-md shadow-charcoal/10 disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Apply & Crop"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center border-4 border-[#F5F1E8] shadow-inner mx-auto overflow-hidden group">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-charcoal/10" strokeWidth={1} />
              )}
              <div
                className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div>
            <h2 className="text-xl font-serif text-charcoal">
              {profile?.firstName} {profile?.lastName || "Admin User"}
            </h2>
            <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest mt-1">
              {profile?.title || "System Administrator"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

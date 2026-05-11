"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Camera, ShieldCheck, X as XIcon, Crop, Check } from "lucide-react";
import { Button } from "@tasheen/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";
import {
  getAvatarUploadToken,
  uploadToImageKit,
  updateUserProfile,
} from "../api";
import { useUpdateProfile } from "../hooks/useUpdateProfile";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

interface AvatarUploadFormProps {
  currentAvatarUrl: string | null | undefined;
  fallbackImageUrl: string;
  onSuccess: () => void;
}

export function AvatarUploadForm({
  currentAvatarUrl,
  fallbackImageUrl,
  onSuccess,
}: AvatarUploadFormProps) {
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cropper State
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handlePickFile = (next: File | null) => {
    setError(null);
    if (!next) {
      setFile(null);
      setPreviewUrl(null);
      setIsCropping(false);
      setCroppedFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.has(next.type)) {
      setError("Only JPG, PNG, WEBP, or AVIF images are accepted.");
      return;
    }
    if (next.size > MAX_BYTES) {
      setError("File is larger than 5 MB. Please choose a smaller image.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
    setIsCropping(true); // Enter crop mode immediately
    setCroppedFile(null);
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const generateCroppedImage = async () => {
    if (!previewUrl || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(previewUrl, croppedAreaPixels);
      if (croppedImage) {
        setCroppedFile(croppedImage);
        setIsCropping(false);
      }
    } catch (e) {
      setError("Failed to crop image.");
    }
  };

  const upload = useMutation({
    mutationFn: async (selected: File) => {
      const token = await getAvatarUploadToken();
      const result = await uploadToImageKit(selected, token);
      await updateUserProfile({ avatarUrl: result.url });
      return result.url;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Profile photo updated");
      onSuccess();
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to upload photo";
      setError(message);
      toast.error(message);
    },
  });

  const remove = useMutation({
    mutationFn: () => updateUserProfile({ avatarUrl: null }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Profile photo removed");
      onSuccess();
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to remove photo";
      setError(message);
      toast.error(message);
    },
  });

  const isBusy = upload.isPending || remove.isPending || updateProfile.isPending;
  const previewSrc = croppedFile 
    ? URL.createObjectURL(croppedFile) 
    : (previewUrl ?? currentAvatarUrl ?? fallbackImageUrl);

  return (
    <div className="space-y-8 py-4">
      {isCropping && previewUrl ? (
        <div className="space-y-4">
          <div className="relative h-64 sm:h-80 w-full bg-stone-900 rounded-lg overflow-hidden">
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="flex items-center gap-4 px-2">
            <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-gold"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" fullWidth onClick={() => handlePickFile(null)}>Cancel</Button>
            <Button variant="primary" fullWidth onClick={generateCroppedImage}>
              <Crop className="h-4 w-4 mr-2" /> Apply Crop
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-6">
            <div className="relative h-40 w-40 rounded-full overflow-hidden border-2 border-sand/20 shadow-inner bg-stone-100">
              {croppedFile || previewUrl ? (
                <img
                  src={previewSrc}
                  alt="Selected avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={previewSrc}
                  alt="Current profile"
                  width={160}
                  height={160}
                  sizes="160px"
                  className="object-cover h-full w-full"
                />
              )}
              {file && (
                <button
                  type="button"
                  onClick={() => handlePickFile(null)}
                  className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-charcoal hover:bg-white transition-colors"
                  aria-label="Discard selection"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-charcoal">
                {croppedFile
                  ? "Ready to upload"
                  : currentAvatarUrl
                    ? "Replace your current photo"
                    : "Upload a new photograph"}
              </p>
              <p className="text-xs text-stone-400">
                JPG, PNG, WEBP or AVIF, max 5MB.
              </p>
            </div>

            <div className="flex items-start gap-3 w-full p-4 bg-stone-50 border border-stone-100 rounded-sm">
              <ShieldCheck className="h-4 w-4 text-gold mt-0.5 shrink-0" />
              <p className="text-[11px] text-stone-500 leading-relaxed">
                The image is uploaded directly to our image CDN over an
                encrypted, short-lived signed URL — your file never passes
                through the boutique server.
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />

          {error && (
            <p className="text-[11px] text-burgundy text-center" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            {!croppedFile ? (
              <Button
                variant="primary"
                fullWidth
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
              >
                <Camera className="h-4 w-4 mr-2" />
                {currentAvatarUrl ? "Change Image" : "Choose Image"}
              </Button>
            ) : (
              <Button
                variant="primary"
                fullWidth
                onClick={() => upload.mutate(croppedFile)}
                disabled={isBusy}
                isLoading={upload.isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
            )}

            {currentAvatarUrl && !file && (
              <Button
                variant="ghost"
                fullWidth
                onClick={() => remove.mutate()}
                disabled={isBusy}
                isLoading={remove.isPending}
              >
                Remove Current Photo
              </Button>
            )}

            <Button
              variant="ghost"
              fullWidth
              onClick={onSuccess}
              disabled={isBusy}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

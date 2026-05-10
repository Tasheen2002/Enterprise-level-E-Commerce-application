"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, ShieldCheck, X as XIcon } from "lucide-react";
import { Button } from "@tasheen/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

/**
 * Avatar upload modal contents. Three-stage flow:
 *   1. user picks file (or drops it)  → local preview only, nothing sent
 *   2. user clicks "Upload"           → request signed token,
 *                                       POST to ImageKit directly,
 *                                       PATCH /users/me/profile with URL
 *   3. success                        → invalidate profile query so the
 *                                       dashboard reflects the new image
 */
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

  // Object URLs need to be revoked so the browser doesn't leak the blob.
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
  };

  const upload = useMutation({
    mutationFn: async (selected: File) => {
      const token = await getAvatarUploadToken();
      const result = await uploadToImageKit(selected, token);
      // Persist the URL onto the profile via the existing PATCH endpoint.
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
  const previewSrc = previewUrl ?? currentAvatarUrl ?? fallbackImageUrl;

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-40 w-40 rounded-full overflow-hidden border-2 border-sand/20 shadow-inner bg-stone-100">
          {previewUrl ? (
            // Local blob preview — bypass next/image (it can't optimise blob: URLs).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
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
            {file
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
        {!file ? (
          <Button
            variant="primary"
            fullWidth
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
          >
            <Camera className="h-4 w-4 mr-2" />
            Choose Image
          </Button>
        ) : (
          <Button
            variant="primary"
            fullWidth
            onClick={() => upload.mutate(file)}
            disabled={isBusy}
            isLoading={upload.isPending}
          >
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
    </div>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button, Input, FormField } from "@tasheen/ui";
import { useWishlists } from "../hooks/useWishlists";
import { toast } from "sonner";
import { Wishlist } from "../types";

const wishlistFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean(),
});

type WishlistFormValues = z.infer<typeof wishlistFormSchema>;

interface CreateWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Wishlist | null;
  onSuccess?: () => void;
}

export function CreateWishlistModal({ isOpen, onClose, initialData, onSuccess }: CreateWishlistModalProps) {
  const { createWishlist, updateWishlist } = useWishlists();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WishlistFormValues>({
    resolver: zodResolver(wishlistFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || "",
          isPublic: initialData.isPublic,
        }
      : {
          name: "",
          description: "",
          isPublic: false,
        },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (initialData) {
        await updateWishlist.mutateAsync({ id: initialData.id, input: data });
        toast.success("Collection updated successfully");
      } else {
        await createWishlist.mutateAsync(data);
        toast.success("Custom collection created successfully");
      }
      reset();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save collection");
    }
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title={initialData ? "Edit Custom Collection" : "Create Custom Collection"}
      className="max-w-md bg-[#FAF9F6] border border-sand/20"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <FormField
          id="name"
          label="Collection Name"
          error={errors.name?.message}
          className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400"
        >
          <Input
            id="name"
            variant="boxed"
            placeholder="e.g. Summer Sandal Curation"
            hasError={Boolean(errors.name)}
            className="bg-white border-sand/30 focus:border-gold"
            {...register("name")}
          />
        </FormField>

        <FormField
          id="description"
          label="Description (Optional)"
          error={errors.description?.message}
          className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400"
        >
          <textarea
            id="description"
            rows={3}
            placeholder="Describe your collection..."
            className="w-full bg-white border border-sand/30 focus:border-gold px-4 py-3 text-stone-800 text-sm focus:outline-none transition-colors duration-300 resize-none"
            {...register("description")}
          />
        </FormField>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="isPublic"
            className="h-4 w-4 rounded border-stone-300 text-charcoal focus:ring-gold"
            {...register("isPublic")}
          />
          <label htmlFor="isPublic" className="text-sm text-stone-600 font-medium cursor-pointer">
            Make this collection public (shareable)
          </label>
        </div>

        <div className="pt-6 border-t border-sand/10 flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            className="px-6 py-3 uppercase tracking-widest text-[9px] font-bold rounded-none"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="px-6 py-3 uppercase tracking-widest text-[9px] font-bold rounded-none bg-charcoal text-cream hover:bg-stone-800"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {initialData ? "Verify Changes" : "Create List"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Button, 
  PasswordInput, 
  FormField 
} from "@tasheen/ui";
import { useChangePassword } from "../hooks/useChangePassword";
import { Check, AlertCircle, Loader2 } from "lucide-react";

// Matches the design and the backend schema
const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Entries do not match. Please verify your input.",
  path: ["confirmPassword"],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export function ChangePasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const changePassword = useChangePassword();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      reset();
      onSuccess();
    } catch (err: any) {
      setServerError(err.message || "Failed to update security credentials.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6 pt-4 pb-2">
      <div className="text-center space-y-3 mb-10 pb-8 border-b border-stone-50">
        <p className="text-[9px] text-gold uppercase tracking-[0.4em] font-bold">
          Security Protocol
        </p>
        <p className="font-serif text-3xl text-charcoal italic leading-tight">
          Authorize Credential Change
        </p>
      </div>

      <div className="space-y-8">
        <FormField 
          id="currentPassword" 
          label="Verify Identity (Current)" 
          error={errors.currentPassword?.message}
          className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400"
        >
          <input 
            id="currentPassword" 
            type="password"
            placeholder="••••••••" 
            className="w-full bg-stone-50 border border-stone-100 px-6 py-5 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none"
            {...register("currentPassword")} 
          />
        </FormField>

        <FormField 
          id="newPassword" 
          label="New Security Key" 
          error={errors.newPassword?.message}
          className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400"
        >
          <input 
            id="newPassword" 
            type="password"
            placeholder="Enter new credential" 
            className="w-full bg-stone-50 border border-stone-100 px-6 py-5 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none"
            {...register("newPassword")} 
          />
        </FormField>

        <FormField 
          id="confirmPassword" 
          label="Confirm Security Key" 
          error={errors.confirmPassword?.message}
          className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400"
        >
          <input 
            id="confirmPassword" 
            type="password"
            placeholder="Re-enter for confirmation" 
            className="w-full bg-stone-50 border border-stone-100 px-6 py-5 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none"
            {...register("confirmPassword")} 
          />
        </FormField>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 p-4 bg-burgundy/5 text-burgundy text-xs rounded animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          {serverError}
        </div>
      )}

      <div className="pt-8">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          className="h-16 uppercase tracking-[0.4em] text-[10px] font-bold rounded-none shadow-md hover:tracking-[0.5em] transition-all duration-700"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          Verify Security Update
        </Button>
      </div>
    </form>
  );
}

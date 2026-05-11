"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, PasswordInput, FormField } from "@tasheen/ui";
import { AlertCircle, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { useDisable2FA } from "../hooks/useDisable2FA";

const disableFormSchema = z.object({
  password: z.string().min(1, "Password is required to disable 2FA"),
});

type DisableFormValues = z.infer<typeof disableFormSchema>;

/**
 * Password-gated tear-down. Wipes the TOTP secret AND deletes all
 * backup codes server-side, so re-enabling later issues a fresh
 * secret + a fresh batch of codes.
 */
export function Disable2FAForm({ onSuccess }: { onSuccess: () => void }) {
  const disableMutation = useDisable2FA();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DisableFormValues>({
    resolver: zodResolver(disableFormSchema),
  });

  const onSubmit = handleSubmit(async ({ password }) => {
    setServerError(null);
    try {
      await disableMutation.mutateAsync(password);
      toast.success("Two-factor authentication disabled.");
      reset();
      onSuccess();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to disable 2FA.";
      setServerError(message);
      toast.error(message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6 pt-4 pb-2">
      <div className="text-center space-y-3 mb-10 pb-8 border-b border-stone-50">
        <ShieldOff className="h-10 w-10 text-burgundy mx-auto" />
        <p className="text-[9px] text-burgundy uppercase tracking-[0.4em] font-bold">
          Reduce Account Security
        </p>
        <p className="font-serif text-3xl text-charcoal italic leading-tight">
          Disable Two-Factor
        </p>
        <p className="text-[11px] text-stone-400 leading-relaxed max-w-md mx-auto">
          Confirm your password to remove the second factor. Your existing
          backup codes will be deleted.
        </p>
      </div>

      <FormField
        id="password"
        label="Confirm Password"
        error={errors.password?.message}
        className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400"
      >
        <PasswordInput
          id="password"
          variant="boxed"
          placeholder="••••••••"
          hasError={Boolean(errors.password)}
          {...register("password")}
        />
      </FormField>

      {serverError && (
        <div className="flex items-center gap-2 p-4 bg-burgundy/5 text-burgundy text-xs">
          <AlertCircle className="h-4 w-4" />
          {serverError}
        </div>
      )}

      <div className="pt-6">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          className="h-14 sm:h-16 uppercase tracking-[0.25em] sm:tracking-[0.4em] text-[10px] font-bold rounded-none shadow-md"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          Disable 2FA
        </Button>
      </div>
    </form>
  );
}

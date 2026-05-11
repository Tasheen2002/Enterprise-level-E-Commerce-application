"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, PasswordInput, FormField } from "@tasheen/ui";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useRegenerateBackupCodes } from "../hooks/useRegenerateBackupCodes";
import { BackupCodesView } from "./Setup2FAForm";

const formSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Two-step: collect password → show fresh codes. Same display as the
 * enrolment flow's final step (`BackupCodesView`) so the user gets
 * the same "save these now" treatment.
 */
export function RegenerateBackupCodesForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const regenerate = useRegenerateBackupCodes();
  const [codes, setCodes] = useState<string[] | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = handleSubmit(async ({ password }) => {
    setServerError(null);
    try {
      const result = await regenerate.mutateAsync(password);
      setCodes(result.backupCodes);
      reset();
      toast.success("New backup codes issued.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to regenerate backup codes.";
      setServerError(message);
      toast.error(message);
    }
  });

  if (codes) {
    return (
      <BackupCodesView
        codes={codes}
        onDone={() => {
          setCodes(null);
          onSuccess();
        }}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 pt-4 pb-2">
      <div className="text-center space-y-3 mb-10 pb-8 border-b border-stone-50">
        <RefreshCcw className="h-10 w-10 text-gold mx-auto" />
        <p className="text-[9px] text-gold uppercase tracking-[0.4em] font-bold">
          Refresh Recovery Codes
        </p>
        <p className="font-serif text-3xl text-charcoal italic leading-tight">
          Regenerate Backup Codes
        </p>
        <p className="text-[11px] text-stone-400 leading-relaxed max-w-md mx-auto">
          Your existing backup codes will be invalidated immediately. Make
          sure you save the new ones before closing this dialog.
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
          Generate New Codes
        </Button>
      </div>
    </form>
  );
}

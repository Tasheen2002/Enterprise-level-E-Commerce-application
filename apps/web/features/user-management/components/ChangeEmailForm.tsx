"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  PasswordInput,
  FormField
} from "@tasheen/ui";
import { useChangeEmail } from "../hooks/useChangeEmail";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

const changeEmailFormSchema = z.object({
  newEmail: z.string().email("Please provide a valid correspondence email"),
  password: z.string().min(1, "Current security key is required to authorize this change"),
});

type ChangeEmailFormValues = z.infer<typeof changeEmailFormSchema>;

export function ChangeEmailForm({ onSuccess }: { onSuccess: () => void }) {
  const changeEmail = useChangeEmail();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailFormSchema),
  });

  const onSubmit = handleSubmit(
    async (data) => {
      setServerError(null);
      try {
        await changeEmail.mutateAsync({
          newEmail: data.newEmail,
          password: data.password
        });
        toast.success("Correspondence migration initiated. Please check your inbox.");
        reset();
        onSuccess();
      } catch (err: any) {
        setServerError(err.message || "Failed to initiate email change.");
        toast.error(err.message || "Credential migration failed.");
      }
    },
    (errors) => {
      if (errors.newEmail) {
        toast.error("Please provide a valid correspondence email.");
      } else {
        toast.error("Please verify all security fields.");
      }
    }
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6 pt-4 pb-2">
      <div className="text-center space-y-3 mb-10 pb-8 border-b border-stone-50">
        <p className="text-[9px] text-gold uppercase tracking-[0.4em] font-bold">
          Credential Migration
        </p>
        <p className="font-serif text-3xl text-charcoal italic leading-tight">
          Update Correspondence
        </p>
      </div>

      <div className="space-y-8">
        <FormField
          id="newEmail"
          label="New Correspondence / Email"
          error={errors.newEmail?.message}
          className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400"
        >
          <Input
            id="newEmail"
            type="email"
            variant="boxed"
            placeholder="member@slipperze.com"
            hasError={Boolean(errors.newEmail)}
            {...register("newEmail")}
          />
        </FormField>

        <FormField
          id="password"
          label="Verify Identity (Password)"
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
          className="h-14 sm:h-16 uppercase tracking-[0.25em] sm:tracking-[0.4em] text-[10px] font-bold rounded-none shadow-md hover:tracking-[0.3em] sm:hover:tracking-[0.5em] transition-all duration-700"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          Verify Credential Migration
        </Button>
      </div>

      <p className="text-[9px] text-stone-400 text-center uppercase tracking-[0.2em] leading-relaxed mt-6 italic">
        A secure verification link will be issued to finalize this migration.
      </p>
    </form>
  );
}

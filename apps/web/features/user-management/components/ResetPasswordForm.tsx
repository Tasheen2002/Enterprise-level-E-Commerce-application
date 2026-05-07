"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordRequestSchema,
  type ResetPasswordRequest,
} from "@tasheen/validation/auth";
import {
  Button,
  PasswordInput,
  FormField,
  PasswordStrengthMeter,
} from "@tasheen/ui";
import { useResetPassword } from "../hooks/useResetPassword";
import { KeyRound, ShieldCheck, ArrowRight } from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetPassword = useResetPassword();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = searchParams.get("token") || "";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordRequest>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: {
      token,
      newPassword: "",
    },
  });

  const passwordValue = watch("newPassword");

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      setServerError("Invalid or missing reset token.");
      return;
    }

    setServerError(null);
    try {
      await resetPassword.mutateAsync(values);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/sign-in");
      }, 3000);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Reset failed");
    }
  });

  if (!token && !isSuccess) {
    return (
      <div className="text-center space-y-6">
        <div className="p-4 bg-burgundy/5 rounded-full inline-block">
          <KeyRound className="h-8 w-8 text-burgundy" />
        </div>
        <h1 className="font-serif text-3xl text-charcoal">Invalid Link</h1>
        <p className="text-sm text-slate-muted max-w-xs mx-auto">
          The password reset link is missing or has expired. Please request a new one.
        </p>
        <Link href="/forgot-password">
          <Button variant="ghost" size="md" className="mt-4">
            Request new link
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col items-center text-center space-y-8">
        <div className="p-4 bg-stone-50 rounded-full border border-stone-100">
          <ShieldCheck className="h-6 w-6 text-stone-400" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl text-charcoal">Create new password</h1>
          <p className="text-sm text-slate-muted max-w-[280px] mx-auto">
            Your security is our priority. Choose a strong, unique password for your account.
          </p>
        </div>

        {isSuccess ? (
          <div className="w-full animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex gap-4 p-5 bg-stone-50 border border-stone-100 rounded-lg text-left">
              <div className="pt-1 text-gold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-charcoal">Password updated</p>
                <p className="text-[11px] leading-relaxed text-slate-muted">
                  Your password has been reset successfully. Redirecting you to the sign-in page...
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="w-full space-y-8 pt-4">
            <div className="space-y-4">
              <FormField
                id="newPassword"
                label="NEW PASSWORD"
                error={errors.newPassword?.message}
              >
                <PasswordInput
                  id="newPassword"
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  className="border-b border-stone-300 focus:border-charcoal transition-colors px-0 rounded-none bg-transparent"
                  hasError={Boolean(errors.newPassword)}
                  {...register("newPassword")}
                />
              </FormField>
              <PasswordStrengthMeter password={passwordValue ?? ""} />
            </div>

            {serverError && (
              <p className="text-[11px] text-burgundy text-left" role="alert">
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting || resetPassword.isPending}
              className="flex items-center justify-center gap-2 group"
            >
              <span>Update password</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

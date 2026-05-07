"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordRequestSchema,
  type ForgotPasswordRequest,
} from "@tasheen/validation/auth";
import { Button, Input, FormField } from "@tasheen/ui";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { Mail, ArrowRight, RotateCcw } from "lucide-react";

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await forgotPassword.mutateAsync(values);
      setIsSuccess(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Request failed");
    }
  });

  return (
    <div className="w-full">
      <div className="flex flex-col items-center text-center space-y-8">
        <div className="p-4 bg-stone-50 rounded-full border border-stone-100">
          <RotateCcw className="h-6 w-6 text-stone-400" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl text-charcoal">Reset your password</h1>
          <p className="text-sm text-slate-muted max-w-[280px] mx-auto">
            Enter the email associated with your account and we will send you instructions to reset your password.
          </p>
        </div>

        {isSuccess ? (
          <div className="w-full animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex gap-4 p-5 bg-burgundy/5 border border-burgundy/10 rounded-lg text-left">
              <div className="pt-1">
                <Mail className="h-5 w-5 text-burgundy" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-burgundy">Link sent successfully</p>
                <p className="text-[11px] leading-relaxed text-burgundy/80">
                  Please check your inbox. If you don't see the email within a few minutes, be sure to check your spam folder.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="w-full space-y-8 pt-4">
            <FormField
              id="email"
              label="EMAIL ADDRESS"
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                autoComplete="email"
                className="border-b border-stone-300 focus:border-charcoal transition-colors px-0 rounded-none bg-transparent"
                hasError={Boolean(errors.email)}
                {...register("email")}
              />
            </FormField>

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
              isLoading={isSubmitting || forgotPassword.isPending}
              className="flex items-center justify-center gap-2 group"
            >
              <span>Send reset link</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        )}

        <div className="pt-4">
          <Link
            href="/sign-in"
            className="text-[10px] tracking-[0.2em] font-bold text-stone-500 hover:text-charcoal transition-colors uppercase border-b border-transparent hover:border-charcoal pb-1"
          >
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
}

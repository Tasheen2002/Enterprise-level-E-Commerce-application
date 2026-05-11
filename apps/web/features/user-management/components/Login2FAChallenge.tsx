"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, FormField } from "@tasheen/ui";
import { AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useVerify2FALogin } from "../hooks/useVerify2FALogin";

const challengeSchema = z.object({
  // 6-digit TOTP, OR a XXXX-XXXX backup code (case + dashes
  // tolerant — backend normalises). Wide pattern, server is the
  // authoritative validator.
  code: z
    .string()
    .min(6, "Enter a 6-digit code or a backup code")
    .max(20),
});

type ChallengeValues = z.infer<typeof challengeSchema>;

/**
 * Step 2 of email/password + 2FA login. The pending token comes from
 * the step 1 response; this component never reads it from URL params
 * (which would leak it to the browser history) — `SignInForm` holds
 * it in component state.
 *
 * `onCancel` switches back to the credentials step. `onSuccess` is
 * called once `verify2FALogin` has persisted real session tokens —
 * the parent then handles the post-login redirect.
 */
export function Login2FAChallenge({
  pendingToken,
  onSuccess,
  onCancel,
}: {
  pendingToken: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const verify = useVerify2FALogin();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChallengeValues>({
    resolver: zodResolver(challengeSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = handleSubmit(async ({ code }) => {
    setServerError(null);
    try {
      await verify.mutateAsync({ pendingToken, code });
      toast.success("Welcome back to Slipperze");
      onSuccess();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "That code didn't match. Try again or use a backup code.";
      setServerError(message);
      toast.error(message);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <header className="space-y-4 text-center pb-8 border-b border-sand/30">
        <ShieldCheck className="h-10 w-10 text-gold mx-auto" />
        <h1 className="font-serif text-4xl text-charcoal italic tracking-tight">
          Two-Factor Verification
        </h1>
        <p className="text-[10px] tracking-[0.4em] uppercase text-slate-muted/70 font-bold">
          Enter the code from your authenticator app — or a backup code if
          you've lost access.
        </p>
      </header>

      <FormField
        id="code"
        label="6-digit code or backup code"
        error={errors.code?.message}
        className="uppercase tracking-[0.2em] text-[9px] font-bold text-stone-400"
      >
        <Input
          id="code"
          type="text"
          inputMode="text"
          autoComplete="one-time-code"
          variant="boxed"
          placeholder="123456 or XXXX-XXXX"
          hasError={Boolean(errors.code)}
          {...register("code")}
        />
      </FormField>

      {serverError && (
        <div className="flex items-center gap-2 p-4 bg-burgundy/5 text-burgundy text-xs">
          <AlertCircle className="h-4 w-4" />
          {serverError}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        className="h-16 uppercase tracking-[0.4em] text-[10px] font-bold rounded-none"
        fullWidth
        isLoading={isSubmitting || verify.isPending}
      >
        Verify and Continue
      </Button>

      <button
        type="button"
        onClick={onCancel}
        className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 hover:text-charcoal transition-colors py-2"
      >
        <ArrowLeft className="h-3 w-3" />
        Use a different account
      </button>
    </form>
  );
}

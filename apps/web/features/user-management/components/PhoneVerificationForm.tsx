"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, FormField } from "@tasheen/ui";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  setupRecaptcha,
  sendPhoneCode,
  verifyPhoneCode as confirmFirebaseOtp,
} from "@/lib/firebase";
import { useVerifyPhone } from "../hooks/useVerifyPhone";

/**
 * Phone numbers are accepted only in E.164 format (`+` followed by 1–15
 * digits). Firebase rejects anything else, so we mirror that on the
 * client to give the user a clearer error than "auth/invalid-phone-
 * number".
 */
const phoneFormSchema = z.object({
  phone: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Use international format, e.g. +94771234567",
    ),
});

const codeFormSchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your SMS"),
});

type PhoneFormValues = z.infer<typeof phoneFormSchema>;
type CodeFormValues = z.infer<typeof codeFormSchema>;

type Step = "phone" | "code" | "done";

const RECAPTCHA_CONTAINER_ID = "phone-verification-recaptcha";

/**
 * Two-step phone verification.
 *
 * Step 1 — phone: collect E.164 number, trigger
 *   `signInWithPhoneNumber` (which internally solves reCAPTCHA and
 *   sends an SMS via Firebase). The returned `confirmationResult` is
 *   held in a ref so the next step can reuse it.
 *
 * Step 2 — code: collect the 6-digit OTP, call `confirmationResult
 *   .confirm()` which resolves to a Firebase `User`, take a fresh
 *   `idToken` off it, and POST it to our backend's `/auth/verify-phone`
 *   endpoint. The backend extracts the `phone_number` claim from the
 *   verified token — we never trust a phone number sent over the wire
 *   independently.
 *
 * Test numbers (Firebase Console → Auth → Phone → "Phone numbers for
 * testing") skip real SMS delivery: any 6-digit code wired in the
 * console works. Use them in dev so you don't burn the SMS quota.
 */
export function PhoneVerificationForm({
  onSuccess,
}: {
  onSuccess: (verifiedNumber: string) => void;
}) {
  const verifyPhone = useVerifyPhone();
  const [step, setStep] = useState<Step>("phone");
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  // Bumping this remounts the reCAPTCHA <div> so a fresh verifier
  // can attach without "reCAPTCHA has already been rendered". Plain
  // `verifier.clear()` doesn't always wipe the iframe Firebase
  // injects into the container.
  const [recaptchaKey, setRecaptchaKey] = useState(0);
  const confirmationRef = useRef<unknown>(null);
  const recaptchaRef = useRef<{ clear?: () => void } | null>(null);

  // Tear down the reCAPTCHA verifier when the form unmounts so a
  // re-open mounts a fresh one. Without this, Firebase complains about
  // a duplicate widget and refuses to send another SMS.
  useEffect(() => {
    return () => {
      try {
        recaptchaRef.current?.clear?.();
      } catch {
        // Verifier may already be torn down; nothing to do.
      }
      recaptchaRef.current = null;
      confirmationRef.current = null;
    };
  }, []);

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: { phone: "" },
  });

  const codeForm = useForm<CodeFormValues>({
    resolver: zodResolver(codeFormSchema),
    defaultValues: { code: "" },
  });

  const resetRecaptcha = () => {
    try {
      recaptchaRef.current?.clear?.();
    } catch {
      // verifier may already be torn down; nothing to do
    }
    recaptchaRef.current = null;
    // Force the <div> to unmount/remount so the next setupRecaptcha
    // attaches to a virgin container — `.clear()` alone leaves
    // residual iframes/script tags that trip "already rendered".
    setRecaptchaKey((k) => k + 1);
  };

  const handleSendCode = phoneForm.handleSubmit(async ({ phone }) => {
    setServerError(null);
    try {
      // Always create a fresh verifier per send attempt. Reusing one
      // across attempts is fragile because Firebase's invisible widget
      // can be in a half-torn-down state from the previous run.
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear?.();
        } catch {
          // ignore
        }
        recaptchaRef.current = null;
      }
      // Wipe any leftover DOM Firebase injected into the container —
      // `.clear()` is unreliable here and the SDK refuses to mount
      // twice into the same parent.
      const container = document.getElementById(RECAPTCHA_CONTAINER_ID);
      if (container) container.innerHTML = "";

      recaptchaRef.current = (await setupRecaptcha(
        RECAPTCHA_CONTAINER_ID,
      )) as { clear?: () => void };

      confirmationRef.current = await sendPhoneCode(
        phone,
        recaptchaRef.current,
      );
      setVerifiedPhone(phone);
      setStep("code");
      toast.success("Verification code sent.");
    } catch (err) {
      const message = mapFirebaseError(err);
      setServerError(message);
      toast.error(message);
      resetRecaptcha();
    }
  });

  const handleConfirmCode = codeForm.handleSubmit(async ({ code }) => {
    setServerError(null);
    if (!confirmationRef.current) {
      setServerError("Verification session expired — request a new code.");
      setStep("phone");
      return;
    }

    try {
      const idToken = await confirmFirebaseOtp(
        confirmationRef.current,
        code,
      );
      const result = await verifyPhone.mutateAsync(idToken);
      setVerifiedPhone(result.phoneNumber);
      setStep("done");
      toast.success("Phone number verified.");
      onSuccess(result.phoneNumber);
    } catch (err) {
      const message = mapFirebaseError(err);
      setServerError(message);
      toast.error(message);
    }
  });

  const handleResetToPhoneStep = () => {
    setServerError(null);
    codeForm.reset();
    setStep("phone");
  };

  if (step === "done") {
    return (
      <div className="space-y-6 pt-4 pb-2 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
        <p className="font-serif text-3xl text-charcoal italic leading-tight">
          Phone Verified
        </p>
        <p className="text-sm text-stone-400">
          {verifiedPhone}
        </p>
      </div>
    );
  }

  if (step === "code") {
    return (
      <form onSubmit={handleConfirmCode} className="space-y-6 pt-4 pb-2">
        <div className="text-center space-y-3 mb-10 pb-8 border-b border-stone-50">
          <p className="text-[9px] text-gold uppercase tracking-[0.4em] font-bold">
            Confirmation Step
          </p>
          <p className="font-serif text-3xl text-charcoal italic leading-tight">
            Enter Your Code
          </p>
          <p className="text-xs text-stone-400">
            Sent to {verifiedPhone}
          </p>
        </div>

        <FormField
          id="code"
          label="6-digit verification code"
          error={codeForm.formState.errors.code?.message}
          className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400"
        >
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            variant="boxed"
            placeholder="123456"
            hasError={Boolean(codeForm.formState.errors.code)}
            {...codeForm.register("code")}
          />
        </FormField>

        {serverError && (
          <div className="flex items-center gap-2 p-4 bg-burgundy/5 text-burgundy text-xs rounded animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            {serverError}
          </div>
        )}

        <div className="pt-8 space-y-3">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            className="h-14 sm:h-16 uppercase tracking-[0.25em] sm:tracking-[0.4em] text-[10px] font-bold rounded-none shadow-md hover:tracking-[0.3em] sm:hover:tracking-[0.5em] transition-all duration-700"
            disabled={codeForm.formState.isSubmitting || verifyPhone.isPending}
            isLoading={
              codeForm.formState.isSubmitting || verifyPhone.isPending
            }
          >
            Verify Code
          </Button>
          <button
            type="button"
            onClick={handleResetToPhoneStep}
            className="w-full text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 hover:text-charcoal transition-colors flex items-center justify-center gap-2 py-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Use a different number
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="space-y-6 pt-4 pb-2">
      <div className="text-center space-y-3 mb-10 pb-8 border-b border-stone-50">
        <p className="text-[9px] text-gold uppercase tracking-[0.4em] font-bold">
          Identity Verification
        </p>
        <p className="font-serif text-3xl text-charcoal italic leading-tight">
          Verify Your Phone
        </p>
      </div>

      <FormField
        id="phone"
        label="Mobile number (international format)"
        error={phoneForm.formState.errors.phone?.message}
        className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400"
      >
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          variant="boxed"
          placeholder="+94771234567"
          hasError={Boolean(phoneForm.formState.errors.phone)}
          {...phoneForm.register("phone")}
        />
      </FormField>

      {serverError && (
        <div className="flex items-center gap-2 p-4 bg-burgundy/5 text-burgundy text-xs rounded animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          {serverError}
        </div>
      )}

      {/* Firebase mounts the invisible reCAPTCHA into this node when
          `setupRecaptcha` runs. It must be in the DOM at that moment;
          a `display: none` parent breaks the widget, so we keep it
          rendered but visually empty. The `key` forces a remount on
          every reset, which is the only reliable way to clear the
          "already rendered in this element" state Firebase gets
          stuck in after a failed send. */}
      <div key={recaptchaKey} id={RECAPTCHA_CONTAINER_ID} aria-hidden />

      <div className="pt-8">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          className="h-14 sm:h-16 uppercase tracking-[0.25em] sm:tracking-[0.4em] text-[10px] font-bold rounded-none shadow-md hover:tracking-[0.3em] sm:hover:tracking-[0.5em] transition-all duration-700"
          disabled={phoneForm.formState.isSubmitting}
          isLoading={phoneForm.formState.isSubmitting}
        >
          Send Verification Code
        </Button>
      </div>

      <p className="text-[9px] text-stone-400 text-center uppercase tracking-[0.2em] leading-relaxed mt-6 italic">
        Standard SMS rates may apply.
      </p>
    </form>
  );
}

/**
 * Translate Firebase Auth error codes (and our own ApiCallError shape)
 * into something a member can act on. Anything we don't recognise
 * falls back to the raw message.
 */
function mapFirebaseError(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const code = (err as { code?: unknown }).code;
    if (typeof code === "string") {
      switch (code) {
        case "auth/invalid-phone-number":
          return "That phone number isn't valid. Use international format like +94771234567.";
        case "auth/missing-phone-number":
          return "Please enter a phone number.";
        case "auth/quota-exceeded":
          return "We've sent too many codes recently. Try again in a few minutes.";
        case "auth/too-many-requests":
          return "Too many attempts. Wait a moment before trying again.";
        case "auth/invalid-verification-code":
          return "That code didn't match. Double-check the digits or request a new code.";
        case "auth/code-expired":
          return "This code has expired — request a new one.";
        case "auth/captcha-check-failed":
          return "Anti-bot check failed. Refresh the page and try again.";
        case "auth/network-request-failed":
          return "Network problem. Check your connection and retry.";
      }
    }
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return "Phone verification failed. Please try again.";
}

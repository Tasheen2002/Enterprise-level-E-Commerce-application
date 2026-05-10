"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  signUpFormSchema,
  type SignUpFormValues,
} from "@tasheen/validation/auth";
import {
  Button,
  Input,
  PasswordInput,
  Checkbox,
  FormField,
} from "@tasheen/ui";
import { useRegister } from "../hooks/useRegister";
import { PasswordStrengthWatcher } from "./PasswordStrengthWatcher";
import { toast } from "sonner";
const TERMS_HREF = "/legal/terms";
const PRIVACY_HREF = "/legal/privacy";

export function SignUpForm() {
  const router = useRouter();
  const register = useRegister();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register: registerField,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const FIELD_LABELS: Record<string, string> = {
    firstName: "Given Name",
    lastName: "Surname",
    email: "Correspondence Email",
    password: "Security Key",
    confirmPassword: "Verify Security Key",
    agreeToTerms: "Terms agreement",
  };

  useEffect(() => {
    if (submitCount === 0) return;
    const errorEntries = Object.entries(errors);
    if (errorEntries.length === 0) return;

    if (errorEntries.length === 1) {
      const [field, error] = errorEntries[0]!;
      const message =
        (error as { message?: string } | undefined)?.message ||
        `${FIELD_LABELS[field] ?? field} is required`;
      toast.error(message);
      return;
    }

    const missing = errorEntries
      .map(([field]) => FIELD_LABELS[field] ?? field)
      .join(", ");
    toast.error(`Please complete the highlighted fields: ${missing}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await register.mutateAsync({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      });
      toast.success(
        "Welcome to the Slipperze community. Preparing your artisanal welcome...",
      );

      // Redirect immediately to the verification page
      // We pass the email in the query param so the next page can show it
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (err: any) {
      const message = err.message || "Sign up failed";
      setServerError(message);
      toast.error(message);
      if (
        err instanceof Error &&
        "fieldErrors" in err &&
        (err as { fieldErrors?: Record<string, string> }).fieldErrors
      ) {
        const fieldErrors = (err as { fieldErrors: Record<string, string> })
          .fieldErrors;
        for (const [field, message] of Object.entries(fieldErrors)) {
          if (
            field === "email" ||
            field === "password" ||
            field === "firstName" ||
            field === "lastName"
          ) {
            setError(field, { type: "server", message });
          }
        }
      }
    } finally {
      register.reset();
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <header className="space-y-4 text-center pb-10 border-b border-sand/30">
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-charcoal tracking-tight italic">Join the Family</h1>
        <p className="text-[10px] tracking-[0.4em] uppercase text-gold font-bold leading-relaxed">
          The Slipperze Heritage Community
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-x-10">
        <FormField
          id="firstName"
          label="Given Name"
          error={errors.firstName?.message}
          className="uppercase tracking-[0.2em] text-[9px] font-bold text-slate-muted/60"
        >
          <Input
            id="firstName"
            variant="boxed"
            placeholder="e.g. Julian"
            autoComplete="given-name"
            hasError={Boolean(errors.firstName)}
            {...registerField("firstName")}
          />
        </FormField>
        <FormField
          id="lastName"
          label="Surname"
          error={errors.lastName?.message}
          className="uppercase tracking-[0.2em] text-[9px] font-bold text-slate-muted/60"
        >
          <Input
            id="lastName"
            variant="boxed"
            placeholder="e.g. Bennett"
            autoComplete="family-name"
            hasError={Boolean(errors.lastName)}
            {...registerField("lastName")}
          />
        </FormField>
      </div>

      <FormField id="email" label="Correspondence / Email" error={errors.email?.message} className="uppercase tracking-[0.2em] text-[9px] font-bold text-slate-muted/60">
        <Input
          id="email"
          type="email"
          variant="boxed"
          placeholder="member@slipperze.com"
          autoComplete="email"
          hasError={Boolean(errors.email)}
          {...registerField("email")}
        />
      </FormField>

      <div>
        <FormField
          id="password"
          label="Security Key / Password"
          error={errors.password?.message}
          className="uppercase tracking-[0.2em] text-[9px] font-bold text-slate-muted/60"
        >
          <PasswordInput
            id="password"
            variant="boxed"
            placeholder="••••••••"
            autoComplete="new-password"
            hasError={Boolean(errors.password)}
            {...registerField("password")}
          />
        </FormField>
        <PasswordStrengthWatcher control={control} name="password" />
      </div>

      <FormField
        id="confirmPassword"
        label="Verify Security Key"
        error={errors.confirmPassword?.message}
        className="uppercase tracking-[0.2em] text-[9px] font-bold text-slate-muted/60"
      >
        <PasswordInput
          id="confirmPassword"
          variant="boxed"
          placeholder="••••••••"
          autoComplete="new-password"
          hasError={Boolean(errors.confirmPassword)}
          {...registerField("confirmPassword")}
        />
      </FormField>

      <Controller
        control={control}
        name="agreeToTerms"
        render={({ field }) => (
          <div className="space-y-1">
            <label className="flex items-start gap-3 text-xs text-charcoal">
              <span className="pt-0.5">
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  hasError={Boolean(errors.agreeToTerms)}
                />
              </span>
              <span className="leading-relaxed">
                I agree to the{" "}
                <Link
                  href={TERMS_HREF}
                  className="font-medium underline underline-offset-2 hover:text-gold"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href={PRIVACY_HREF}
                  className="font-medium underline underline-offset-2 hover:text-gold"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.agreeToTerms ? (
              <p className="text-[11px] text-burgundy" role="alert">
                {errors.agreeToTerms.message}
              </p>
            ) : null}
          </div>
        )}
      />

      {serverError && !Object.keys(errors).length ? (
        <p className="text-[11px] text-burgundy" role="alert">
          {serverError}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        className="h-16 uppercase tracking-[0.4em] text-[10px] font-bold transition-all duration-700 hover:tracking-[0.5em] rounded-none shadow-md"
        fullWidth
        isLoading={isSubmitting}
      >
        Commission Account
      </Button>

      <p className="text-center text-xs text-slate-muted">
        Already a member?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-charcoal underline underline-offset-4 hover:text-gold"
        >
          Sign in here
        </Link>
      </p>
    </form>
  );
}

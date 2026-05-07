"use client";

import { useState } from "react";
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
  PasswordStrengthMeter,
} from "@tasheen/ui";
import { useRegister } from "../hooks/useRegister";
import { useResendVerification } from "../hooks/useResendVerification";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const TERMS_HREF = "/legal/terms";
const PRIVACY_HREF = "/legal/privacy";

export function SignUpForm() {
  const router = useRouter();
  const register = useRegister();
  const resendVerification = useResendVerification();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    control,
    setError,
    watch,
    formState: { errors, isSubmitting },
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

  const passwordValue = watch("password");

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await register.mutateAsync({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      });
      toast.success("Welcome to the Slipperze community. Preparing your artisanal welcome...");
      
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
      setServerError(err instanceof Error ? err.message : "Sign up failed");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <header className="space-y-4 text-center pb-10 border-b border-stone-100">
        <h1 className="font-serif text-6xl text-charcoal tracking-tight italic">Registry</h1>
        <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-bold leading-relaxed">
          Commission your artisanal member portfolio.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-x-10">
        <FormField
          id="firstName"
          label="Given Name"
          error={errors.firstName?.message}
          className="uppercase tracking-[0.2em] text-[9px] font-bold text-stone-400"
        >
          <input
            id="firstName"
            placeholder="e.g. Julian"
            autoComplete="given-name"
            className="w-full bg-stone-50 border border-stone-100 px-6 py-4 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none"
            {...registerField("firstName")}
          />
        </FormField>
        <FormField
          id="lastName"
          label="Surname"
          error={errors.lastName?.message}
          className="uppercase tracking-[0.2em] text-[9px] font-bold text-stone-400"
        >
          <input
            id="lastName"
            placeholder="e.g. Bennett"
            autoComplete="family-name"
            className="w-full bg-stone-50 border border-stone-100 px-6 py-4 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none"
            {...registerField("lastName")}
          />
        </FormField>
      </div>

      <FormField id="email" label="Correspondence / Email" error={errors.email?.message} className="uppercase tracking-[0.2em] text-[9px] font-bold text-stone-400">
        <input
          id="email"
          type="email"
          placeholder="member@slipperze.com"
          autoComplete="email"
          className="w-full bg-stone-50 border border-stone-100 px-6 py-4 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none"
          {...registerField("email")}
        />
      </FormField>

      <div>
        <FormField
          id="password"
          label="Security Key / Password"
          error={errors.password?.message}
          className="uppercase tracking-[0.2em] text-[9px] font-bold text-stone-400"
        >
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full bg-stone-50 border border-stone-100 px-6 py-4 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none pr-12"
              {...registerField("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-gold transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>
        <PasswordStrengthMeter password={passwordValue ?? ""} />
      </div>

      <FormField
        id="confirmPassword"
        label="Verify Security Key"
        error={errors.confirmPassword?.message}
        className="uppercase tracking-[0.2em] text-[9px] font-bold text-stone-400"
      >
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            className="w-full bg-stone-50 border border-stone-100 px-6 py-4 text-sm text-charcoal placeholder:text-stone-300 focus:bg-white focus:border-gold focus:outline-none transition-all duration-500 rounded-none pr-12"
            {...registerField("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-gold transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
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
        isLoading={isSubmitting || register.isPending}
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

import { type ReactNode } from "react";
import { cn } from "../cn";
import { Label } from "../primitives/Label";

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  helperText?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Editorial form field wrapper — pairs a floating `<Label />` with any
 * child input that supports the `peer` floating-label CSS contract
 * (Input, PasswordInput, etc.). Renders error/helper text below the
 * input in a fixed row to prevent layout shift on validation.
 */
export function FormField({
  id,
  label,
  error,
  helperText,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("relative pt-2", className)}>
      <div className="relative">
        {children}
        <Label htmlFor={id}>{label}</Label>
      </div>
      <div className="mt-1 min-h-[1rem] text-[11px] leading-tight">
        {error ? (
          <p className="text-burgundy" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-slate-muted/70">{helperText}</p>
        ) : null}
      </div>
    </div>
  );
}

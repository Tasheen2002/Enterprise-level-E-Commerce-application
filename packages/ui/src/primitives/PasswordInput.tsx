"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, type InputProps } from "./Input";
import { cn } from "../cn";

export interface PasswordInputProps extends Omit<InputProps, "type"> {}

/**
 * Password input with show/hide toggle. Wraps `<Input />` so it picks up
 * the same editorial styling, error state, and label coupling.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, variant = "editorial", ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    
    return (
      <span className="relative block">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          variant={variant}
          className={cn(variant === "editorial" ? "pr-8" : "pr-12", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 transition-colors focus-visible:outline-none focus-visible:text-gold",
            variant === "editorial" 
              ? "right-0 text-slate-muted/40 hover:text-charcoal" 
              : "right-4 text-slate-muted/30 hover:text-gold"
          )}
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </span>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

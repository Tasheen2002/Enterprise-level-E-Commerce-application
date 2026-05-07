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
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <span className="relative block">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-8", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-muted transition-colors hover:text-charcoal focus-visible:outline-none focus-visible:text-charcoal"
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

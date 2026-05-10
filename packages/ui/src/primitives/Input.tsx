import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  variant?: "editorial" | "boxed";
}

/**
 * Editorial input — borderless except for a hairline bottom rule that
 * shifts to gold on focus. Pairs with the floating-label `FormField`
 * wrapper in `@tasheen/ui/forms`.
 * 
 * Boxed input — light gray background with full borders, used for secondary forms.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, type = "text", variant = "editorial", ...props }, ref) => {
    const variants = {
      editorial: cn(
        "peer w-full border-0 border-b bg-transparent px-0 pt-7 pb-2 text-sm text-charcoal placeholder-transparent focus:outline-none focus:ring-0 transition-colors",
        hasError
          ? "border-burgundy focus:border-burgundy"
          : "border-charcoal/20 focus:border-gold"
      ),
      boxed: cn(
        "w-full bg-ivory/40 border px-6 py-4 text-sm text-charcoal placeholder:text-slate-muted/30 focus:bg-white focus:outline-none transition-all duration-500 rounded-none shadow-sm",
        hasError
          ? "border-burgundy focus:border-burgundy"
          : "border-sand/40 focus:border-gold"
      )
    };

    return (
      <input
        ref={ref}
        type={type}
        className={cn(variants[variant], className)}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

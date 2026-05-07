import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

/**
 * Editorial input — borderless except for a hairline bottom rule that
 * shifts to gold on focus. Pairs with the floating-label `FormField`
 * wrapper in `@tasheen/ui/forms`.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "peer w-full border-0 border-b bg-transparent px-0 pt-7 pb-2 text-sm text-charcoal placeholder-transparent focus:outline-none focus:ring-0 transition-colors",
          hasError
            ? "border-burgundy focus:border-burgundy"
            : "border-charcoal/20 focus:border-gold",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "../cn";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  hasError?: boolean;
}

/**
 * Editorial checkbox — neutral square outline that fills charcoal when
 * checked. Custom-rendered (visually hidden native input + decorative
 * box) so we keep keyboard/screen-reader semantics intact.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <span className="relative inline-flex h-4 w-4 shrink-0">
        <input
          ref={ref}
          type="checkbox"
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none flex h-4 w-4 items-center justify-center border transition-all duration-300 ease-editorial",
            "border-charcoal/40 bg-transparent",
            "peer-hover:border-charcoal peer-focus-visible:ring-2 peer-focus-visible:ring-gold",
            "peer-checked:border-charcoal peer-checked:bg-charcoal",
            hasError && "border-burgundy",
            className,
          )}
        >
          <Check 
            className="h-2.5 w-2.5 text-cream opacity-0 scale-50 transition-all duration-300 peer-checked:opacity-100 peer-checked:scale-100" 
            strokeWidth={4} 
          />
        </span>
      </span>
    );
  },
);
Checkbox.displayName = "Checkbox";

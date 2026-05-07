import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "../cn";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}


export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "pointer-events-none absolute left-0 top-0 text-[10px] uppercase tracking-[0.16em] text-slate-muted transition-all duration-300 ease-editorial",
          "peer-placeholder-shown:top-7 peer-placeholder-shown:text-sm peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-placeholder-shown:text-slate-muted/70",
          "peer-focus:top-0 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-[0.16em] peer-focus:text-charcoal",
          className,
        )}
        {...props}
      />
    );
  },
);
Label.displayName = "Label";

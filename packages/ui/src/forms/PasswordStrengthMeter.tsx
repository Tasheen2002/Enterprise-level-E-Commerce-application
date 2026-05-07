import { useMemo } from "react";
import { cn } from "../cn";

export interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

type Strength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
};

/**
 * Heuristic strength scoring — length + character class diversity. Not a
 * cryptographic guarantee; for production hardening, layer this on top of
 * a server-side check (zxcvbn, HIBP). The visual is the editorial 4-bar
 * meter shown in the brand sign-up design.
 */
function score(password: string): Strength {
  if (password.length === 0) return { score: 0, label: "" };
  let s = 0;
  if (password.length >= 8) s += 1;
  if (password.length >= 12) s += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) s += 1;
  const clamped = Math.min(s, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Weak", "Weak", "Fair", "Moderate", "Strong"] as const;
  return { score: clamped, label: labels[clamped] };
}

export function PasswordStrengthMeter({
  password,
  className,
}: PasswordStrengthMeterProps) {
  const strength = useMemo(() => score(password), [password]);
  const filledColor =
    strength.score <= 1
      ? "bg-burgundy"
      : strength.score === 2
        ? "bg-gold-deep"
        : strength.score === 3
          ? "bg-gold"
          : "bg-sage";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-0.5 flex-1 transition-colors duration-300 ease-editorial",
              i < strength.score ? filledColor : "bg-charcoal/15",
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em]">
        <span className="text-slate-muted">Strength</span>
        <span className="text-charcoal">{strength.label}</span>
      </div>
    </div>
  );
}

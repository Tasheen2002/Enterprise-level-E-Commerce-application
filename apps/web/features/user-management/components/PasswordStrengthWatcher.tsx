"use client";

import { useWatch, type Control, type FieldValues, type Path } from "react-hook-form";
import { PasswordStrengthMeter } from "@tasheen/ui";

interface PasswordStrengthWatcherProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
}

/**
 * Subscribes only to the named password field via `useWatch`. Wrapping
 * the strength meter this way means a keystroke re-renders just this
 * leaf — not every `FormField`, `Input`, and `Controller` in the parent
 * form (the previous `watch()` pattern did the latter on every key).
 */
export function PasswordStrengthWatcher<T extends FieldValues>({
  control,
  name,
}: PasswordStrengthWatcherProps<T>) {
  const value = useWatch({ control, name });
  return <PasswordStrengthMeter password={(value as string | undefined) ?? ""} />;
}

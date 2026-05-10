import type { ReactNode } from "react";

export function AccountMain({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 animate-in fade-in duration-200">
      {children}
    </main>
  );
}

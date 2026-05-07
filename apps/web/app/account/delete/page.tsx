"use client";

import { Suspense } from "react";
import { Container } from "@tasheen/ui";
import { Loader2 } from "lucide-react";
import { AccountSidebar } from "@/features/user-management/components/AccountSidebar";
import { DeleteAccountForm } from "@/features/user-management/components/DeleteAccountForm";

export default function DeleteAccountPage() {
  return (
    <Container size="full" className="flex-1 p-0">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-10rem)] bg-white">
        <AccountSidebar />
        <main className="flex-1 p-8 lg:p-16 bg-stone-50/20">
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 text-gold animate-spin" />
            </div>
          }>
            <DeleteAccountForm />
          </Suspense>
        </main>
      </div>
    </Container>
  );
}

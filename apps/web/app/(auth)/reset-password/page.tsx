"use client";

import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/user-management/components/ResetPasswordForm";
import { Container } from "@tasheen/ui";
import { AuthHero } from "@/features/user-management/components/AuthHero";

export default function ResetPasswordPage() {
  return (
    <Container size="wide" className="flex-1 py-8">
      <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        <AuthHero
          imageSrc="/images/auth/reset-password-hero.jpg"
          imageAlt="Close-up of artisanal leather detailing and fine stitching."
        />
        <div className="flex items-center justify-center px-2 py-10 lg:px-12">
          <div className="w-full max-w-md">
            <Suspense fallback={<div className="text-center text-slate-muted">Loading reset form...</div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </Container>
  );
}

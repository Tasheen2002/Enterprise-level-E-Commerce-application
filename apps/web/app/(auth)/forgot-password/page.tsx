import { ForgotPasswordForm } from "@/features/user-management/components/ForgotPasswordForm";
import { Container } from "@tasheen/ui";
import { buildMetadata } from "@/lib/seo";
import { imageKitUrl } from "@/lib/imagekit";
import { AuthHero } from "@/features/user-management/components/AuthHero";

export const metadata = buildMetadata({
  title: "Forgot Password",
  description: "Reset your Tasheen account password.",
  path: "/forgot-password",
});

export default function ForgotPasswordPage() {
  return (
    <Container size="wide" className="flex-1 py-8">
      <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 lg:grid-cols-2 lg:gap-16">
        <AuthHero
          imageSrc={imageKitUrl("forgot-password-hero.jpg")}
          imageAlt="Artisanal leather workshop with tools and high-quality hides."
        />
        <div className="flex items-center justify-center px-2 py-10 lg:px-12">
          <div className="w-full max-w-md">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </Container>
  );
}

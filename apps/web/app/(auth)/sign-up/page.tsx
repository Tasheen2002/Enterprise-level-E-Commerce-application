import { SignUpForm } from "@/features/user-management/components/SignUpForm";
import { Container } from "@tasheen/ui";
import { buildMetadata } from "@/lib/seo";
import { AuthHero } from "@/features/user-management/components/AuthHero";

export const metadata = buildMetadata({
  title: "Sign Up",
  description:
    "Create a Tasheen account to access bespoke services and artisanal collections.",
  path: "/sign-up",
});

export default function SignUpPage() {
  return (
    <Container size="wide" className="flex-1 py-8">
      <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        <AuthHero
          imageSrc="/images/auth/signup-hero.jpg"
          imageAlt="Tasheen leather oxford shoes presented on a cream pedestal."
        />
        <div className="flex items-center justify-center px-2 py-10 lg:px-12">
          <div className="w-full max-w-md">
            <SignUpForm />
          </div>
        </div>
      </div>
    </Container>
  );
}

import { Container } from "@tasheen/ui";
import { buildMetadata } from "@/lib/seo";
import { AuthHero } from "@/features/user-management/components/AuthHero";
import { SignInForm } from "@/features/user-management/components/SignInForm";

export const metadata = buildMetadata({
  title: "Sign In",
  description: "Welcome back to Tasheen — sign in to continue your story.",
  path: "/sign-in",
});

export default function SignInPage() {
  return (
    <Container size="wide" className="flex-1 py-8">
      <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        <AuthHero
          imageSrc="/images/auth/signin-hero.jpg"
          imageAlt="Tasheen artisanal loafers in multiple leather shades."
        />
        <div className="flex items-center justify-center px-2 py-10 lg:px-12">
          <div className="w-full max-w-md">
            <SignInForm />
          </div>
        </div>
      </div>
    </Container>
  );
}

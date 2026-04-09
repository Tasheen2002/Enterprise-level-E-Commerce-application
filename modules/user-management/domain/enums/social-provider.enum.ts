import { DomainValidationError } from "../errors/user-management.errors";

export enum SocialProvider {
  GOOGLE = "google",
  FACEBOOK = "facebook",
  APPLE = "apple",
  TWITTER = "twitter",
  LINKEDIN = "linkedin",
  GITHUB = "github",
  MICROSOFT = "microsoft",
}

export namespace SocialProvider {
  export function fromString(provider: string): SocialProvider {
    if (!provider || typeof provider !== "string") {
      throw new DomainValidationError(
        "Social provider must be a non-empty string",
      );
    }

    switch (provider.toLowerCase()) {
      case "google":
        return SocialProvider.GOOGLE;
      case "facebook":
        return SocialProvider.FACEBOOK;
      case "apple":
        return SocialProvider.APPLE;
      case "twitter":
        return SocialProvider.TWITTER;
      case "linkedin":
        return SocialProvider.LINKEDIN;
      case "github":
        return SocialProvider.GITHUB;
      case "microsoft":
        return SocialProvider.MICROSOFT;
      default:
        throw new DomainValidationError(
          `Invalid social provider: ${provider}`,
        );
    }
  }

  export function getAllValues(): SocialProvider[] {
    return [
      SocialProvider.GOOGLE,
      SocialProvider.FACEBOOK,
      SocialProvider.APPLE,
      SocialProvider.TWITTER,
      SocialProvider.LINKEDIN,
      SocialProvider.GITHUB,
      SocialProvider.MICROSOFT,
    ];
  }

  export function getDisplayName(provider: SocialProvider): string {
    switch (provider) {
      case SocialProvider.GOOGLE:
        return "Google";
      case SocialProvider.FACEBOOK:
        return "Facebook";
      case SocialProvider.APPLE:
        return "Apple";
      case SocialProvider.TWITTER:
        return "Twitter";
      case SocialProvider.LINKEDIN:
        return "LinkedIn";
      case SocialProvider.GITHUB:
        return "GitHub";
      case SocialProvider.MICROSOFT:
        return "Microsoft";
      default:
        return provider;
    }
  }
}

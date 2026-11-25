import type {
  IEmailService,
  IEmailSender,
  SendEmailOptions,
} from "../domain/ports/email.service.port";
import type {
  IEmailService as LegacyEmailService,
  SendEmailOptions as LegacyOptions,
} from "../../user-management/application/services/iemail.service";
import { NodemailerEmailService } from "../../user-management/infra/security/nodemailer-email.adapter";
import { NewsletterService } from "../../engagement/application/services/newsletter.service";
import type { INewsletterSubscriptionRepository } from "../../engagement/domain/repositories/newsletter-subscription.repository";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
export type LegacyPortCompatibility = Assert<Equal<IEmailService, LegacyEmailService>>;
export type LegacyOptionsCompatibility = Assert<Equal<SendEmailOptions, LegacyOptions>>;
export const fullService: IEmailService = new NodemailerEmailService();
export const sender: IEmailSender = {
  async sendEmail(_options: SendEmailOptions): Promise<void> {},
};
// @ts-expect-error A generic sender does not implement authentication-specific templates.
export const incompleteAuthService: IEmailService = sender;
export function newsletterRequiresOnlyGenericSubmission(
  repository: INewsletterSubscriptionRepository,
) {
  return new NewsletterService(repository, undefined, sender);
}

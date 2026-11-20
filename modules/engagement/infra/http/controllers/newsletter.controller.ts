import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import { hasRole, CUSTOMER_CARE_ROLES } from "@/api/src/shared/middleware/role-authorization.middleware";
import { isValidNewsletterUnsubscribeToken } from "../newsletter-unsubscribe-token";

const isCustomerCare = (request: AuthenticatedRequest) => hasRole(request, [...CUSTOMER_CARE_ROLES]);
const isOwnEmail = (request: AuthenticatedRequest, email?: string) =>
  !!email && !!request.user?.email && request.user.email.toLowerCase() === email.toLowerCase();
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const page = (title: string, colour: string, body: string) => `
          <div style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h1 style="color: ${colour};">${title}</h1>
            ${body}
          </div>
        `;
import {
  SubscribeNewsletterHandler,
  UnsubscribeNewsletterHandler,
  GetNewsletterSubscriptionHandler,
} from "../../../application";
import {
  SubscribeNewsletterBody,
  UnsubscribeNewsletterBody,
  UnsubscribeViaLinkQuery,
  GetSubscriptionQuery,
} from "../validation/newsletter.schema";

export class NewsletterController {
  constructor(
    private readonly subscribeNewsletterHandler: SubscribeNewsletterHandler,
    private readonly unsubscribeNewsletterHandler: UnsubscribeNewsletterHandler,
    private readonly getNewsletterSubscriptionHandler: GetNewsletterSubscriptionHandler,
  ) {}

  async subscribe(
    request: AuthenticatedRequest<{ Body: SubscribeNewsletterBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { email, source } = request.body;
      const result = await this.subscribeNewsletterHandler.handle({ email, source });
      return ResponseHelper.fromCommand(reply, result, "Subscribed to newsletter successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async unsubscribe(
    request: AuthenticatedRequest<{ Body: UnsubscribeNewsletterBody }>,
    reply: FastifyReply,
  ) {
    try {
      // Anyone could otherwise unsubscribe any address: require the signed link
      // token, a signed-in account with this email, or customer care.
      const { subscriptionId, email, token } = request.body;
      const staff = isCustomerCare(request);
      const allowed =
        staff ||
        (!!email && (isOwnEmail(request, email) || isValidNewsletterUnsubscribeToken(email, token)));
      if (!allowed) {
        return ResponseHelper.forbidden(
          reply,
          "Use the unsubscribe link from a newsletter email, or sign in with this address",
        );
      }
      const result = await this.unsubscribeNewsletterHandler.handle({
        subscriptionId: staff ? subscriptionId : undefined,
        email,
      });
      return ResponseHelper.fromCommand(reply, result, "Unsubscribed from newsletter successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async unsubscribeViaLink(
    request: AuthenticatedRequest<{ Querystring: UnsubscribeViaLinkQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { email, token } = request.query;
      if (!isValidNewsletterUnsubscribeToken(email, token)) {
        return reply
          .code(400)
          .type("text/html")
          .send(page("Unsubscription Failed", "#e53e3e", "<p>This unsubscribe link is not valid.</p>"));
      }
      const result = await this.unsubscribeNewsletterHandler.handle({ email });
      if (result.success) {
        const shop = escapeHtml(process.env.FRONTEND_URL || "http://localhost:3000");
        return reply.code(200).type("text/html").send(
          page(
            "Unsubscribed Successfully",
            "#232D35",
            `<p>You have been removed from our newsletter (${escapeHtml(email)}).</p>
            <p><a href="${shop}" style="color: #232D35;">Return to Shop</a></p>`,
          ),
        );
      }
      return reply
        .code(400)
        .type("text/html")
        .send(
          page(
            "Unsubscription Failed",
            "#e53e3e",
            `<p>${escapeHtml(result.error || "Could not unsubscribe.")}</p>`,
          ),
        );
    } catch (error: unknown) {
      return reply.code(500).type("text/html").send(`
        <div style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h1 style="color: #e53e3e;">Error</h1>
          <p>An internal error occurred.</p>
        </div>
      `);
    }
  }

  async getSubscription(
    request: AuthenticatedRequest<{ Querystring: GetSubscriptionQuery }>,
    reply: FastifyReply,
  ) {
    try {
      // Subscriptions reveal whether an address is on the list: customers may
      // look up their own email; customer care may look up any.
      const { subscriptionId, email } = request.query;
      const staff = isCustomerCare(request);
      if (!staff && !isOwnEmail(request, email)) {
        return ResponseHelper.forbidden(reply, "You can only view your own newsletter subscription");
      }
      const dto = await this.getNewsletterSubscriptionHandler.handle({
        subscriptionId: staff ? subscriptionId : undefined,
        email,
      });
      return ResponseHelper.ok(reply, "Newsletter subscription retrieved successfully", dto);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}

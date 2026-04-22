import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
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
      const { subscriptionId, email } = request.body;
      const result = await this.unsubscribeNewsletterHandler.handle({ subscriptionId, email });
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
      const { email } = request.query;
      const result = await this.unsubscribeNewsletterHandler.handle({ email });
      if (result.success) {
        return reply.code(200).type("text/html").send(`
          <div style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h1 style="color: #232D35;">Unsubscribed Successfully</h1>
            <p>You have been removed from our newsletter (${email}).</p>
            <p><a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" style="color: #232D35;">Return to Shop</a></p>
          </div>
        `);
      }
      return reply.code(400).type("text/html").send(`
        <div style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h1 style="color: #e53e3e;">Unsubscription Failed</h1>
          <p>${result.error || "Could not unsubscribe."}</p>
        </div>
      `);
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
      const { subscriptionId, email } = request.query;
      const dto = await this.getNewsletterSubscriptionHandler.handle({ subscriptionId, email });
      return ResponseHelper.ok(reply, "Newsletter subscription retrieved successfully", dto);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}

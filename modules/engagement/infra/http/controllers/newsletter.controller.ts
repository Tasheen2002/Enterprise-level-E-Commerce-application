import { FastifyRequest, FastifyReply } from "fastify";
import {
  SubscribeNewsletterCommand,
  SubscribeNewsletterHandler,
  UnsubscribeNewsletterCommand,
  UnsubscribeNewsletterHandler,
} from "../../../application/commands/index.js";
import {
  GetNewsletterSubscriptionQuery,
  GetNewsletterSubscriptionHandler,
} from "../../../application/queries/index.js";
import { NewsletterService } from "../../../application/services/index.js";

interface SubscribeNewsletterRequest {
  email: string;
  source?: string;
}

interface UnsubscribeNewsletterRequest {
  subscriptionId?: string;
  email?: string;
}

export class NewsletterController {
  private subscribeNewsletterHandler: SubscribeNewsletterHandler;
  private unsubscribeNewsletterHandler: UnsubscribeNewsletterHandler;
  private getNewsletterSubscriptionHandler: GetNewsletterSubscriptionHandler;

  constructor(private readonly newsletterService: NewsletterService) {
    this.subscribeNewsletterHandler = new SubscribeNewsletterHandler(
      newsletterService
    );
    this.unsubscribeNewsletterHandler = new UnsubscribeNewsletterHandler(
      newsletterService
    );
    this.getNewsletterSubscriptionHandler =
      new GetNewsletterSubscriptionHandler(newsletterService);
  }

  async subscribe(
    request: FastifyRequest<{ Body: SubscribeNewsletterRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { email, source } = request.body;

      const command: SubscribeNewsletterCommand = {
        email,
        source,
      };

      const result = await this.subscribeNewsletterHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Subscribed to newsletter successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to subscribe to newsletter",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to subscribe to newsletter");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to subscribe to newsletter",
      });
    }
  }

  async unsubscribe(
    request: FastifyRequest<{ Body: UnsubscribeNewsletterRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { subscriptionId, email } = request.body;

      const command: UnsubscribeNewsletterCommand = {
        subscriptionId,
        email,
      };

      const result = await this.unsubscribeNewsletterHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Unsubscribed from newsletter successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to unsubscribe from newsletter",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to unsubscribe from newsletter");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to unsubscribe from newsletter",
      });
    }
  }

  async unsubscribeViaLink(
    request: FastifyRequest<{ Querystring: { email: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { email } = request.query;

      if (!email) {
        return reply.code(400).type("text/html").send(`
          <div style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h1 style="color: #e53e3e;">Invalid Request</h1>
            <p>Email address is missing.</p>
          </div>
        `);
      }

      const command: UnsubscribeNewsletterCommand = {
        email,
      };

      const result = await this.unsubscribeNewsletterHandler.handle(command);

      if (result.success) {
        return reply.code(200).type("text/html").send(`
          <div style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h1 style="color: #232D35;">Unsubscribed Successfully</h1>
            <p>You have been removed from our newsletter (${email}).</p>
            <p><a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" style="color: #232D35;">Return to Shop</a></p>
          </div>
        `);
      } else {
        return reply.code(400).type("text/html").send(`
          <div style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h1 style="color: #e53e3e;">Unsubscription Failed</h1>
            <p>${result.error || "Could not unsubscribe."}</p>
          </div>
        `);
      }
    } catch (error) {
      request.log.error(
        error,
        "Failed to unsubscribe from newsletter via link"
      );
      return reply.code(500).type("text/html").send(`
        <div style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h1 style="color: #e53e3e;">Error</h1>
          <p>An internal error occurred.</p>
        </div>
      `);
    }
  }

  async getSubscription(
    request: FastifyRequest<{
      Querystring: { subscriptionId?: string; email?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { subscriptionId, email } = request.query;

      if (!subscriptionId && !email) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Either subscriptionId or email is required",
        });
      }

      const query: GetNewsletterSubscriptionQuery = {
        subscriptionId,
        email,
      };

      const result = await this.getNewsletterSubscriptionHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else if (result.success && result.data === null) {
        return reply.code(404).send({
          success: false,
          error: "Newsletter subscription not found",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve newsletter subscription",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get newsletter subscription");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve newsletter subscription",
      });
    }
  }
}

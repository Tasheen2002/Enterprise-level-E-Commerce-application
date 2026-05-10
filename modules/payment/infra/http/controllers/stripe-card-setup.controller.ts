import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import { StripeCardSetupService } from "../../../application/services/stripe-card-setup.service";
import type { AttachPaymentMethodBody } from "../validation/stripe-card-setup.schema";

export class StripeCardSetupController {
  constructor(private readonly service: StripeCardSetupService) {}

  async createSetupIntent(
    request: AuthenticatedRequest,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.service.createSetupIntent({
        userId: request.user.userId,
        email: request.user.email ?? "",
      });
      return ResponseHelper.ok(reply, "Setup intent created", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async attachPaymentMethod(
    request: AuthenticatedRequest<{ Body: AttachPaymentMethodBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.service.attachPaymentMethod({
        userId: request.user.userId,
        stripePaymentMethodId: request.body.stripePaymentMethodId,
        isDefault: request.body.isDefault,
        billingAddressId: request.body.billingAddressId,
      });
      return ResponseHelper.created(reply, "Payment method attached", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}

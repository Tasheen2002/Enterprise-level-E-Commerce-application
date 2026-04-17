import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import { AddPaymentMethodHandler } from "../../../application/commands/add-payment-method.command";
import { UpdatePaymentMethodHandler } from "../../../application/commands/update-payment-method.command";
import { DeletePaymentMethodHandler } from "../../../application/commands/delete-payment-method.command";
import { SetDefaultPaymentMethodHandler } from "../../../application/commands/set-default-payment-method.command";
import { ListPaymentMethodsHandler } from "../../../application/queries/list-payment-methods.query";

export class PaymentMethodsController {
  constructor(
    private readonly addPaymentMethodHandler: AddPaymentMethodHandler,
    private readonly updatePaymentMethodHandler: UpdatePaymentMethodHandler,
    private readonly deletePaymentMethodHandler: DeletePaymentMethodHandler,
    private readonly setDefaultPaymentMethodHandler: SetDefaultPaymentMethodHandler,
    private readonly listPaymentMethodsHandler: ListPaymentMethodsHandler,
  ) {}

  async addPaymentMethod(
    request: AuthenticatedRequest<{
      Params: { userId: string };
      Body: {
        type: "card" | "wallet" | "bank" | "cod" | "gift_card";
        brand?: string;
        last4?: string;
        expMonth?: number;
        expYear?: number;
        billingAddressId?: string;
        providerRef?: string;
        isDefault?: boolean;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;
      const {
        type,
        brand,
        last4,
        expMonth,
        expYear,
        billingAddressId,
        providerRef,
        isDefault,
      } = request.body;

      const command = {
        userId,
        type,
        brand,
        last4,
        expMonth,
        expYear,
        billingAddressId,
        providerRef,
        isDefault,
      };

      const result = await this.addPaymentMethodHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Payment method added", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listPaymentMethods(
    request: AuthenticatedRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;
      const result = await this.listPaymentMethodsHandler.handle({ userId });
      return ResponseHelper.ok(reply, "Payment methods retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updatePaymentMethod(
    request: AuthenticatedRequest<{
      Params: { userId: string; paymentMethodId: string };
      Body: {
        billingAddressId?: string;
        isDefault?: boolean;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId, paymentMethodId } = request.params;
      const { billingAddressId, isDefault } = request.body;

      const result = await this.updatePaymentMethodHandler.handle({
        paymentMethodId,
        userId,
        billingAddressId,
        isDefault,
      });
      return ResponseHelper.fromCommand(reply, result, "Payment method updated");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deletePaymentMethod(
    request: AuthenticatedRequest<{
      Params: { userId: string; paymentMethodId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId, paymentMethodId } = request.params;

      const result = await this.deletePaymentMethodHandler.handle({
        paymentMethodId,
        userId,
      });
      return ResponseHelper.fromCommand(reply, result, "Payment method deleted", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async setDefaultPaymentMethod(
    request: AuthenticatedRequest<{
      Params: { userId: string; paymentMethodId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId, paymentMethodId } = request.params;

      const result = await this.setDefaultPaymentMethodHandler.handle({
        paymentMethodId,
        userId,
      });
      return ResponseHelper.fromCommand(reply, result, "Default payment method updated");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async addCurrentUserPaymentMethod(
    request: AuthenticatedRequest<{
      Body: {
        type: "card" | "wallet" | "bank" | "cod" | "gift_card";
        brand?: string;
        last4?: string;
        expMonth?: number;
        expYear?: number;
        billingAddressId?: string;
        providerRef?: string;
        isDefault?: boolean;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.addPaymentMethodHandler.handle({
        userId: request.user.userId,
        type: request.body.type,
        brand: request.body.brand,
        last4: request.body.last4,
        expMonth: request.body.expMonth,
        expYear: request.body.expYear,
        billingAddressId: request.body.billingAddressId,
        providerRef: request.body.providerRef,
        isDefault: request.body.isDefault,
      });
      return ResponseHelper.fromCommand(reply, result, "Payment method added", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getCurrentUserPaymentMethods(
    request: AuthenticatedRequest,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listPaymentMethodsHandler.handle({
        userId: request.user.userId,
      });
      return ResponseHelper.ok(reply, "Payment methods retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateCurrentUserPaymentMethod(
    request: AuthenticatedRequest<{
      Params: { paymentMethodId: string };
      Body: {
        billingAddressId?: string;
        isDefault?: boolean;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { paymentMethodId } = request.params;
      const { billingAddressId, isDefault } = request.body;

      const result = await this.updatePaymentMethodHandler.handle({
        paymentMethodId,
        userId: request.user.userId,
        billingAddressId,
        isDefault,
      });
      return ResponseHelper.fromCommand(reply, result, "Payment method updated");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteCurrentUserPaymentMethod(
    request: AuthenticatedRequest<{ Params: { paymentMethodId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { paymentMethodId } = request.params;

      const result = await this.deletePaymentMethodHandler.handle({
        paymentMethodId,
        userId: request.user.userId,
      });
      return ResponseHelper.fromCommand(reply, result, "Payment method deleted", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async setDefaultCurrentUserPaymentMethod(
    request: AuthenticatedRequest<{ Params: { paymentMethodId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { paymentMethodId } = request.params;

      const result = await this.setDefaultPaymentMethodHandler.handle({
        paymentMethodId,
        userId: request.user.userId,
      });
      return ResponseHelper.fromCommand(reply, result, "Default payment method updated");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}

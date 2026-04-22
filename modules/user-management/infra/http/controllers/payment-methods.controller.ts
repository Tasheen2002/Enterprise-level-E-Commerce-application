import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  AddPaymentMethodHandler,
  UpdatePaymentMethodHandler,
  DeletePaymentMethodHandler,
  SetDefaultPaymentMethodHandler,
  ListPaymentMethodsHandler,
} from "../../../application";
import {
  AddPaymentMethodBody,
  UpdatePaymentMethodBody,
  PaymentMethodIdParams,
} from "../validation/payment-method.schema";
import { UserIdParams } from "../validation/user.schema";

export class PaymentMethodsController {
  constructor(
    private readonly addPaymentMethodHandler: AddPaymentMethodHandler,
    private readonly updatePaymentMethodHandler: UpdatePaymentMethodHandler,
    private readonly deletePaymentMethodHandler: DeletePaymentMethodHandler,
    private readonly setDefaultPaymentMethodHandler: SetDefaultPaymentMethodHandler,
    private readonly listPaymentMethodsHandler: ListPaymentMethodsHandler,
  ) {}

  async addPaymentMethod(
    request: AuthenticatedRequest<{ Params: UserIdParams; Body: AddPaymentMethodBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.addPaymentMethodHandler.handle({
        userId: request.params.userId,
        ...request.body,
      });
      return ResponseHelper.fromCommand(reply, result, "Payment method added", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listPaymentMethods(
    request: AuthenticatedRequest<{ Params: UserIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listPaymentMethodsHandler.handle({ userId: request.params.userId });
      return ResponseHelper.ok(reply, "Payment methods retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updatePaymentMethod(
    request: AuthenticatedRequest<{ Params: UserIdParams & PaymentMethodIdParams; Body: UpdatePaymentMethodBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updatePaymentMethodHandler.handle({
        paymentMethodId: request.params.paymentMethodId,
        userId: request.params.userId,
        ...request.body,
      });
      return ResponseHelper.fromCommand(reply, result, "Payment method updated");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deletePaymentMethod(
    request: AuthenticatedRequest<{ Params: UserIdParams & PaymentMethodIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deletePaymentMethodHandler.handle({
        paymentMethodId: request.params.paymentMethodId,
        userId: request.params.userId,
      });
      return ResponseHelper.fromCommand(reply, result, "Payment method deleted", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async setDefaultPaymentMethod(
    request: AuthenticatedRequest<{ Params: UserIdParams & PaymentMethodIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.setDefaultPaymentMethodHandler.handle({
        paymentMethodId: request.params.paymentMethodId,
        userId: request.params.userId,
      });
      return ResponseHelper.fromCommand(reply, result, "Default payment method updated");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async addCurrentUserPaymentMethod(
    request: AuthenticatedRequest<{ Body: AddPaymentMethodBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.addPaymentMethodHandler.handle({
        userId: request.user.userId,
        ...request.body,
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
      const result = await this.listPaymentMethodsHandler.handle({ userId: request.user.userId });
      return ResponseHelper.ok(reply, "Payment methods retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateCurrentUserPaymentMethod(
    request: AuthenticatedRequest<{ Params: PaymentMethodIdParams; Body: UpdatePaymentMethodBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updatePaymentMethodHandler.handle({
        paymentMethodId: request.params.paymentMethodId,
        userId: request.user.userId,
        ...request.body,
      });
      return ResponseHelper.fromCommand(reply, result, "Payment method updated");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteCurrentUserPaymentMethod(
    request: AuthenticatedRequest<{ Params: PaymentMethodIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deletePaymentMethodHandler.handle({
        paymentMethodId: request.params.paymentMethodId,
        userId: request.user.userId,
      });
      return ResponseHelper.fromCommand(reply, result, "Payment method deleted", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async setDefaultCurrentUserPaymentMethod(
    request: AuthenticatedRequest<{ Params: PaymentMethodIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.setDefaultPaymentMethodHandler.handle({
        paymentMethodId: request.params.paymentMethodId,
        userId: request.user.userId,
      });
      return ResponseHelper.fromCommand(reply, result, "Default payment method updated");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}

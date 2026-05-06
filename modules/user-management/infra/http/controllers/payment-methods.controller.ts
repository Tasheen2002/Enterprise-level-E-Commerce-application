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
  ListPaymentMethodsQueryParams,
} from "../validation/payment-method.schema";

export class PaymentMethodsController {
  constructor(
    private readonly addPaymentMethodHandler: AddPaymentMethodHandler,
    private readonly updatePaymentMethodHandler: UpdatePaymentMethodHandler,
    private readonly deletePaymentMethodHandler: DeletePaymentMethodHandler,
    private readonly setDefaultPaymentMethodHandler: SetDefaultPaymentMethodHandler,
    private readonly listPaymentMethodsHandler: ListPaymentMethodsHandler,
  ) { }

  // --- Queries ---

  async getCurrentUserPaymentMethods(
    request: AuthenticatedRequest<{ Querystring: ListPaymentMethodsQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listPaymentMethodsHandler.handle({
        userId: request.user.userId,
        page: request.query.page,
        limit: request.query.limit,
      });
      return ResponseHelper.ok(reply, "Payment methods retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // --- Commands ---

  async addCurrentUserPaymentMethod(
    request: AuthenticatedRequest<{ Body: AddPaymentMethodBody }>,
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

  async updateCurrentUserPaymentMethod(
    request: AuthenticatedRequest<{ Params: PaymentMethodIdParams; Body: UpdatePaymentMethodBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updatePaymentMethodHandler.handle({
        paymentMethodId: request.params.paymentMethodId,
        userId: request.user.userId,
        billingAddressId: request.body.billingAddressId,
        isDefault: request.body.isDefault,
        expMonth: request.body.expMonth,
        expYear: request.body.expYear,
        providerRef: request.body.providerRef,
      });
      return ResponseHelper.fromCommand(reply, result, "Payment method updated");
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
}

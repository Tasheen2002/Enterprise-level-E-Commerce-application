import { FastifyRequest, FastifyReply } from "fastify";
import {
  AddPaymentMethodCommand,
  AddPaymentMethodHandler,
  UpdatePaymentMethodCommand,
  UpdatePaymentMethodHandler,
  DeletePaymentMethodCommand,
  DeletePaymentMethodHandler,
  ListPaymentMethodsQuery,
  ListPaymentMethodsHandler,
} from "../../../application";
import { PaymentMethodService } from "../../../application/services/payment-method.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

// Request DTOs
export interface AddPaymentMethodRequest {
  type: "card" | "wallet" | "bank" | "cod" | "gift_card";
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  billingAddressId?: string;
  providerRef?: string;
  isDefault?: boolean;
}

export interface UpdatePaymentMethodRequest {
  billingAddressId?: string;
  isDefault?: boolean;
}

export class PaymentMethodsController {
  private addPaymentMethodHandler: AddPaymentMethodHandler;
  private updatePaymentMethodHandler: UpdatePaymentMethodHandler;
  private deletePaymentMethodHandler: DeletePaymentMethodHandler;
  private listPaymentMethodsHandler: ListPaymentMethodsHandler;
  private paymentMethodService: PaymentMethodService;

  constructor(paymentMethodService: PaymentMethodService) {
    this.paymentMethodService = paymentMethodService;
    this.addPaymentMethodHandler = new AddPaymentMethodHandler(paymentMethodService);
    this.updatePaymentMethodHandler = new UpdatePaymentMethodHandler(paymentMethodService);
    this.deletePaymentMethodHandler = new DeletePaymentMethodHandler(paymentMethodService);
    this.listPaymentMethodsHandler = new ListPaymentMethodsHandler(paymentMethodService);
  }

  async addPaymentMethod(
    request: FastifyRequest<{
      Params: { userId: string };
      Body: AddPaymentMethodRequest;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const { type, brand, last4, expMonth, expYear, billingAddressId, providerRef, isDefault } = request.body;

      const command: AddPaymentMethodCommand = {
        userId,
        type,
        brand,
        last4,
        expMonth,
        expYear,
        billingAddressId,
        providerRef,
        isDefault,
        timestamp: new Date(),
      };

      const result = await this.addPaymentMethodHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "Payment method added", 201);
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async listPaymentMethods(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const query: ListPaymentMethodsQuery = { userId, timestamp: new Date() };
      const result = await this.listPaymentMethodsHandler.handle(query);
      ResponseHelper.fromQuery(reply, result, "Payment methods retrieved");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async updatePaymentMethod(
    request: FastifyRequest<{
      Params: { userId: string; paymentMethodId: string };
      Body: UpdatePaymentMethodRequest;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId, paymentMethodId } = request.params;
      const { billingAddressId, isDefault } = request.body;

      const command: UpdatePaymentMethodCommand = {
        paymentMethodId,
        userId,
        billingAddressId,
        isDefault,
        timestamp: new Date(),
      };

      const result = await this.updatePaymentMethodHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "Payment method updated");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async deletePaymentMethod(
    request: FastifyRequest<{
      Params: { userId: string; paymentMethodId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId, paymentMethodId } = request.params;

      const command: DeletePaymentMethodCommand = {
        paymentMethodId,
        userId,
        timestamp: new Date(),
      };

      const result = await this.deletePaymentMethodHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "Payment method deleted");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async addCurrentUserPaymentMethod(
    request: FastifyRequest<{ Body: AddPaymentMethodRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }

      const { type, brand, last4, expMonth, expYear, billingAddressId, providerRef, isDefault } = request.body;

      const command: AddPaymentMethodCommand = {
        userId,
        type,
        brand,
        last4,
        expMonth,
        expYear,
        billingAddressId,
        providerRef,
        isDefault,
        timestamp: new Date(),
      };

      const result = await this.addPaymentMethodHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "Payment method added", 201);
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async getCurrentUserPaymentMethods(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }

      const query: ListPaymentMethodsQuery = { userId, timestamp: new Date() };
      const result = await this.listPaymentMethodsHandler.handle(query);
      ResponseHelper.fromQuery(reply, result, "Payment methods retrieved");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async updateCurrentUserPaymentMethod(
    request: FastifyRequest<{
      Params: { paymentMethodId: string };
      Body: UpdatePaymentMethodRequest;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }

      const { paymentMethodId } = request.params;
      const { billingAddressId, isDefault } = request.body;

      const command: UpdatePaymentMethodCommand = {
        paymentMethodId,
        userId,
        billingAddressId,
        isDefault,
        timestamp: new Date(),
      };

      const result = await this.updatePaymentMethodHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "Payment method updated");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async deleteCurrentUserPaymentMethod(
    request: FastifyRequest<{ Params: { paymentMethodId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }

      const { paymentMethodId } = request.params;

      await this.paymentMethodService.deletePaymentMethod(paymentMethodId, userId);
      ResponseHelper.ok(reply, "Payment method deleted", { paymentMethodId, userId });
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async setDefaultPaymentMethod(
    request: FastifyRequest<{ Params: { paymentMethodId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }

      const { paymentMethodId } = request.params;
      await this.paymentMethodService.setDefaultPaymentMethod(paymentMethodId, userId);
      ResponseHelper.ok(reply, "Default payment method updated");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }
}

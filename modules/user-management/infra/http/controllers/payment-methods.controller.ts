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

// Response DTOs
export interface PaymentMethodResponse {
  success: boolean;
  data?: {
    paymentMethodId: string;
    userId: string;
    type: string;
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    billingAddressId?: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  error?: string;
  errors?: string[];
}

export interface PaymentMethodListResponse {
  success: boolean;
  data?: {
    userId: string;
    paymentMethods: Array<{
      paymentMethodId: string;
      type: string;
      brand?: string;
      last4?: string;
      expMonth?: number;
      expYear?: number;
      billingAddressId?: string;
      isDefault: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
    totalCount: number;
  };
  error?: string;
  errors?: string[];
}

export interface PaymentMethodActionResponse {
  success: boolean;
  data?: {
    paymentMethodId: string;
    userId: string;
    action: "created" | "updated" | "deleted";
    message: string;
  };
  error?: string;
  errors?: string[];
}

export class PaymentMethodsController {
  private addPaymentMethodHandler?: AddPaymentMethodHandler;
  private updatePaymentMethodHandler?: UpdatePaymentMethodHandler;
  private deletePaymentMethodHandler?: DeletePaymentMethodHandler;
  private listPaymentMethodsHandler?: ListPaymentMethodsHandler;
  private paymentMethodService?: PaymentMethodService;

  constructor(paymentMethodService?: PaymentMethodService) {
    this.paymentMethodService = paymentMethodService;
    if (paymentMethodService) {
      this.addPaymentMethodHandler = new AddPaymentMethodHandler(
        paymentMethodService,
      );
      this.updatePaymentMethodHandler = new UpdatePaymentMethodHandler(
        paymentMethodService,
      );
      this.deletePaymentMethodHandler = new DeletePaymentMethodHandler(
        paymentMethodService,
      );
      this.listPaymentMethodsHandler = new ListPaymentMethodsHandler(
        paymentMethodService,
      );
    }
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

      // Validate required fields
      if (!userId || !type) {
        reply.status(400).send({
          success: false,
          error: "Required fields missing: userId, type",
          errors: ["userId", "type"],
        });
        return;
      }

      // For card payments, require additional fields
      if (type === "card" && (!last4 || !expMonth || !expYear)) {
        reply.status(400).send({
          success: false,
          error: "Card payments require last4, expMonth, and expYear",
          errors: ["last4", "expMonth", "expYear"],
        });
        return;
      }

      if (!this.addPaymentMethodHandler) {
        reply.status(501).send({
          success: false,
          error: "Payment method service not available",
        });
        return;
      }

      // Create command
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

      // Execute command
      const result = await this.addPaymentMethodHandler.handle(command);

      if (result.success) {
        reply.status(201).send({
          success: true,
          data: {
            ...result.data,
            action: "created" as const,
            message: "Payment method added successfully",
          },
        });
      } else {
        reply.status(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: "Internal server error while adding payment method",
      });
    }
  }

  async listPaymentMethods(
    request: FastifyRequest<{
      Params: { userId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;

      if (!userId) {
        reply.status(400).send({
          success: false,
          error: "User ID is required",
          errors: ["userId"],
        });
        return;
      }

      if (!this.listPaymentMethodsHandler) {
        reply.status(501).send({
          success: false,
          error: "Payment method service not available",
        });
        return;
      }

      // Create query
      const query: ListPaymentMethodsQuery = {
        userId,
        timestamp: new Date(),
      };

      // Execute query
      const result = await this.listPaymentMethodsHandler.handle(query);

      if (result.success) {
        reply.status(200).send({
          success: true,
          data: result.data,
        });
      } else {
        reply.status(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: "Internal server error while retrieving payment methods",
      });
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

      if (!userId || !paymentMethodId) {
        reply.status(400).send({
          success: false,
          error: "User ID and Payment Method ID are required",
          errors: ["userId", "paymentMethodId"],
        });
        return;
      }

      if (!this.updatePaymentMethodHandler) {
        reply.status(501).send({
          success: false,
          error: "Payment method service not available",
        });
        return;
      }

      // Create command
      const command: UpdatePaymentMethodCommand = {
        paymentMethodId,
        userId,
        billingAddressId,
        isDefault,
        timestamp: new Date(),
      };

      // Execute command
      const result = await this.updatePaymentMethodHandler.handle(command);

      if (result.success) {
        reply.status(200).send({
          success: true,
          data: {
            ...result.data,
            action: "updated" as const,
          },
        });
      } else {
        reply.status(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: "Internal server error while updating payment method",
      });
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

      if (!userId || !paymentMethodId) {
        reply.status(400).send({
          success: false,
          error: "User ID and Payment Method ID are required",
          errors: ["userId", "paymentMethodId"],
        });
        return;
      }

      if (!this.deletePaymentMethodHandler) {
        reply.status(501).send({
          success: false,
          error: "Payment method service not available",
        });
        return;
      }

      // Create command
      const command: DeletePaymentMethodCommand = {
        paymentMethodId,
        userId,
        timestamp: new Date(),
      };

      // Execute command
      const result = await this.deletePaymentMethodHandler.handle(command);

      if (result.success) {
        reply.status(200).send({
          success: true,
          data: {
            ...result.data,
            action: "deleted" as const,
          },
        });
      } else {
        reply.status(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: "Internal server error while deleting payment method",
      });
    }
  }

  async addCurrentUserPaymentMethod(
    request: FastifyRequest<{ Body: AddPaymentMethodRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      // Extract user ID from JWT token (assuming middleware sets it)
      const userId = (request as any).user?.userId;

      if (!userId) {
        reply.status(401).send({
          success: false,
          error: "Authentication required",
        });
        return;
      }

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

      // Validate required fields
      if (!type) {
        reply.status(400).send({
          success: false,
          error: "Payment method type is required",
          errors: ["type"],
        });
        return;
      }

      // For card payments, require additional fields
      if (type === "card" && (!last4 || !expMonth || !expYear)) {
        reply.status(400).send({
          success: false,
          error: "Card payments require last4, expMonth, and expYear",
          errors: ["last4", "expMonth", "expYear"],
        });
        return;
      }

      if (!this.addPaymentMethodHandler) {
        reply.status(501).send({
          success: false,
          error: "Payment method service not available",
        });
        return;
      }

      // Create command
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

      // Execute command
      const result = await this.addPaymentMethodHandler.handle(command);

      if (result.success) {
        reply.status(201).send({
          success: true,
          data: {
            ...result.data,
            action: "created" as const,
            message: "Payment method added successfully",
          },
        });
      } else {
        reply.status(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      reply.status(500).send({
        success: false,
        error:
          "Internal server error while adding payment method for current user",
      });
    }
  }

  async getCurrentUserPaymentMethods(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      // Extract user ID from JWT token (assuming middleware sets it)
      const userId = (request as any).user?.userId;

      if (!userId) {
        reply.status(401).send({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      if (!this.listPaymentMethodsHandler) {
        reply.status(501).send({
          success: false,
          error: "Payment method service not available",
        });
        return;
      }

      // Create query
      const query: ListPaymentMethodsQuery = {
        userId,
        timestamp: new Date(),
      };

      // Execute query
      const result = await this.listPaymentMethodsHandler.handle(query);

      if (result.success) {
        reply.status(200).send({
          success: true,
          data: result.data,
        });
      } else {
        reply.status(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      reply.status(500).send({
        success: false,
        error:
          "Internal server error while retrieving current user payment methods",
      });
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
      // Extract user ID from JWT token (assuming middleware sets it)
      const userId = (request as any).user?.userId;
      const { paymentMethodId } = request.params;

      if (!userId) {
        reply.status(401).send({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      if (!paymentMethodId) {
        reply.status(400).send({
          success: false,
          error: "Payment Method ID is required",
          errors: ["paymentMethodId"],
        });
        return;
      }

      if (!this.paymentMethodService) {
        reply.status(500).send({
          success: false,
          error: "Payment method service not available",
        });
        return;
      }

      const { billingAddressId, isDefault } = request.body;

      // Call the payment method service to update
      const result = await this.paymentMethodService.updatePaymentMethod({
        paymentMethodId,
        userId,
        billingAddressId,
        isDefault,
      });

      reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error:
          "Internal server error while updating current user payment method",
      });
    }
  }

  async deleteCurrentUserPaymentMethod(
    request: FastifyRequest<{
      Params: { paymentMethodId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      // Extract user ID from JWT token (assuming middleware sets it)
      const userId = (request as any).user?.userId;
      const { paymentMethodId } = request.params;

      if (!userId) {
        reply.status(401).send({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      if (!paymentMethodId) {
        reply.status(400).send({
          success: false,
          error: "Payment Method ID is required",
          errors: ["paymentMethodId"],
        });
        return;
      }

      if (!this.paymentMethodService) {
        reply.status(500).send({
          success: false,
          error: "Payment method service not available",
        });
        return;
      }

      // Call the payment method service to delete
      await this.paymentMethodService.deletePaymentMethod(
        paymentMethodId,
        userId,
      );

      reply.status(200).send({
        success: true,
        data: {
          paymentMethodId,
          userId,
          action: "deleted" as const,
          message: "Payment method deleted successfully",
        },
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error:
          "Internal server error while deleting current user payment method",
      });
    }
  }

  async setDefaultPaymentMethod(
    request: FastifyRequest<{
      Params: { paymentMethodId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      const { paymentMethodId } = request.params;

      if (!userId) {
        reply.status(401).send({ success: false, error: "Authentication required" });
        return;
      }

      if (!paymentMethodId) {
        reply.status(400).send({ success: false, error: "Payment Method ID is required", errors: ["paymentMethodId"] });
        return;
      }

      if (!this.paymentMethodService) {
        reply.status(500).send({ success: false, error: "Payment method service not available" });
        return;
      }

      await this.paymentMethodService.setDefaultPaymentMethod(paymentMethodId, userId);

      reply.status(200).send({
        success: true,
        message: "Default payment method updated successfully",
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: "Internal server error while setting default payment method",
      });
    }
  }
}

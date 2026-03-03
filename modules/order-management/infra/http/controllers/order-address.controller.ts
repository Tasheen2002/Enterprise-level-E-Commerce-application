import { FastifyRequest, FastifyReply } from "fastify";
import {
  SetOrderAddressesCommand,
  SetOrderAddressesCommandHandler,
  UpdateBillingAddressCommand,
  UpdateBillingAddressCommandHandler,
  UpdateShippingAddressCommand,
  UpdateShippingAddressCommandHandler,
  GetOrderAddressesQuery,
  GetOrderAddressesHandler,
  OrderManagementService,
} from "../../../application";

interface AddressData {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

interface SetAddressesRequest {
  Params: { orderId: string };
  Body: {
    billingAddress: AddressData;
    shippingAddress: AddressData;
  };
}

interface UpdateBillingAddressRequest {
  Params: { orderId: string };
  Body: AddressData;
}

interface UpdateShippingAddressRequest {
  Params: { orderId: string };
  Body: AddressData;
}

interface GetAddressesRequest {
  Params: { orderId: string };
}

export class OrderAddressController {
  private setAddressesHandler: SetOrderAddressesCommandHandler;
  private updateBillingAddressHandler: UpdateBillingAddressCommandHandler;
  private updateShippingAddressHandler: UpdateShippingAddressCommandHandler;
  private getAddressesHandler: GetOrderAddressesHandler;

  constructor(orderManagementService: OrderManagementService) {
    this.setAddressesHandler = new SetOrderAddressesCommandHandler(orderManagementService);
    this.updateBillingAddressHandler = new UpdateBillingAddressCommandHandler(orderManagementService);
    this.updateShippingAddressHandler = new UpdateShippingAddressCommandHandler(orderManagementService);
    this.getAddressesHandler = new GetOrderAddressesHandler(orderManagementService);
  }

  async setAddresses(
    request: FastifyRequest<SetAddressesRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;
      const { billingAddress, shippingAddress } = request.body;

      const command: SetOrderAddressesCommand = {
        orderId,
        billingAddress,
        shippingAddress,
      };

      const result = await this.setAddressesHandler.handle(command);

      if (result.success) {
        return reply.code(201).send({
          success: true,
          data: {
            orderId: result.data?.getOrderId(),
            billingAddress: result.data?.getBillingAddress().toJSON(),
            shippingAddress: result.data?.getShippingAddress().toJSON(),
            isSameAddress: result.data?.isSameAddress(),
          },
          message: "Order addresses set successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to set order addresses");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getAddresses(
    request: FastifyRequest<GetAddressesRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;

      const query: GetOrderAddressesQuery = { orderId };
      const result = await this.getAddressesHandler.handle(query);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(404).send({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get order addresses");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async updateBillingAddress(
    request: FastifyRequest<UpdateBillingAddressRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;

      const command: UpdateBillingAddressCommand = {
        orderId,
        billingAddress: request.body,
      };

      const result = await this.updateBillingAddressHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: {
            orderId: result.data?.getOrderId(),
            billingAddress: result.data?.getBillingAddress().toJSON(),
            shippingAddress: result.data?.getShippingAddress().toJSON(),
            isSameAddress: result.data?.isSameAddress(),
          },
          message: "Billing address updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update billing address");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async updateShippingAddress(
    request: FastifyRequest<UpdateShippingAddressRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { orderId } = request.params;

      const command: UpdateShippingAddressCommand = {
        orderId,
        shippingAddress: request.body,
      };

      const result = await this.updateShippingAddressHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: {
            orderId: result.data?.getOrderId(),
            billingAddress: result.data?.getBillingAddress().toJSON(),
            shippingAddress: result.data?.getShippingAddress().toJSON(),
            isSameAddress: result.data?.isSameAddress(),
          },
          message: "Shipping address updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update shipping address");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }
}

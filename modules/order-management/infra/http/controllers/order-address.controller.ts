import { FastifyRequest, FastifyReply } from "fastify";
import { ResponseHelper } from "@/api/src/shared/response.helper";
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

export interface AddressData {
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

export interface SetAddressesRequest {
  Params: { orderId: string };
  Body: {
    billingAddress: AddressData;
    shippingAddress: AddressData;
  };
}

export interface UpdateBillingAddressRequest {
  Params: { orderId: string };
  Body: AddressData;
}

export interface UpdateShippingAddressRequest {
  Params: { orderId: string };
  Body: AddressData;
}

export interface GetAddressesRequest {
  Params: { orderId: string };
}

export class OrderAddressController {
  private setAddressesHandler: SetOrderAddressesCommandHandler;
  private updateBillingAddressHandler: UpdateBillingAddressCommandHandler;
  private updateShippingAddressHandler: UpdateShippingAddressCommandHandler;
  private getAddressesHandler: GetOrderAddressesHandler;

  constructor(orderManagementService: OrderManagementService) {
    this.setAddressesHandler = new SetOrderAddressesCommandHandler(
      orderManagementService,
    );
    this.updateBillingAddressHandler = new UpdateBillingAddressCommandHandler(
      orderManagementService,
    );
    this.updateShippingAddressHandler = new UpdateShippingAddressCommandHandler(
      orderManagementService,
    );
    this.getAddressesHandler = new GetOrderAddressesHandler(
      orderManagementService,
    );
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

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Order addresses set successfully",
        201,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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

      return ResponseHelper.fromQuery(
        reply,
        result,
        "Order addresses retrieved successfully",
        "Order addresses not found",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Billing address updated successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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

      return ResponseHelper.fromCommand(
        reply,
        result,
        "Shipping address updated successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}

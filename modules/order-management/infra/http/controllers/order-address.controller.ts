import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  SetOrderAddressesCommand,
  SetOrderAddressesCommandHandler,
  UpdateBillingAddressCommand,
  UpdateBillingAddressCommandHandler,
  UpdateShippingAddressCommand,
  UpdateShippingAddressCommandHandler,
  GetOrderAddressQuery,
  GetOrderAddressHandler,
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
  constructor(
    private readonly setAddressesHandler: SetOrderAddressesCommandHandler,
    private readonly updateBillingAddressHandler: UpdateBillingAddressCommandHandler,
    private readonly updateShippingAddressHandler: UpdateShippingAddressCommandHandler,
    private readonly getAddressesHandler: GetOrderAddressHandler,
  ) {}

  async setAddresses(
    request: AuthenticatedRequest<SetAddressesRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: SetOrderAddressesCommand = {
        orderId: request.params.orderId,
        billingAddress: request.body.billingAddress,
        shippingAddress: request.body.shippingAddress,
      };
      const result = await this.setAddressesHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Order addresses set successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getAddresses(
    request: AuthenticatedRequest<GetAddressesRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const query: GetOrderAddressQuery = { orderId: request.params.orderId };
      const result = await this.getAddressesHandler.handle(query);
      return ResponseHelper.ok(reply, "Order addresses retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateBillingAddress(
    request: AuthenticatedRequest<UpdateBillingAddressRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: UpdateBillingAddressCommand = {
        orderId: request.params.orderId,
        billingAddress: request.body,
      };
      const result = await this.updateBillingAddressHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Billing address updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateShippingAddress(
    request: AuthenticatedRequest<UpdateShippingAddressRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const command: UpdateShippingAddressCommand = {
        orderId: request.params.orderId,
        shippingAddress: request.body,
      };
      const result = await this.updateShippingAddressHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Shipping address updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}

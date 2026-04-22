import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  SetOrderAddressesHandler,
  UpdateBillingAddressHandler,
  UpdateShippingAddressHandler,
  GetOrderAddressHandler,
} from "../../../application";
import {
  OrderAddressParams,
  SetOrderAddressesBody,
  UpdateBillingAddressBody,
  UpdateShippingAddressBody,
} from "../validation/order-address.schema";

export class OrderAddressController {
  constructor(
    private readonly setAddressesHandler: SetOrderAddressesHandler,
    private readonly updateBillingAddressHandler: UpdateBillingAddressHandler,
    private readonly updateShippingAddressHandler: UpdateShippingAddressHandler,
    private readonly getAddressesHandler: GetOrderAddressHandler,
  ) {}

  async setAddresses(
    request: AuthenticatedRequest<{ Params: OrderAddressParams; Body: SetOrderAddressesBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.setAddressesHandler.handle({
        orderId: request.params.orderId,
        billingAddress: request.body.billingAddress,
        shippingAddress: request.body.shippingAddress,
      });
      return ResponseHelper.fromCommand(reply, result, "Order addresses set successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getAddresses(
    request: AuthenticatedRequest<{ Params: OrderAddressParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getAddressesHandler.handle({ orderId: request.params.orderId });
      return ResponseHelper.ok(reply, "Order addresses retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateBillingAddress(
    request: AuthenticatedRequest<{ Params: OrderAddressParams; Body: UpdateBillingAddressBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateBillingAddressHandler.handle({
        orderId: request.params.orderId,
        billingAddress: request.body,
      });
      return ResponseHelper.fromCommand(reply, result, "Billing address updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateShippingAddress(
    request: AuthenticatedRequest<{ Params: OrderAddressParams; Body: UpdateShippingAddressBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateShippingAddressHandler.handle({
        orderId: request.params.orderId,
        shippingAddress: request.body,
      });
      return ResponseHelper.fromCommand(reply, result, "Shipping address updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}

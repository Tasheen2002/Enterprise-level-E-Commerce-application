import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import { hasRole, STAFF_ROLES } from "@/api/src/shared/middleware";
import {
  CreateShipmentHandler,
  UpdateShipmentTrackingHandler,
  MarkShipmentShippedHandler,
  MarkShipmentDeliveredHandler,
  ListOrderShipmentsHandler,
  GetShipmentHandler,
} from "../../../application";
import {
  OrderShipmentsParams,
  OrderShipmentParams,
  CreateShipmentBody,
  MarkShippedBody,
  UpdateShipmentTrackingBody,
  MarkDeliveredBody,
} from "../validation/order-shipment.schema";

export class OrderShipmentController {
  constructor(
    private readonly createShipmentHandler: CreateShipmentHandler,
    private readonly updateTrackingHandler: UpdateShipmentTrackingHandler,
    private readonly markShippedHandler: MarkShipmentShippedHandler,
    private readonly markDeliveredHandler: MarkShipmentDeliveredHandler,
    private readonly listOrderShipmentsHandler: ListOrderShipmentsHandler,
    private readonly getShipmentHandler: GetShipmentHandler,
  ) {}

  // ── Reads ──

  async getShipments(
    request: AuthenticatedRequest<{ Params: OrderShipmentsParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listOrderShipmentsHandler.handle({
        orderId: request.params.orderId,
        requestingUserId: request.user.userId,
        isStaff: hasRole(request, [...STAFF_ROLES]),
      });
      return ResponseHelper.ok(reply, "Shipments retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getShipment(
    request: AuthenticatedRequest<{ Params: OrderShipmentParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getShipmentHandler.handle({
        orderId: request.params.orderId,
        shipmentId: request.params.shipmentId,
        requestingUserId: request.user.userId,
        isStaff: hasRole(request, [...STAFF_ROLES]),
      });
      return ResponseHelper.ok(reply, "Shipment retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // ── Writes ──

  async createShipment(
    request: AuthenticatedRequest<{ Params: OrderShipmentsParams; Body: CreateShipmentBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { carrier, service, trackingNumber, giftReceipt, pickupLocationId } = request.body;
      const result = await this.createShipmentHandler.handle({
        orderId: request.params.orderId,
        carrier,
        service,
        trackingNumber,
        giftReceipt,
        pickupLocationId,
      });
      return ResponseHelper.fromCommand(reply, result, "Shipment created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async markShipped(
    request: AuthenticatedRequest<{ Params: OrderShipmentParams; Body: MarkShippedBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { carrier, service, trackingNumber } = request.body;
      const result = await this.markShippedHandler.handle({
        orderId: request.params.orderId,
        shipmentId: request.params.shipmentId,
        carrier,
        service,
        trackingNumber,
      });
      return ResponseHelper.fromCommand(reply, result, "Shipment marked as shipped successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateTracking(
    request: AuthenticatedRequest<{ Params: OrderShipmentParams; Body: UpdateShipmentTrackingBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { trackingNumber, carrier, service } = request.body;
      const result = await this.updateTrackingHandler.handle({
        orderId: request.params.orderId,
        shipmentId: request.params.shipmentId,
        trackingNumber,
        carrier,
        service,
      });
      return ResponseHelper.fromCommand(reply, result, "Shipment tracking updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async markDelivered(
    request: AuthenticatedRequest<{ Params: OrderShipmentParams; Body: MarkDeliveredBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.markDeliveredHandler.handle({
        orderId: request.params.orderId,
        shipmentId: request.params.shipmentId,
        deliveredAt: request.body.deliveredAt,
      });
      return ResponseHelper.fromCommand(reply, result, "Shipment marked as delivered successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}

import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreatePickupReservationHandler,
  CancelPickupReservationHandler,
  GetPickupReservationHandler,
  ListPickupReservationsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreatePickupReservationBody,
  ListPickupReservationsQuery,
} from "../validation/pickup-reservation.schema";

export class PickupReservationController {
  constructor(
    private readonly createReservationHandler: CreatePickupReservationHandler,
    private readonly cancelReservationHandler: CancelPickupReservationHandler,
    private readonly getReservationHandler: GetPickupReservationHandler,
    private readonly listReservationsHandler: ListPickupReservationsHandler,
  ) {}

  async getReservation(
    request: AuthenticatedRequest<{ Params: { reservationId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;
      const result = await this.getReservationHandler.handle({ reservationId });
      return ResponseHelper.ok(reply, "Reservation retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listReservations(
    request: AuthenticatedRequest<{ Querystring: ListPickupReservationsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId, locationId, activeOnly } = request.query;
      const result = await this.listReservationsHandler.handle({ orderId, locationId, activeOnly });
      return ResponseHelper.ok(reply, "Reservations retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createReservation(
    request: AuthenticatedRequest<{ Body: CreatePickupReservationBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId, variantId, locationId, qty, expirationMinutes } = request.body;
      const result = await this.createReservationHandler.handle({
        orderId,
        variantId,
        locationId,
        qty,
        expirationMinutes,
      });
      return ResponseHelper.fromCommand(reply, result, "Reservation created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async cancelReservation(
    request: AuthenticatedRequest<{ Params: { reservationId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;
      const result = await this.cancelReservationHandler.handle({ reservationId });
      return ResponseHelper.fromCommand(reply, result, "Reservation cancelled successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}

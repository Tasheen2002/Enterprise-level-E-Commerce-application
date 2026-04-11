import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreatePickupReservationHandler,
  CancelPickupReservationHandler,
  GetPickupReservationHandler,
  ListPickupReservationsHandler,
} from "../../../application";
import { PickupReservationService } from "../../../application/services/pickup-reservation.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class PickupReservationController {
  private createReservationHandler: CreatePickupReservationHandler;
  private cancelReservationHandler: CancelPickupReservationHandler;
  private getReservationHandler: GetPickupReservationHandler;
  private listReservationsHandler: ListPickupReservationsHandler;

  constructor(reservationService: PickupReservationService) {
    this.createReservationHandler = new CreatePickupReservationHandler(reservationService);
    this.cancelReservationHandler = new CancelPickupReservationHandler(reservationService);
    this.getReservationHandler = new GetPickupReservationHandler(reservationService);
    this.listReservationsHandler = new ListPickupReservationsHandler(reservationService);
  }

  async getReservation(
    request: AuthenticatedRequest<{
      Params: { reservationId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;
      const result = await this.getReservationHandler.handle({ reservationId });
      return ResponseHelper.fromQuery(reply, result, "Reservation retrieved", "Reservation not found");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listReservations(
    request: AuthenticatedRequest<{
      Querystring: { orderId?: string; locationId?: string; activeOnly?: boolean };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId, locationId, activeOnly } = request.query;
      const result = await this.listReservationsHandler.handle({
        orderId,
        locationId,
        activeOnly: activeOnly ?? true,
      });
      return ResponseHelper.fromQuery(reply, result, "Reservations retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createReservation(
    request: AuthenticatedRequest<{
      Body: {
        orderId: string;
        variantId: string;
        locationId: string;
        qty: number;
        expirationMinutes?: number;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createReservationHandler.handle(request.body);
      if (result.success && result.data) {
        return ResponseHelper.created(reply, "Reservation created successfully", result.data);
      }
      return ResponseHelper.badRequest(reply, result.error || "Failed to create reservation");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async cancelReservation(
    request: AuthenticatedRequest<{
      Params: { reservationId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;
      const result = await this.cancelReservationHandler.handle({ reservationId });
      return ResponseHelper.fromCommand(reply, result, "Reservation cancelled successfully", undefined, 204);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}

import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreatePickupReservationCommand,
  CreatePickupReservationHandler,
  CancelPickupReservationCommand,
  CancelPickupReservationHandler,
  GetPickupReservationQuery,
  GetPickupReservationHandler,
  ListPickupReservationsQuery,
  ListPickupReservationsHandler,
} from "../../../application";
import { PickupReservationService } from "../../../application/services/pickup-reservation.service";

export class PickupReservationController {
  private createReservationHandler: CreatePickupReservationHandler;
  private cancelReservationHandler: CancelPickupReservationHandler;
  private getReservationHandler: GetPickupReservationHandler;
  private listReservationsHandler: ListPickupReservationsHandler;

  constructor(private readonly reservationService: PickupReservationService) {
    this.createReservationHandler = new CreatePickupReservationHandler(
      reservationService,
    );
    this.cancelReservationHandler = new CancelPickupReservationHandler(
      reservationService,
    );
    this.getReservationHandler = new GetPickupReservationHandler(
      reservationService,
    );
    this.listReservationsHandler = new ListPickupReservationsHandler(
      reservationService,
    );
  }

  async getReservation(
    request: FastifyRequest<{ Params: { reservationId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;
      const query: GetPickupReservationQuery = { reservationId };
      const result = await this.getReservationHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({ success: true, data: result.data });
      } else if (result.success && result.data === null) {
        return reply
          .code(404)
          .send({ success: false, error: "Reservation not found" });
      } else {
        return reply
          .code(400)
          .send({ success: false, error: result.error });
      }
    } catch (error) {
      request.log.error(error, "Failed to get reservation");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
    }
  }

  async listReservations(request: FastifyRequest, reply: FastifyReply) {
    try {
      const queryParams = request.query as any;
      let activeOnly: boolean = true; // Default to true as per schema
      if (typeof queryParams.activeOnly !== "undefined") {
        if (typeof queryParams.activeOnly === "boolean") {
          activeOnly = queryParams.activeOnly;
        } else if (typeof queryParams.activeOnly === "string") {
          activeOnly =
            queryParams.activeOnly === "true" || queryParams.activeOnly === "1";
        }
      }
      const query: ListPickupReservationsQuery = {
        orderId: queryParams.orderId,
        locationId: queryParams.locationId,
        activeOnly,
      };
      const result = await this.listReservationsHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({ success: true, data: result.data });
      } else {
        return reply
          .code(400)
          .send({ success: false, error: result.error });
      }
    } catch (error) {
      request.log.error(error, "Failed to list reservations");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
    }
  }

  async createReservation(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const command: CreatePickupReservationCommand = {
        orderId: body.orderId,
        variantId: body.variantId,
        locationId: body.locationId,
        qty: body.qty,
        expirationMinutes: body.expirationMinutes,
      };

      const result = await this.createReservationHandler.handle(command);

      if (result.success && result.data) {
        const reservation = result.data;
        return reply.code(201).send({
          success: true,
          data: {
            reservationId: reservation.getReservationId().getValue(),
            orderId: reservation.getOrderId(),
            variantId: reservation.getVariantId(),
            locationId: reservation.getLocationId(),
            qty: reservation.getQty(),
            expiresAt: reservation.getExpiresAt(),
          },
          message: "Reservation created successfully",
        });
      } else {
        return reply
          .code(400)
          .send({ success: false, error: result.error, errors: result.errors });
      }
    } catch (error) {
      request.log.error(error, "Failed to create reservation");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
    }
  }

  async cancelReservation(
    request: FastifyRequest<{ Params: { reservationId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;
      const command: CancelPickupReservationCommand = { reservationId };

      const result = await this.cancelReservationHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Reservation cancelled successfully",
        });
      } else {
        return reply
          .code(400)
          .send({ success: false, error: result.error, errors: result.errors });
      }
    } catch (error) {
      request.log.error(error, "Failed to cancel reservation");
      return reply
        .code(500)
        .send({ success: false, error: "Internal server error" });
    }
  }
}

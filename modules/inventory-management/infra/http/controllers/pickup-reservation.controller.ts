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
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface ListReservationsQuerystring {
  orderId?: string;
  locationId?: string;
  activeOnly?: boolean | string;
}

export interface CreateReservationBody {
  orderId: string;
  variantId: string;
  locationId: string;
  qty: number;
  expirationMinutes?: number;
}

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
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Reservation retrieved",
        "Reservation not found",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listReservations(
    request: FastifyRequest<{ Querystring: ListReservationsQuerystring }>,
    reply: FastifyReply,
  ) {
    try {
      const queryParams = request.query;
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
      return ResponseHelper.fromQuery(reply, result, "Reservations retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createReservation(
    request: FastifyRequest<{ Body: CreateReservationBody }>,
    reply: FastifyReply,
  ) {
    try {
      const body = request.body;
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
        return ResponseHelper.created(
          reply,
          "Reservation created successfully",
          {
            reservationId: reservation.getReservationId().getValue(),
            orderId: reservation.getOrderId(),
            variantId: reservation.getVariantId(),
            locationId: reservation.getLocationId(),
            qty: reservation.getQty(),
            expiresAt: reservation.getExpiresAt(),
          },
        );
      }
      return ResponseHelper.badRequest(
        reply,
        result.error || "Failed to create reservation",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Reservation cancelled successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}

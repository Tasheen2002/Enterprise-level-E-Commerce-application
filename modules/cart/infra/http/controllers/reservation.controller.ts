import { FastifyRequest, FastifyReply } from "fastify";
import {
  ReservationService,
  CreateReservationCommand,
  CreateReservationHandler,
  GetReservationsQuery,
  GetReservationsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";

// Request interfaces
interface CreateReservationRequest {
  cartId: string;
  variantId: string;
  quantity: number;
  durationMinutes?: number;
}

interface ExtendReservationRequest {
  additionalMinutes: number;
}

interface RenewReservationRequest {
  durationMinutes?: number;
}

interface AdjustReservationRequest {
  newQuantity: number;
}

interface BulkReservationRequest {
  cartId: string;
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
  durationMinutes?: number;
}

interface CheckAvailabilityRequest {
  variantId: string;
  requestedQuantity: number;
}

interface ReservationQueryParams {
  status?: "active" | "expiring_soon" | "expired" | "recently_expired";
  thresholdMinutes?: number;
}

export class ReservationController {
  private createReservationHandler: CreateReservationHandler;
  private getReservationsHandler: GetReservationsHandler;

  constructor(private readonly reservationService: ReservationService) {
    this.createReservationHandler = new CreateReservationHandler(reservationService);
    this.getReservationsHandler = new GetReservationsHandler(reservationService);
  }

  async createReservation(
    request: FastifyRequest<{ Body: CreateReservationRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const reservationData = request.body;

      const command: CreateReservationCommand = {
        cartId: reservationData.cartId,
        variantId: reservationData.variantId,
        quantity: reservationData.quantity,
        durationMinutes: reservationData.durationMinutes,
      };

      const result = await this.createReservationHandler.handle(command);
      return ResponseHelper.fromCommand(reply, result, "Reservation created successfully", 201);
    } catch (error) {
      request.log.error(error, "Failed to create reservation");
      return ResponseHelper.error(reply, error);
    }
  }

  async getReservation(
    request: FastifyRequest<{ Params: { reservationId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;

      const reservation = await this.reservationService.getReservation(reservationId);

      if (!reservation) {
        return ResponseHelper.notFound(reply, "Reservation not found");
      }

      return ResponseHelper.ok(reply, "Reservation retrieved", reservation);
    } catch (error) {
      request.log.error(error, "Failed to get reservation");
      return ResponseHelper.error(reply, error);
    }
  }

  async getCartReservations(
    request: FastifyRequest<{
      Params: { cartId: string };
      Querystring: { activeOnly?: boolean };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId } = request.params;
      const { activeOnly } = request.query;

      const query: GetReservationsQuery = { cartId, activeOnly };
      const result = await this.getReservationsHandler.handle(query);

      return ResponseHelper.fromQuery(reply, result, "Reservations retrieved");
    } catch (error) {
      request.log.error(error, "Failed to get cart reservations");
      return ResponseHelper.error(reply, error);
    }
  }

  async getVariantReservations(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const reservations = await this.reservationService.getVariantReservations(variantId);

      return ResponseHelper.ok(reply, "Variant reservations retrieved", reservations);
    } catch (error) {
      request.log.error(error, "Failed to get variant reservations");
      return ResponseHelper.error(reply, error);
    }
  }

  async extendReservation(
    request: FastifyRequest<{
      Params: { reservationId: string };
      Body: ExtendReservationRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;
      const { additionalMinutes } = request.body;

      const reservation = await this.reservationService.extendReservation({
        reservationId,
        additionalMinutes,
      });

      return ResponseHelper.ok(reply, "Reservation extended successfully", reservation);
    } catch (error) {
      request.log.error(error, "Failed to extend reservation");
      return ResponseHelper.error(reply, error);
    }
  }

  async renewReservation(
    request: FastifyRequest<{
      Params: { reservationId: string };
      Body: RenewReservationRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;
      const { durationMinutes } = request.body;

      const reservation = await this.reservationService.renewReservation({
        reservationId,
        durationMinutes,
      });

      return ResponseHelper.ok(reply, "Reservation renewed successfully", reservation);
    } catch (error) {
      request.log.error(error, "Failed to renew reservation");
      return ResponseHelper.error(reply, error);
    }
  }

  async releaseReservation(
    request: FastifyRequest<{ Params: { reservationId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;

      const success = await this.reservationService.releaseReservation(reservationId);

      if (!success) {
        return ResponseHelper.notFound(reply, "Reservation not found");
      }

      return ResponseHelper.ok(reply, "Reservation released successfully");
    } catch (error) {
      request.log.error(error, "Failed to release reservation");
      return ResponseHelper.error(reply, error);
    }
  }

  async adjustReservation(
    request: FastifyRequest<{
      Params: { cartId: string; variantId: string };
      Body: AdjustReservationRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId, variantId } = request.params;
      const { newQuantity } = request.body;

      const reservation = await this.reservationService.adjustReservation({
        cartId,
        variantId,
        newQuantity,
      });

      if (!reservation) {
        return ResponseHelper.notFound(reply, "Reservation not found");
      }

      return ResponseHelper.ok(reply, "Reservation adjusted successfully", reservation);
    } catch (error) {
      request.log.error(error, "Failed to adjust reservation");
      return ResponseHelper.error(reply, error);
    }
  }

  async checkAvailability(
    request: FastifyRequest<{ Querystring: CheckAvailabilityRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, requestedQuantity } = request.query;

      const availability = await this.reservationService.checkAvailability(variantId, requestedQuantity);

      return ResponseHelper.ok(reply, "Availability checked", availability);
    } catch (error) {
      request.log.error(error, "Failed to check availability");
      return ResponseHelper.error(reply, error);
    }
  }

  async getTotalReservedQuantity(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const totalReserved = await this.reservationService.getTotalReservedQuantity(variantId);

      return ResponseHelper.ok(reply, "Total reserved quantity retrieved", { variantId, totalReserved });
    } catch (error) {
      request.log.error(error, "Failed to get total reserved quantity");
      return ResponseHelper.error(reply, error);
    }
  }

  async getActiveReservedQuantity(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const activeReserved = await this.reservationService.getActiveReservedQuantity(variantId);

      return ResponseHelper.ok(reply, "Active reserved quantity retrieved", { variantId, activeReserved });
    } catch (error) {
      request.log.error(error, "Failed to get active reserved quantity");
      return ResponseHelper.error(reply, error);
    }
  }

  async createBulkReservations(
    request: FastifyRequest<{ Body: BulkReservationRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const bulkData = request.body;

      const result = await this.reservationService.createBulkReservations({
        cartId: bulkData.cartId,
        items: bulkData.items,
        durationMinutes: bulkData.durationMinutes,
      });

      const allSucceeded = result.totalFailed === 0;
      const statusCode = allSucceeded ? 201 : 207;
      const message = allSucceeded
        ? "All reservations created successfully"
        : `${result.totalCreated} reservation(s) created, ${result.totalFailed} failed`;

      return ResponseHelper.success(reply, statusCode, message, result);
    } catch (error) {
      request.log.error(error, "Failed to create bulk reservations");
      return ResponseHelper.error(reply, error);
    }
  }

  async getReservationStatistics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const statistics = await this.reservationService.getReservationStatistics();
      return ResponseHelper.ok(reply, "Reservation statistics retrieved", statistics);
    } catch (error) {
      request.log.error(error, "Failed to get reservation statistics");
      return ResponseHelper.error(reply, error);
    }
  }

  async getReservationsByStatus(
    request: FastifyRequest<{ Querystring: ReservationQueryParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { status } = request.query;

      const reservations = await this.reservationService.getReservationsByStatus(status!);

      return ResponseHelper.ok(reply, "Reservations retrieved", reservations);
    } catch (error) {
      request.log.error(error, "Failed to get reservations by status");
      return ResponseHelper.error(reply, error);
    }
  }

  async resolveReservationConflicts(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      const result = await this.reservationService.resolveReservationConflicts(variantId);

      return ResponseHelper.ok(reply, `Resolved ${result.resolved} conflict(s)`, result);
    } catch (error) {
      request.log.error(error, "Failed to resolve reservation conflicts");
      return ResponseHelper.error(reply, error);
    }
  }

  async optimizeReservations(request: FastifyRequest, reply: FastifyReply) {
    try {
      const optimizedCount = await this.reservationService.optimizeReservations();

      return ResponseHelper.ok(reply, `Successfully optimized ${optimizedCount} reservation(s)`, { optimizedCount });
    } catch (error) {
      request.log.error(error, "Failed to optimize reservations");
      return ResponseHelper.error(reply, error);
    }
  }
}

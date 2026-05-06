import { FastifyReply } from "fastify";
import {
  CreateReservationHandler,
  ExtendReservationHandler,
  RenewReservationHandler,
  ReleaseReservationHandler,
  AdjustReservationHandler,
  CreateBulkReservationsHandler,
  ResolveReservationConflictsHandler,
  GetReservationsHandler,
  GetReservationHandler,
  GetReservationByVariantHandler,
  GetVariantReservationsHandler,
  CheckAvailabilityHandler,
  GetReservedQuantityHandler,
  GetReservationStatisticsHandler,
  GetReservationsByStatusHandler,
} from "../../../application";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  ReservationIdParams,
  CartIdParams,
  VariantIdParams,
  CartReservationParams,
  CartReservationsQuery,
  CheckAvailabilityQuery,
  ReservationsByStatusQuery,
  CreateReservationBody,
  ExtendReservationBody,
  RenewReservationBody,
  AdjustReservationBody,
  CreateBulkReservationsBody,
} from "../validation/reservation.schema";

export class ReservationController {
  constructor(
    private readonly createReservationHandler: CreateReservationHandler,
    private readonly extendReservationHandler: ExtendReservationHandler,
    private readonly renewReservationHandler: RenewReservationHandler,
    private readonly releaseReservationHandler: ReleaseReservationHandler,
    private readonly adjustReservationHandler: AdjustReservationHandler,
    private readonly createBulkReservationsHandler: CreateBulkReservationsHandler,
    private readonly resolveReservationConflictsHandler: ResolveReservationConflictsHandler,
    private readonly getReservationsHandler: GetReservationsHandler,
    private readonly getReservationHandler: GetReservationHandler,
    private readonly getReservationByVariantHandler: GetReservationByVariantHandler,
    private readonly getVariantReservationsHandler: GetVariantReservationsHandler,
    private readonly checkAvailabilityHandler: CheckAvailabilityHandler,
    private readonly getReservedQuantityHandler: GetReservedQuantityHandler,
    private readonly getReservationStatisticsHandler: GetReservationStatisticsHandler,
    private readonly getReservationsByStatusHandler: GetReservationsByStatusHandler,
  ) {}

  // ── Reads (queries) ────────────────────────────────────────────────

  async getReservation(
    request: AuthenticatedRequest<{ Params: ReservationIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;
      const result = await this.getReservationHandler.handle({ reservationId });
      if (result === null) return ResponseHelper.notFound(reply, "Reservation not found");
      return ResponseHelper.ok(reply, "Reservation retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getCartReservations(
    request: AuthenticatedRequest<{ Params: CartIdParams; Querystring: CartReservationsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId } = request.params;
      const { activeOnly } = request.query;
      const result = await this.getReservationsHandler.handle({ cartId, activeOnly });
      return ResponseHelper.ok(reply, "Reservations retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getVariantReservations(
    request: AuthenticatedRequest<{ Params: VariantIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const result = await this.getVariantReservationsHandler.handle({ variantId });
      return ResponseHelper.ok(reply, "Variant reservations retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getReservationByVariant(
    request: AuthenticatedRequest<{ Params: CartReservationParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId, variantId } = request.params;
      const result = await this.getReservationByVariantHandler.handle({ cartId, variantId });
      if (result === null) return ResponseHelper.notFound(reply, "Reservation not found");
      return ResponseHelper.ok(reply, "Reservation retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async checkAvailability(
    request: AuthenticatedRequest<{ Querystring: CheckAvailabilityQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, requestedQuantity } = request.query;
      const result = await this.checkAvailabilityHandler.handle({ variantId, requestedQuantity });
      return ResponseHelper.ok(reply, "Availability checked", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getTotalReservedQuantity(
    request: AuthenticatedRequest<{ Params: VariantIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const result = await this.getReservedQuantityHandler.handle({ variantId, activeOnly: false });
      return ResponseHelper.ok(reply, "Total reserved quantity retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getActiveReservedQuantity(
    request: AuthenticatedRequest<{ Params: VariantIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const result = await this.getReservedQuantityHandler.handle({ variantId, activeOnly: true });
      return ResponseHelper.ok(reply, "Active reserved quantity retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getReservationStatistics(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getReservationStatisticsHandler.handle({});
      return ResponseHelper.ok(reply, "Reservation statistics retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getReservationsByStatus(
    request: AuthenticatedRequest<{ Querystring: ReservationsByStatusQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { status } = request.query;
      const result = await this.getReservationsByStatusHandler.handle({ status: status! });
      return ResponseHelper.ok(reply, "Reservations retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // ── Writes (commands) ──────────────────────────────────────────────

  async createReservation(
    request: AuthenticatedRequest<{ Body: CreateReservationBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId, variantId, quantity, durationMinutes } = request.body;
      const result = await this.createReservationHandler.handle({ cartId, variantId, quantity, durationMinutes });
      return ResponseHelper.fromCommand(reply, result, "Reservation created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createBulkReservations(
    request: AuthenticatedRequest<{ Body: CreateBulkReservationsBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId, items, durationMinutes } = request.body;
      const result = await this.createBulkReservationsHandler.handle({ cartId, items, durationMinutes });
      const allSucceeded = result.data?.totalFailed === 0;
      if (allSucceeded) {
        return ResponseHelper.created(reply, "All reservations created successfully", result.data);
      }
      return ResponseHelper.success(
        reply,
        207,
        "Bulk reservation completed with partial failures",
        result.data,
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async extendReservation(
    request: AuthenticatedRequest<{ Params: ReservationIdParams; Body: ExtendReservationBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;
      const { additionalMinutes } = request.body;
      const result = await this.extendReservationHandler.handle({ reservationId, additionalMinutes });
      return ResponseHelper.fromCommand(reply, result, "Reservation extended successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async renewReservation(
    request: AuthenticatedRequest<{ Params: ReservationIdParams; Body: RenewReservationBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;
      const { durationMinutes } = request.body;
      const result = await this.renewReservationHandler.handle({ reservationId, durationMinutes });
      return ResponseHelper.fromCommand(reply, result, "Reservation renewed successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async adjustReservation(
    request: AuthenticatedRequest<{ Params: CartReservationParams; Body: AdjustReservationBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { cartId, variantId } = request.params;
      const { newQuantity } = request.body;
      const result = await this.adjustReservationHandler.handle({ cartId, variantId, newQuantity });
      return ResponseHelper.fromCommand(reply, result, "Reservation adjusted successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async resolveReservationConflicts(
    request: AuthenticatedRequest<{ Params: VariantIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const result = await this.resolveReservationConflictsHandler.handle({ variantId });
      return ResponseHelper.fromCommand(reply, result, "Reservation conflicts resolved successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async releaseReservation(
    request: AuthenticatedRequest<{ Params: ReservationIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;
      const result = await this.releaseReservationHandler.handle({ reservationId });
      return ResponseHelper.fromCommand(reply, result, "Reservation released successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}

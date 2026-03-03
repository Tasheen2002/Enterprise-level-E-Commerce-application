import { FastifyRequest, FastifyReply } from "fastify";
import {
  ReservationService,
  CreateReservationCommand,
  CreateReservationHandler,
  GetReservationsQuery,
  GetReservationsHandler,
} from "../../../application";

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
    // Initialize CQRS handlers
    this.createReservationHandler = new CreateReservationHandler(
      reservationService,
    );
    this.getReservationsHandler = new GetReservationsHandler(
      reservationService,
    );
  }

  // Create reservation
  async createReservation(
    request: FastifyRequest<{ Body: CreateReservationRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const reservationData = request.body;

      // Validate required fields
      if (
        !reservationData.cartId ||
        typeof reservationData.cartId !== "string"
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Cart ID is required and must be a valid string",
        });
      }

      if (
        !reservationData.variantId ||
        typeof reservationData.variantId !== "string"
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      if (
        !reservationData.quantity ||
        typeof reservationData.quantity !== "number" ||
        reservationData.quantity <= 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Quantity must be a positive number",
        });
      }

      // Create command
      const command: CreateReservationCommand = {
        cartId: reservationData.cartId,
        variantId: reservationData.variantId,
        quantity: reservationData.quantity,
        durationMinutes: reservationData.durationMinutes,
      };

      // Execute command using handler
      const result = await this.createReservationHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Reservation created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to create reservation",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create reservation");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create reservation",
      });
    }
  }

  // Get reservation by ID
  async getReservation(
    request: FastifyRequest<{ Params: { reservationId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;

      if (!reservationId || typeof reservationId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Reservation ID is required and must be a valid string",
        });
      }

      const reservation =
        await this.reservationService.getReservation(reservationId);

      if (!reservation) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Reservation not found",
        });
      }

      return reply.code(200).send({
        success: true,
        data: reservation,
      });
    } catch (error) {
      request.log.error(error, "Failed to get reservation");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve reservation",
      });
    }
  }

  // Get cart reservations
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

      if (!cartId || typeof cartId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Cart ID is required and must be a valid string",
        });
      }

      // Create query
      const query: GetReservationsQuery = {
        cartId,
        activeOnly,
      };

      // Execute query using handler (gets active reservations)
      const result = await this.getReservationsHandler.handle(query);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve reservations",
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get cart reservations");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve cart reservations",
      });
    }
  }

  // Get variant reservations
  async getVariantReservations(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      const reservations =
        await this.reservationService.getVariantReservations(variantId);

      return reply.code(200).send({
        success: true,
        data: reservations,
      });
    } catch (error) {
      request.log.error(error, "Failed to get variant reservations");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve variant reservations",
      });
    }
  }

  // Extend reservation
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

      if (!reservationId || typeof reservationId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Reservation ID is required and must be a valid string",
        });
      }

      if (
        !additionalMinutes ||
        typeof additionalMinutes !== "number" ||
        additionalMinutes <= 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Additional minutes must be a positive number",
        });
      }

      const reservation = await this.reservationService.extendReservation({
        reservationId,
        additionalMinutes,
      });

      return reply.code(200).send({
        success: true,
        data: reservation,
        message: "Reservation extended successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to extend reservation");

      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          return reply.code(404).send({
            success: false,
            error: "Not Found",
            message: error.message,
          });
        }

        if (error.message.includes("cannot be extended")) {
          return reply.code(400).send({
            success: false,
            error: "Bad Request",
            message: error.message,
          });
        }
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to extend reservation",
      });
    }
  }

  // Renew reservation
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

      if (!reservationId || typeof reservationId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Reservation ID is required and must be a valid string",
        });
      }

      const reservation = await this.reservationService.renewReservation({
        reservationId,
        durationMinutes,
      });

      return reply.code(200).send({
        success: true,
        data: reservation,
        message: "Reservation renewed successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to renew reservation");

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to renew reservation",
      });
    }
  }

  // Release reservation
  async releaseReservation(
    request: FastifyRequest<{ Params: { reservationId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { reservationId } = request.params;

      if (!reservationId || typeof reservationId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Reservation ID is required and must be a valid string",
        });
      }

      const success =
        await this.reservationService.releaseReservation(reservationId);

      if (!success) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Reservation not found",
        });
      }

      return reply.code(200).send({
        success: true,
        message: "Reservation released successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to release reservation");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to release reservation",
      });
    }
  }

  // Adjust reservation quantity
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

      if (!cartId || typeof cartId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Cart ID is required and must be a valid string",
        });
      }

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      if (typeof newQuantity !== "number" || newQuantity < 0) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "New quantity must be a non-negative number",
        });
      }

      const reservation = await this.reservationService.adjustReservation({
        cartId,
        variantId,
        newQuantity,
      });

      if (!reservation) {
        return reply.code(404).send({
          success: false,
          error: "Not Found",
          message: "Reservation not found",
        });
      }

      return reply.code(200).send({
        success: true,
        data: reservation,
        message: "Reservation adjusted successfully",
      });
    } catch (error) {
      request.log.error(error, "Failed to adjust reservation");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to adjust reservation",
      });
    }
  }

  // Check availability
  async checkAvailability(
    request: FastifyRequest<{ Querystring: CheckAvailabilityRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, requestedQuantity } = request.query;

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      if (
        !requestedQuantity ||
        typeof requestedQuantity !== "number" ||
        requestedQuantity <= 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Requested quantity must be a positive number",
        });
      }

      const availability = await this.reservationService.checkAvailability(
        variantId,
        requestedQuantity,
      );

      return reply.code(200).send({
        success: true,
        data: availability,
      });
    } catch (error) {
      request.log.error(error, "Failed to check availability");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to check availability",
      });
    }
  }

  // Get total reserved quantity
  async getTotalReservedQuantity(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      const totalReserved =
        await this.reservationService.getTotalReservedQuantity(variantId);

      return reply.code(200).send({
        success: true,
        data: { variantId, totalReserved },
      });
    } catch (error) {
      request.log.error(error, "Failed to get total reserved quantity");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve total reserved quantity",
      });
    }
  }

  // Get active reserved quantity
  async getActiveReservedQuantity(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      const activeReserved =
        await this.reservationService.getActiveReservedQuantity(variantId);

      return reply.code(200).send({
        success: true,
        data: { variantId, activeReserved },
      });
    } catch (error) {
      request.log.error(error, "Failed to get active reserved quantity");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve active reserved quantity",
      });
    }
  }

  // Create bulk reservations
  async createBulkReservations(
    request: FastifyRequest<{ Body: BulkReservationRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const bulkData = request.body;

      if (!bulkData.cartId || typeof bulkData.cartId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Cart ID is required and must be a valid string",
        });
      }

      if (
        !bulkData.items ||
        !Array.isArray(bulkData.items) ||
        bulkData.items.length === 0
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Items array is required and must not be empty",
        });
      }

      const result = await this.reservationService.createBulkReservations({
        cartId: bulkData.cartId,
        items: bulkData.items,
        durationMinutes: bulkData.durationMinutes,
      });

      return reply.code(result.totalFailed === 0 ? 201 : 207).send({
        success: result.totalFailed === 0,
        data: result,
        message:
          result.totalFailed === 0
            ? "All reservations created successfully"
            : `${result.totalCreated} reservation(s) created, ${result.totalFailed} failed`,
      });
    } catch (error) {
      request.log.error(error, "Failed to create bulk reservations");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create bulk reservations",
      });
    }
  }

  // Get reservation statistics (admin endpoint)
  async getReservationStatistics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const statistics =
        await this.reservationService.getReservationStatistics();

      return reply.code(200).send({
        success: true,
        data: statistics,
      });
    } catch (error) {
      request.log.error(error, "Failed to get reservation statistics");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve reservation statistics",
      });
    }
  }

  // Get reservations by status
  async getReservationsByStatus(
    request: FastifyRequest<{
      Querystring: ReservationQueryParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { status } = request.query;

      if (!status) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Status parameter is required",
        });
      }

      if (
        !["active", "expiring_soon", "expired", "recently_expired"].includes(
          status,
        )
      ) {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Invalid status value",
        });
      }

      const reservations =
        await this.reservationService.getReservationsByStatus(status);

      return reply.code(200).send({
        success: true,
        data: reservations,
      });
    } catch (error) {
      request.log.error(error, "Failed to get reservations by status");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve reservations by status",
      });
    }
  }

  // Resolve reservation conflicts (admin endpoint)
  async resolveReservationConflicts(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      if (!variantId || typeof variantId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Variant ID is required and must be a valid string",
        });
      }

      const result =
        await this.reservationService.resolveReservationConflicts(variantId);

      return reply.code(200).send({
        success: true,
        data: result,
        message: `Resolved ${result.resolved} conflict(s)`,
      });
    } catch (error) {
      request.log.error(error, "Failed to resolve reservation conflicts");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to resolve reservation conflicts",
      });
    }
  }

  // Optimize reservations (admin endpoint)
  async optimizeReservations(request: FastifyRequest, reply: FastifyReply) {
    try {
      const optimizedCount =
        await this.reservationService.optimizeReservations();

      return reply.code(200).send({
        success: true,
        data: { optimizedCount },
        message: `Successfully optimized ${optimizedCount} reservation(s)`,
      });
    } catch (error) {
      request.log.error(error, "Failed to optimize reservations");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to optimize reservations",
      });
    }
  }
}

import { FastifyRequest, FastifyReply } from "fastify";
import {
  AddStockCommand,
  AddStockCommandHandler,
  AdjustStockCommand,
  AdjustStockCommandHandler,
  TransferStockCommand,
  TransferStockCommandHandler,
  ReserveStockCommand,
  ReserveStockCommandHandler,
  FulfillReservationCommand,
  FulfillReservationCommandHandler,
  SetStockThresholdsCommand,
  SetStockThresholdsCommandHandler,
  GetStockQuery,
  GetStockQueryHandler,
  GetStockByVariantQuery,
  GetStockByVariantQueryHandler,
  GetStockStatsQuery,
  GetStockStatsQueryHandler,
  GetTotalAvailableStockQuery,
  GetTotalAvailableStockQueryHandler,
  ListStocksQuery,
  ListStocksQueryHandler,
} from "../../../application";
import { StockManagementService } from "../../../application/services/stock-management.service";
import { PickupReservationService } from "../../../application/services/pickup-reservation.service";

export class StockController {
  private addStockHandler: AddStockCommandHandler;
  private adjustStockHandler: AdjustStockCommandHandler;
  private transferStockHandler: TransferStockCommandHandler;
  private reserveStockHandler: ReserveStockCommandHandler;
  private fulfillReservationHandler: FulfillReservationCommandHandler;
  private setStockThresholdsHandler: SetStockThresholdsCommandHandler;
  private getStockHandler: GetStockQueryHandler;
  private getStockByVariantHandler: GetStockByVariantQueryHandler;
  private getStockStatsHandler: GetStockStatsQueryHandler;
  private getTotalAvailableStockHandler: GetTotalAvailableStockQueryHandler;
  private listStocksHandler: ListStocksQueryHandler;

  constructor(
    private readonly stockService: StockManagementService,
    private readonly reservationService?: PickupReservationService,
  ) {
    // Initialize command handlers
    this.addStockHandler = new AddStockCommandHandler(stockService);
    this.adjustStockHandler = new AdjustStockCommandHandler(stockService);
    this.transferStockHandler = new TransferStockCommandHandler(stockService);
    this.reserveStockHandler = new ReserveStockCommandHandler(stockService);
    this.fulfillReservationHandler = new FulfillReservationCommandHandler(
      stockService,
    );
    this.setStockThresholdsHandler = new SetStockThresholdsCommandHandler(
      stockService,
    );

    // Initialize query handlers
    this.getStockHandler = new GetStockQueryHandler(stockService);
    this.getStockByVariantHandler = new GetStockByVariantQueryHandler(
      stockService,
    );
    this.getStockStatsHandler = new GetStockStatsQueryHandler(stockService);
    this.getTotalAvailableStockHandler = new GetTotalAvailableStockQueryHandler(
      stockService,
    );
    this.listStocksHandler = new ListStocksQueryHandler(stockService);
  }

  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query: GetStockStatsQuery = {};

      const result = await this.getStockStatsHandler.handle(query);

      return reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      request.log.error(error, "Failed to get stock stats");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getStock(
    request: FastifyRequest<{
      Params: { variantId: string; locationId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, locationId } = request.params;

      const query: GetStockQuery = {
        variantId,
        locationId,
      };

      const result = await this.getStockHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else if (result.success && result.data === null) {
        return reply.code(404).send({
          success: false,
          error: "Stock not found",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to get stock",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get stock");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getStockByVariant(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      const query: GetStockByVariantQuery = {
        variantId,
      };

      const result = await this.getStockByVariantHandler.handle(query);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to get stock",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get stock by variant");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getTotalAvailableStock(
    request: FastifyRequest<{ Params: { variantId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;

      const query: GetTotalAvailableStockQuery = {
        variantId,
      };

      const result = await this.getTotalAvailableStockHandler.handle(query);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to get total available stock",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get total available stock");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async listStocks(
    request: FastifyRequest<{
      Querystring: {
        limit?: number;
        offset?: number;
        q?: string;
        search?: string;
        status?: "low_stock" | "out_of_stock" | "in_stock";
        locationId?: string;
        sortBy?: "available" | "onHand" | "location" | "product";
        sortOrder?: "asc" | "desc";
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const {
        limit,
        offset,
        q,
        search,
        status,
        locationId,
        sortBy,
        sortOrder,
      } = request.query;

      const query: ListStocksQuery = {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        search: search || q,
        status,
        locationId,
        sortBy,
        sortOrder,
      };

      const result = await this.listStocksHandler.handle(query);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to list stocks",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to list stocks");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async addStock(
    request: FastifyRequest<{
      Body: {
        variantId: string;
        locationId: string;
        quantity: number;
        reason: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const command: AddStockCommand = request.body;

      const result = await this.addStockHandler.handle(command);

      if (result.success) {
        return reply.code(201).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to add stock",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to add stock");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async adjustStock(
    request: FastifyRequest<{
      Body: {
        variantId: string;
        locationId: string;
        quantityDelta: number;
        reason: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const command: AdjustStockCommand = request.body;

      const result = await this.adjustStockHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to adjust stock",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to adjust stock");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async transferStock(
    request: FastifyRequest<{
      Body: {
        variantId: string;
        fromLocationId: string;
        toLocationId: string;
        quantity: number;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const command: TransferStockCommand = request.body;

      const result = await this.transferStockHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to transfer stock",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to transfer stock");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async reserveStock(
    request: FastifyRequest<{
      Body: {
        variantId: string;
        locationId: string;
        quantity: number;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const command: ReserveStockCommand = request.body;

      const result = await this.reserveStockHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to reserve stock",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to reserve stock");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async fulfillReservation(
    request: FastifyRequest<{
      Body: {
        variantId: string;
        locationId: string;
        quantity: number;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const command: FulfillReservationCommand = request.body;

      const result = await this.fulfillReservationHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to fulfill reservation",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to fulfill reservation");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async setStockThresholds(
    request: FastifyRequest<{
      Params: { variantId: string; locationId: string };
      Body: {
        lowStockThreshold?: number;
        safetyStock?: number;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, locationId } = request.params;
      const { lowStockThreshold, safetyStock } = request.body;

      const command: SetStockThresholdsCommand = {
        variantId,
        locationId,
        lowStockThreshold,
        safetyStock,
      };

      const result = await this.setStockThresholdsHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to set stock thresholds",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to set stock thresholds");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }
}

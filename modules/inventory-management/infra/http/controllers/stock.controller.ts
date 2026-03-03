import { FastifyRequest, FastifyReply } from "fastify";
import {
  AddStockCommand,
  AddStockHandler,
  AdjustStockCommand,
  AdjustStockHandler,
  TransferStockCommand,
  TransferStockHandler,
  ReserveStockCommand,
  ReserveStockHandler,
  FulfillReservationCommand,
  FulfillReservationHandler,
  SetStockThresholdsCommand,
  SetStockThresholdsHandler,
  GetStockQuery,
  GetStockHandler,
  GetStockByVariantQuery,
  GetStockByVariantHandler,
  GetStockStatsQuery,
  GetStockStatsHandler,
  GetTotalAvailableStockQuery,
  GetTotalAvailableStockHandler,
  ListStocksQuery,
  ListStocksHandler,
} from "../../../application";
import { StockManagementService } from "../../../application/services/stock-management.service";
import { PickupReservationService } from "../../../application/services/pickup-reservation.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class StockController {
  private addStockHandler: AddStockHandler;
  private adjustStockHandler: AdjustStockHandler;
  private transferStockHandler: TransferStockHandler;
  private reserveStockHandler: ReserveStockHandler;
  private fulfillReservationHandler: FulfillReservationHandler;
  private setStockThresholdsHandler: SetStockThresholdsHandler;
  private getStockHandler: GetStockHandler;
  private getStockByVariantHandler: GetStockByVariantHandler;
  private getStockStatsHandler: GetStockStatsHandler;
  private getTotalAvailableStockHandler: GetTotalAvailableStockHandler;
  private listStocksHandler: ListStocksHandler;

  constructor(
    private readonly stockService: StockManagementService,
    private readonly reservationService?: PickupReservationService,
  ) {
    // Initialize command handlers
    this.addStockHandler = new AddStockHandler(stockService);
    this.adjustStockHandler = new AdjustStockHandler(stockService);
    this.transferStockHandler = new TransferStockHandler(stockService);
    this.reserveStockHandler = new ReserveStockHandler(stockService);
    this.fulfillReservationHandler = new FulfillReservationHandler(
      stockService,
    );
    this.setStockThresholdsHandler = new SetStockThresholdsHandler(
      stockService,
    );

    // Initialize query handlers
    this.getStockHandler = new GetStockHandler(stockService);
    this.getStockByVariantHandler = new GetStockByVariantHandler(stockService);
    this.getStockStatsHandler = new GetStockStatsHandler(stockService);
    this.getTotalAvailableStockHandler = new GetTotalAvailableStockHandler(
      stockService,
    );
    this.listStocksHandler = new ListStocksHandler(stockService);
  }

  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query: GetStockStatsQuery = {};

      const result = await this.getStockStatsHandler.handle(query);
      return ResponseHelper.fromQuery(reply, result, "Stock stats retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Stock retrieved",
        "Stock not found",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Stock by variant retrieved",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Total available stock retrieved",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromQuery(reply, result, "Stocks retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Stock added successfully",
        201,
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Stock adjusted successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Stock transferred successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Stock reserved successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Reservation fulfilled successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
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
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Stock thresholds updated successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}

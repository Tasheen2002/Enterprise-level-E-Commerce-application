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
  GetLowStockItemsQuery,
  GetLowStockItemsHandler,
  GetOutOfStockItemsQuery,
  GetOutOfStockItemsHandler,
} from "../../../application";
import { StockManagementService } from "../../../application/services/stock-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface ListStocksQuerystring {
  limit?: number;
  offset?: number;
  q?: string;
  search?: string;
  status?: "low_stock" | "out_of_stock" | "in_stock";
  locationId?: string;
  sortBy?: "available" | "onHand" | "location" | "product";
  sortOrder?: "asc" | "desc";
}

export interface GetStockParams {
  variantId: string;
  locationId: string;
}

export interface VariantParams {
  variantId: string;
}

export interface AddStockBody {
  variantId: string;
  locationId: string;
  quantity: number;
  reason: string;
}

export interface AdjustStockBody {
  variantId: string;
  locationId: string;
  quantityDelta: number;
  reason: string;
}

export interface TransferStockBody {
  variantId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
}

export interface ReserveStockBody {
  variantId: string;
  locationId: string;
  quantity: number;
}

export interface FulfillReservationBody {
  variantId: string;
  locationId: string;
  quantity: number;
}

export interface SetStockThresholdsBody {
  lowStockThreshold?: number;
  safetyStock?: number;
}

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
  private getLowStockItemsHandler: GetLowStockItemsHandler;
  private getOutOfStockItemsHandler: GetOutOfStockItemsHandler;

  constructor(private readonly stockService: StockManagementService) {
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
    this.getLowStockItemsHandler = new GetLowStockItemsHandler(stockService);
    this.getOutOfStockItemsHandler = new GetOutOfStockItemsHandler(
      stockService,
    );
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
      Params: GetStockParams;
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
    request: FastifyRequest<{ Params: VariantParams }>,
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
    request: FastifyRequest<{ Params: VariantParams }>,
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
      Querystring: ListStocksQuerystring;
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

  async getLowStockItems(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query: GetLowStockItemsQuery = {};
      const result = await this.getLowStockItemsHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Low stock items retrieved",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getOutOfStockItems(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query: GetOutOfStockItemsQuery = {};
      const result = await this.getOutOfStockItemsHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Out of stock items retrieved",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async addStock(
    request: FastifyRequest<{
      Body: AddStockBody;
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
      Body: AdjustStockBody;
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
      Body: TransferStockBody;
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
      Body: ReserveStockBody;
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
      Body: FulfillReservationBody;
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
      Params: GetStockParams;
      Body: SetStockThresholdsBody;
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

import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  AddStockHandler,
  AdjustStockHandler,
  TransferStockHandler,
  ReserveStockHandler,
  FulfillReservationHandler,
  SetStockThresholdsHandler,
  GetStockHandler,
  GetStockByVariantHandler,
  GetStockStatsHandler,
  GetTotalAvailableStockHandler,
  ListStocksHandler,
  GetLowStockItemsHandler,
  GetOutOfStockItemsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  StockParams,
  VariantParams,
  AddStockBody,
  AdjustStockBody,
  TransferStockBody,
  ReserveStockBody,
  FulfillReservationBody,
  SetStockThresholdsBody,
  ListStocksQuery,
} from "../validation/stock.schema";

export class StockController {
  constructor(
    private readonly addStockHandler: AddStockHandler,
    private readonly adjustStockHandler: AdjustStockHandler,
    private readonly transferStockHandler: TransferStockHandler,
    private readonly reserveStockHandler: ReserveStockHandler,
    private readonly fulfillReservationHandler: FulfillReservationHandler,
    private readonly setStockThresholdsHandler: SetStockThresholdsHandler,
    private readonly getStockHandler: GetStockHandler,
    private readonly getStockByVariantHandler: GetStockByVariantHandler,
    private readonly getStockStatsHandler: GetStockStatsHandler,
    private readonly getTotalAvailableStockHandler: GetTotalAvailableStockHandler,
    private readonly listStocksHandler: ListStocksHandler,
    private readonly getLowStockItemsHandler: GetLowStockItemsHandler,
    private readonly getOutOfStockItemsHandler: GetOutOfStockItemsHandler,
  ) {}

  async getStats(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getStockStatsHandler.handle({});
      return ResponseHelper.ok(reply, "Stock stats retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getStock(
    request: AuthenticatedRequest<{ Params: StockParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, locationId } = request.params;
      const result = await this.getStockHandler.handle({ variantId, locationId });
      return ResponseHelper.ok(reply, "Stock retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getStockByVariant(
    request: AuthenticatedRequest<{ Params: VariantParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const result = await this.getStockByVariantHandler.handle({ variantId });
      return ResponseHelper.ok(reply, "Stock by variant retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getTotalAvailableStock(
    request: AuthenticatedRequest<{ Params: VariantParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const result = await this.getTotalAvailableStockHandler.handle({ variantId });
      return ResponseHelper.ok(reply, "Total available stock retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listStocks(
    request: AuthenticatedRequest<{ Querystring: ListStocksQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { limit, offset, search, status, locationId, sortBy, sortOrder } = request.query;
      const result = await this.listStocksHandler.handle({
        limit,
        offset,
        search,
        status,
        locationId,
        sortBy,
        sortOrder,
      });
      return ResponseHelper.ok(reply, "Stocks retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getLowStockItems(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getLowStockItemsHandler.handle({});
      return ResponseHelper.ok(reply, "Low stock items retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getOutOfStockItems(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getOutOfStockItemsHandler.handle({});
      return ResponseHelper.ok(reply, "Out of stock items retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async addStock(
    request: AuthenticatedRequest<{ Body: AddStockBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, locationId, quantity, reason } = request.body;
      const result = await this.addStockHandler.handle({ variantId, locationId, quantity, reason });
      return ResponseHelper.fromCommand(reply, result, "Stock added successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async adjustStock(
    request: AuthenticatedRequest<{ Body: AdjustStockBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, locationId, quantityDelta, reason } = request.body;
      const result = await this.adjustStockHandler.handle({ variantId, locationId, quantityDelta, reason });
      return ResponseHelper.fromCommand(reply, result, "Stock adjusted successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async transferStock(
    request: AuthenticatedRequest<{ Body: TransferStockBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, fromLocationId, toLocationId, quantity } = request.body;
      const result = await this.transferStockHandler.handle({ variantId, fromLocationId, toLocationId, quantity });
      return ResponseHelper.fromCommand(reply, result, "Stock transferred successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async reserveStock(
    request: AuthenticatedRequest<{ Body: ReserveStockBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, locationId, quantity } = request.body;
      const result = await this.reserveStockHandler.handle({ variantId, locationId, quantity });
      return ResponseHelper.fromCommand(reply, result, "Stock reserved successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async fulfillReservation(
    request: AuthenticatedRequest<{ Body: FulfillReservationBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, locationId, quantity } = request.body;
      const result = await this.fulfillReservationHandler.handle({ variantId, locationId, quantity });
      return ResponseHelper.fromCommand(reply, result, "Reservation fulfilled successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async setStockThresholds(
    request: AuthenticatedRequest<{ Params: StockParams; Body: SetStockThresholdsBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, locationId } = request.params;
      const { lowStockThreshold, safetyStock } = request.body;
      const result = await this.setStockThresholdsHandler.handle({
        variantId,
        locationId,
        lowStockThreshold,
        safetyStock,
      });
      return ResponseHelper.fromCommand(reply, result, "Stock thresholds updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}

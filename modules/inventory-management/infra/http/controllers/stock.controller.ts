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
      return ResponseHelper.fromQuery(reply, result, "Stock stats retrieved");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getStock(
    request: AuthenticatedRequest<{
      Params: { variantId: string; locationId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, locationId } = request.params;
      const result = await this.getStockHandler.handle({ variantId, locationId });
      return ResponseHelper.fromQuery(reply, result, "Stock retrieved", "Stock not found");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getStockByVariant(
    request: AuthenticatedRequest<{
      Params: { variantId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const result = await this.getStockByVariantHandler.handle({ variantId });
      return ResponseHelper.fromQuery(reply, result, "Stock by variant retrieved");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getTotalAvailableStock(
    request: AuthenticatedRequest<{
      Params: { variantId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const result = await this.getTotalAvailableStockHandler.handle({ variantId });
      return ResponseHelper.fromQuery(reply, result, "Total available stock retrieved");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listStocks(
    request: AuthenticatedRequest<{
      Querystring: {
        limit?: number;
        offset?: number;
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
      const { limit, offset, search, status, locationId, sortBy, sortOrder } = request.query;
      const result = await this.listStocksHandler.handle({
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        search,
        status,
        locationId,
        sortBy,
        sortOrder,
      });
      return ResponseHelper.fromQuery(reply, result, "Stocks retrieved");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getLowStockItems(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getLowStockItemsHandler.handle({});
      return ResponseHelper.fromQuery(reply, result, "Low stock items retrieved");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getOutOfStockItems(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getOutOfStockItemsHandler.handle({});
      return ResponseHelper.fromQuery(reply, result, "Out of stock items retrieved");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async addStock(
    request: AuthenticatedRequest<{
      Body: { variantId: string; locationId: string; quantity: number; reason: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.addStockHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Stock added successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async adjustStock(
    request: AuthenticatedRequest<{
      Body: { variantId: string; locationId: string; quantityDelta: number; reason: string; referenceId?: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.adjustStockHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Stock adjusted successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async transferStock(
    request: AuthenticatedRequest<{
      Body: { variantId: string; fromLocationId: string; toLocationId: string; quantity: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.transferStockHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Stock transferred successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async reserveStock(
    request: AuthenticatedRequest<{
      Body: { variantId: string; locationId: string; quantity: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.reserveStockHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Stock reserved successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async fulfillReservation(
    request: AuthenticatedRequest<{
      Body: { variantId: string; locationId: string; quantity: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.fulfillReservationHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Reservation fulfilled successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async setStockThresholds(
    request: AuthenticatedRequest<{
      Params: { variantId: string; locationId: string };
      Body: { lowStockThreshold?: number; safetyStock?: number };
    }>,
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

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
import { StockManagementService } from "../../../application/services/stock-management.service";
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
  private getLowStockItemsHandler: GetLowStockItemsHandler;
  private getOutOfStockItemsHandler: GetOutOfStockItemsHandler;

  constructor(stockService: StockManagementService) {
    this.addStockHandler = new AddStockHandler(stockService);
    this.adjustStockHandler = new AdjustStockHandler(stockService);
    this.transferStockHandler = new TransferStockHandler(stockService);
    this.reserveStockHandler = new ReserveStockHandler(stockService);
    this.fulfillReservationHandler = new FulfillReservationHandler(stockService);
    this.setStockThresholdsHandler = new SetStockThresholdsHandler(stockService);
    this.getStockHandler = new GetStockHandler(stockService);
    this.getStockByVariantHandler = new GetStockByVariantHandler(stockService);
    this.getStockStatsHandler = new GetStockStatsHandler(stockService);
    this.getTotalAvailableStockHandler = new GetTotalAvailableStockHandler(stockService);
    this.listStocksHandler = new ListStocksHandler(stockService);
    this.getLowStockItemsHandler = new GetLowStockItemsHandler(stockService);
    this.getOutOfStockItemsHandler = new GetOutOfStockItemsHandler(stockService);
  }

  async getStats(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getStockStatsHandler.handle({});
      return ResponseHelper.fromQuery(reply, result, "Stock stats retrieved");
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getLowStockItems(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getLowStockItemsHandler.handle({});
      return ResponseHelper.fromQuery(reply, result, "Low stock items retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getOutOfStockItems(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.getOutOfStockItemsHandler.handle({});
      return ResponseHelper.fromQuery(reply, result, "Out of stock items retrieved");
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}

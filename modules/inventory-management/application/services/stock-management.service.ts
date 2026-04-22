import { Stock, StockDTO } from "../../domain/entities/stock.entity";
import { InventoryTransaction, InventoryTransactionDTO } from "../../domain/entities/inventory-transaction.entity";
import { TransactionId } from "../../domain/value-objects/transaction-id.vo";
import { IStockRepository } from "../../domain/repositories/stock.repository";
import { IInventoryTransactionRepository } from "../../domain/repositories/inventory-transaction.repository";
import {
  StockNotFoundError,
  InventoryTransactionNotFoundError,
} from "../../domain/errors/inventory-management.errors";

export class StockManagementService {
  constructor(
    private readonly stockRepository: IStockRepository,
    private readonly transactionRepository: IInventoryTransactionRepository,
  ) {}

  async addStock(
    variantId: string,
    locationId: string,
    quantity: number,
    reason: string,
  ): Promise<StockDTO> {
    let stock = await this.stockRepository.findByVariantAndLocation(
      variantId,
      locationId,
    );

    if (!stock) {
      stock = Stock.create({ variantId, locationId, onHand: quantity, reserved: 0 });
    } else {
      stock.addStock(quantity);
    }

    await this.stockRepository.save(stock);

    const transaction = InventoryTransaction.create({
      variantId,
      locationId,
      qtyDelta: quantity,
      reason,
    });

    await this.transactionRepository.save(transaction);

    return Stock.toDTO(stock);
  }

  async adjustStock(
    variantId: string,
    locationId: string,
    quantityDelta: number,
    reason: string,
    referenceId?: string,
  ): Promise<StockDTO> {
    const stock = await this.stockRepository.findByVariantAndLocation(
      variantId,
      locationId,
    );

    if (!stock) {
      throw new StockNotFoundError(`${variantId} at ${locationId}`);
    }

    if (quantityDelta > 0) {
      stock.addStock(quantityDelta);
    } else {
      stock.removeStock(Math.abs(quantityDelta));
    }

    await this.stockRepository.save(stock);

    const transaction = InventoryTransaction.create({
      variantId,
      locationId,
      qtyDelta: quantityDelta,
      reason,
      referenceId,
    });

    await this.transactionRepository.save(transaction);

    return Stock.toDTO(stock);
  }

  async transferStock(
    variantId: string,
    fromLocationId: string,
    toLocationId: string,
    quantity: number,
  ): Promise<{ fromStock: StockDTO; toStock: StockDTO }> {
    const fromStock = await this.stockRepository.findByVariantAndLocation(
      variantId,
      fromLocationId,
    );

    if (!fromStock) {
      throw new StockNotFoundError(`${variantId} at ${fromLocationId}`);
    }

    fromStock.removeStock(quantity);
    await this.stockRepository.save(fromStock);

    const outboundTxn = InventoryTransaction.create({
      variantId,
      locationId: fromLocationId,
      qtyDelta: -quantity,
      reason: "adjustment",
      referenceId: toLocationId,
    });
    await this.transactionRepository.save(outboundTxn);

    let toStock = await this.stockRepository.findByVariantAndLocation(
      variantId,
      toLocationId,
    );

    if (!toStock) {
      toStock = Stock.create({ variantId, locationId: toLocationId, onHand: quantity, reserved: 0 });
    } else {
      toStock.addStock(quantity);
    }

    await this.stockRepository.save(toStock);

    const inboundTxn = InventoryTransaction.create({
      variantId,
      locationId: toLocationId,
      qtyDelta: quantity,
      reason: "adjustment",
      referenceId: fromLocationId,
    });
    await this.transactionRepository.save(inboundTxn);

    return { fromStock: Stock.toDTO(fromStock), toStock: Stock.toDTO(toStock) };
  }

  async reserveStock(
    variantId: string,
    locationId: string,
    quantity: number,
  ): Promise<StockDTO> {
    const stock = await this.stockRepository.findByVariantAndLocation(
      variantId,
      locationId,
    );

    if (!stock) {
      throw new StockNotFoundError(`${variantId} at ${locationId}`);
    }

    stock.reserveStock(quantity);
    await this.stockRepository.save(stock);

    return Stock.toDTO(stock);
  }

  async fulfillReservation(
    variantId: string,
    locationId: string,
    quantity: number,
  ): Promise<StockDTO> {
    const stock = await this.stockRepository.findByVariantAndLocation(
      variantId,
      locationId,
    );

    if (!stock) {
      throw new StockNotFoundError(`${variantId} at ${locationId}`);
    }

    stock.fulfillReservation(quantity);
    await this.stockRepository.save(stock);

    const transaction = InventoryTransaction.create({
      variantId,
      locationId,
      qtyDelta: -quantity,
      reason: "order",
    });
    await this.transactionRepository.save(transaction);

    return Stock.toDTO(stock);
  }

  async setStockThresholds(
    variantId: string,
    locationId: string,
    lowStockThreshold?: number,
    safetyStock?: number,
  ): Promise<StockDTO> {
    const stock = await this.stockRepository.findByVariantAndLocation(
      variantId,
      locationId,
    );

    if (!stock) {
      throw new StockNotFoundError(`${variantId} at ${locationId}`);
    }

    stock.updateThresholds(lowStockThreshold, safetyStock);
    await this.stockRepository.save(stock);

    return Stock.toDTO(stock);
  }

  async getStock(variantId: string, locationId: string): Promise<StockDTO | null> {
    const stock = await this.stockRepository.findByVariantAndLocation(variantId, locationId);
    return stock ? Stock.toDTO(stock) : null;
  }

  async getStockByVariant(variantId: string): Promise<StockDTO[]> {
    const stocks = await this.stockRepository.findByVariant(variantId);
    return stocks.map(Stock.toDTO);
  }

  async getTotalAvailableStock(variantId: string): Promise<number> {
    return this.stockRepository.getTotalAvailableStock(variantId);
  }

  async getLowStockItems(): Promise<StockDTO[]> {
    const stocks = await this.stockRepository.findLowStockItems();
    return stocks.map(Stock.toDTO);
  }

  async getOutOfStockItems(): Promise<StockDTO[]> {
    const stocks = await this.stockRepository.findOutOfStockItems();
    return stocks.map(Stock.toDTO);
  }

  async listStocks(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: "low_stock" | "out_of_stock" | "in_stock";
    locationId?: string;
    sortBy?: "available" | "onHand" | "location" | "product";
    sortOrder?: "asc" | "desc";
  }): Promise<{ stocks: StockDTO[]; total: number }> {
    const result = await this.stockRepository.findAll(options);
    return { stocks: result.items.map(Stock.toDTO), total: result.total };
  }

  async getTransactionHistory(
    variantId: string,
    locationId?: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ transactions: InventoryTransactionDTO[]; total: number }> {
    const result = locationId
      ? await this.transactionRepository.findByVariantAndLocation(variantId, locationId, options)
      : await this.transactionRepository.findByVariant(variantId, options);
    return {
      transactions: result.items.map(InventoryTransaction.toDTO),
      total: result.total,
    };
  }

  async getTransaction(transactionId: string): Promise<InventoryTransactionDTO> {
    const transaction = await this.transactionRepository.findById(
      TransactionId.fromString(transactionId),
    );
    if (!transaction) {
      throw new InventoryTransactionNotFoundError(transactionId);
    }
    return InventoryTransaction.toDTO(transaction);
  }

  async listTransactions(options?: {
    limit?: number;
    offset?: number;
    sortBy?: "createdAt";
    sortOrder?: "asc" | "desc";
  }): Promise<{ transactions: InventoryTransactionDTO[]; total: number }> {
    const result = await this.transactionRepository.findAll(options);
    return {
      transactions: result.items.map(InventoryTransaction.toDTO),
      total: result.total,
    };
  }

  async getStats(): Promise<{
    totalItems: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: number;
  }> {
    return this.stockRepository.getStats();
  }
}

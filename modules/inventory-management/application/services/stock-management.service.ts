import { Stock, StockDTO } from "../../domain/entities/stock.entity";
import { InventoryTransaction, InventoryTransactionDTO } from "../../domain/entities/inventory-transaction.entity";
import { TransactionId } from "../../domain/value-objects/transaction-id.vo";
import { LocationId } from "../../domain/value-objects/location-id.vo";
import { VariantId } from "../../../product-catalog/domain/value-objects/variant-id.vo";
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
      VariantId.fromString(variantId),
      LocationId.fromString(locationId),
    );

    if (!stock) {
      stock = Stock.create({ variantId, locationId, onHand: quantity, reserved: 0 });
    } else {
      stock.addStock(quantity);
    }

    const transaction = InventoryTransaction.create({
      variantId,
      locationId,
      qtyDelta: quantity,
      reason,
    });
    await this.stockRepository.saveWithTransactions([stock], [transaction]);

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
      VariantId.fromString(variantId),
      LocationId.fromString(locationId),
    );

    if (!stock) {
      throw new StockNotFoundError(`${variantId} at ${locationId}`);
    }

    let actualDelta = quantityDelta;
    if (quantityDelta > 0) {
      stock.addStock(quantityDelta);
    } else {
      let deductQty = Math.abs(quantityDelta);
      const isAllowed = await this.stockRepository.checkVariantPreorderOrBackorderAllowed(variantId);
      if (deductQty > stock.stockLevel.available && isAllowed) {
        deductQty = Math.max(0, stock.stockLevel.available);
      }
      actualDelta = -deductQty;
      if (deductQty > 0) {
        stock.removeStock(deductQty);
      }
    }

    const transactions =
      actualDelta === 0
        ? []
        : [
            InventoryTransaction.create({
              variantId,
              locationId,
              qtyDelta: actualDelta,
              reason,
              referenceId,
            }),
          ];
    await this.stockRepository.saveWithTransactions([stock], transactions);

    return Stock.toDTO(stock);
  }

  async transferStock(
    variantId: string,
    fromLocationId: string,
    toLocationId: string,
    quantity: number,
  ): Promise<{ fromStock: StockDTO; toStock: StockDTO }> {
    const variantVo = VariantId.fromString(variantId);
    const fromStock = await this.stockRepository.findByVariantAndLocation(
      variantVo,
      LocationId.fromString(fromLocationId),
    );

    if (!fromStock) {
      throw new StockNotFoundError(`${variantId} at ${fromLocationId}`);
    }

    fromStock.removeStock(quantity);

    const outboundTxn = InventoryTransaction.create({
      variantId,
      locationId: fromLocationId,
      qtyDelta: -quantity,
      reason: "adjustment",
      referenceId: toLocationId,
    });

    let toStock = await this.stockRepository.findByVariantAndLocation(
      variantVo,
      LocationId.fromString(toLocationId),
    );

    if (!toStock) {
      toStock = Stock.create({ variantId, locationId: toLocationId, onHand: quantity, reserved: 0 });
    } else {
      toStock.addStock(quantity);
    }

    const inboundTxn = InventoryTransaction.create({
      variantId,
      locationId: toLocationId,
      qtyDelta: quantity,
      reason: "adjustment",
      referenceId: fromLocationId,
    });
    // Both locations and both ledger rows commit together.
    await this.stockRepository.saveWithTransactions(
      [fromStock, toStock],
      [outboundTxn, inboundTxn],
    );

    return { fromStock: Stock.toDTO(fromStock), toStock: Stock.toDTO(toStock) };
  }

  /**
   * Returns to stock what left inventory for an order, using the ledger as
   * the record of what was taken (checkout deducts per warehouse and records
   * shortages as backorders, so the order lines alone are not exact). Units
   * already returned for the order are subtracted, so repeating is harmless.
   */
  async returnStockForOrder(orderId: string): Promise<number> {
    const entries = await this.transactionRepository.findByReference(orderId);
    const outstanding = new Map<string, { variantId: string; locationId: string; qty: number }>();
    for (const entry of entries) {
      const reason = entry.reason.getValue();
      if (reason !== "order" && reason !== "return") continue;
      const key = `${entry.variantId}|${entry.locationId}`;
      const line = outstanding.get(key) ?? {
        variantId: entry.variantId,
        locationId: entry.locationId,
        qty: 0,
      };
      line.qty -= entry.qtyDelta; // order rows are negative, return rows positive
      outstanding.set(key, line);
    }

    const stocks: Stock[] = [];
    const transactions: InventoryTransaction[] = [];
    let returned = 0;
    for (const line of outstanding.values()) {
      if (line.qty <= 0) continue;
      let stock = await this.stockRepository.findByVariantAndLocation(
        VariantId.fromString(line.variantId),
        LocationId.fromString(line.locationId),
      );
      if (!stock) {
        stock = Stock.create({ variantId: line.variantId, locationId: line.locationId, onHand: line.qty });
      } else {
        stock.addStock(line.qty);
      }
      stocks.push(stock);
      transactions.push(
        InventoryTransaction.create({
          variantId: line.variantId,
          locationId: line.locationId,
          qtyDelta: line.qty,
          reason: "return",
          referenceId: orderId,
        }),
      );
      returned += line.qty;
    }
    if (stocks.length > 0) {
      await this.stockRepository.saveWithTransactions(stocks, transactions);
    }
    return returned;
  }

  async reserveStock(
    variantId: string,
    locationId: string,
    quantity: number,
  ): Promise<StockDTO> {
    const stock = await this.stockRepository.findByVariantAndLocation(
      VariantId.fromString(variantId),
      LocationId.fromString(locationId),
    );

    if (!stock) {
      throw new StockNotFoundError(`${variantId} at ${locationId}`);
    }

    stock.reserveStock(quantity);
    await this.stockRepository.save(stock);

    return Stock.toDTO(stock);
  }

  // Release a previously-reserved quantity back to available stock. The
  // counterpart to `reserveStock` for cancellation flows. `unreserveStock`
  // on the entity throws if the quantity exceeds the current `reserved`,
  // so this is safe against double-release.
  async releaseStock(
    variantId: string,
    locationId: string,
    quantity: number,
  ): Promise<StockDTO> {
    const stock = await this.stockRepository.findByVariantAndLocation(
      VariantId.fromString(variantId),
      LocationId.fromString(locationId),
    );

    if (!stock) {
      throw new StockNotFoundError(`${variantId} at ${locationId}`);
    }

    stock.unreserveStock(quantity);
    await this.stockRepository.save(stock);

    return Stock.toDTO(stock);
  }

  async fulfillReservation(
    variantId: string,
    locationId: string,
    quantity: number,
  ): Promise<StockDTO> {
    const stock = await this.stockRepository.findByVariantAndLocation(
      VariantId.fromString(variantId),
      LocationId.fromString(locationId),
    );

    if (!stock) {
      throw new StockNotFoundError(`${variantId} at ${locationId}`);
    }

    stock.fulfillReservation(quantity);

    const transaction = InventoryTransaction.create({
      variantId,
      locationId,
      qtyDelta: -quantity,
      reason: "order",
    });
    await this.stockRepository.saveWithTransactions([stock], [transaction]);

    return Stock.toDTO(stock);
  }

  async setStockThresholds(
    variantId: string,
    locationId: string,
    lowStockThreshold?: number,
    safetyStock?: number,
  ): Promise<StockDTO> {
    const stock = await this.stockRepository.findByVariantAndLocation(
      VariantId.fromString(variantId),
      LocationId.fromString(locationId),
    );

    if (!stock) {
      throw new StockNotFoundError(`${variantId} at ${locationId}`);
    }

    stock.updateThresholds(lowStockThreshold, safetyStock);
    await this.stockRepository.save(stock);

    return Stock.toDTO(stock);
  }

  async getStock(variantId: string, locationId: string): Promise<StockDTO | null> {
    const stock = await this.stockRepository.findByVariantAndLocation(
      VariantId.fromString(variantId),
      LocationId.fromString(locationId),
    );
    return stock ? Stock.toDTO(stock) : null;
  }

  async getStockByVariant(variantId: string): Promise<StockDTO[]> {
    const stocks = await this.stockRepository.findByVariant(VariantId.fromString(variantId));
    return stocks.map(Stock.toDTO);
  }

  async getTotalAvailableStock(variantId: string): Promise<number> {
    return this.stockRepository.getTotalAvailableStock(VariantId.fromString(variantId));
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
    const result = await this.stockRepository.findAll({
      limit: options?.limit,
      offset: options?.offset,
      search: options?.search,
      status: options?.status,
      sortBy: options?.sortBy,
      sortOrder: options?.sortOrder,
      locationId: options?.locationId ? LocationId.fromString(options.locationId) : undefined,
    });
    return { stocks: result.items.map(Stock.toDTO), total: result.total };
  }

  async getTransactionHistory(
    variantId: string,
    locationId?: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ transactions: InventoryTransactionDTO[]; total: number }> {
    const variantVo = VariantId.fromString(variantId);
    const result = locationId
      ? await this.transactionRepository.findByVariantAndLocation(
          variantVo,
          LocationId.fromString(locationId),
          options,
        )
      : await this.transactionRepository.findByVariant(variantVo, options);
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

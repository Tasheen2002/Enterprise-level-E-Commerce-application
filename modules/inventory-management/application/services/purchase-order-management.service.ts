import { PurchaseOrder, PurchaseOrderDTO } from "../../domain/entities/purchase-order.entity";
import { PurchaseOrderItem, PurchaseOrderItemDTO } from "../../domain/entities/purchase-order-item.entity";
import { Stock } from "../../domain/entities/stock.entity";
import { InventoryTransaction } from "../../domain/entities/inventory-transaction.entity";
import { PurchaseOrderId } from "../../domain/value-objects/purchase-order-id.vo";
import { PurchaseOrderStatusVO } from "../../domain/value-objects/purchase-order-status.vo";
import { SupplierId } from "../../domain/value-objects/supplier-id.vo";
import { LocationId } from "../../domain/value-objects/location-id.vo";
import { VariantId } from "../../../product-catalog/domain/value-objects/variant-id.vo";
import { IPurchaseOrderRepository } from "../../domain/repositories/purchase-order.repository";
import { IStockRepository } from "../../domain/repositories/stock.repository";
import { IInventoryTransactionRepository } from "../../domain/repositories/inventory-transaction.repository";
import {
  PurchaseOrderNotFoundError,
  InvalidOperationError,
} from "../../domain/errors/inventory-management.errors";

export class PurchaseOrderManagementService {
  constructor(
    private readonly purchaseOrderRepository: IPurchaseOrderRepository,
    private readonly stockRepository: IStockRepository,
    private readonly transactionRepository: IInventoryTransactionRepository,
  ) {}

  async createPurchaseOrder(
    supplierId: string,
    eta?: Date,
  ): Promise<PurchaseOrderDTO> {
    const purchaseOrder = PurchaseOrder.create({ supplierId, eta });

    await this.purchaseOrderRepository.save(purchaseOrder);
    return PurchaseOrder.toDTO(purchaseOrder);
  }

  async updatePurchaseOrderStatus(
    poId: string,
    status: string,
  ): Promise<PurchaseOrderDTO> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.fromString(poId),
    );

    if (!purchaseOrder) {
      throw new PurchaseOrderNotFoundError(poId);
    }

    purchaseOrder.updateStatus(PurchaseOrderStatusVO.create(status));

    await this.purchaseOrderRepository.save(purchaseOrder);
    return PurchaseOrder.toDTO(purchaseOrder);
  }

  async updatePurchaseOrderEta(
    poId: string,
    eta: Date,
  ): Promise<PurchaseOrderDTO> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.fromString(poId),
    );

    if (!purchaseOrder) {
      throw new PurchaseOrderNotFoundError(poId);
    }

    purchaseOrder.updateEta(eta);
    await this.purchaseOrderRepository.save(purchaseOrder);
    return PurchaseOrder.toDTO(purchaseOrder);
  }

  async addPurchaseOrderItem(
    poId: string,
    variantId: string,
    orderedQty: number,
  ): Promise<PurchaseOrderItemDTO> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.fromString(poId),
    );

    if (!purchaseOrder) {
      throw new PurchaseOrderNotFoundError(poId);
    }

    const item = purchaseOrder.addItem(variantId, orderedQty);
    await this.purchaseOrderRepository.save(purchaseOrder);
    return PurchaseOrderItem.toDTO(item);
  }

  // Adds many items to a draft PO in a single load + mutate + save cycle.
  // Used by `CreatePurchaseOrderWithItemsHandler` to avoid the previous
  // race condition where parallel `addPurchaseOrderItem` calls each loaded
  // a stale PO and last-write-wins.
  async addPurchaseOrderItems(
    poId: string,
    items: Array<{ variantId: string; orderedQty: number }>,
  ): Promise<PurchaseOrderItemDTO[]> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.fromString(poId),
    );

    if (!purchaseOrder) {
      throw new PurchaseOrderNotFoundError(poId);
    }

    const added = items.map(({ variantId, orderedQty }) =>
      purchaseOrder.addItem(variantId, orderedQty),
    );
    await this.purchaseOrderRepository.save(purchaseOrder);
    return added.map(PurchaseOrderItem.toDTO);
  }

  async updatePurchaseOrderItem(
    poId: string,
    variantId: string,
    orderedQty: number,
  ): Promise<PurchaseOrderItemDTO> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.fromString(poId),
    );

    if (!purchaseOrder) {
      throw new PurchaseOrderNotFoundError(poId);
    }

    const item = purchaseOrder.updateItemQty(variantId, orderedQty);
    await this.purchaseOrderRepository.save(purchaseOrder);
    return PurchaseOrderItem.toDTO(item);
  }

  async removePurchaseOrderItem(
    poId: string,
    variantId: string,
  ): Promise<void> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.fromString(poId),
    );

    if (!purchaseOrder) {
      throw new PurchaseOrderNotFoundError(poId);
    }

    purchaseOrder.removeItem(variantId);
    await this.purchaseOrderRepository.save(purchaseOrder);
  }

  async receivePurchaseOrderItems(
    poId: string,
    locationId: string,
    items: { variantId: string; receivedQty: number }[],
  ): Promise<{ purchaseOrder: PurchaseOrderDTO; items: PurchaseOrderItemDTO[] }> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.fromString(poId),
    );

    if (!purchaseOrder) {
      throw new PurchaseOrderNotFoundError(poId);
    }

    const updatedItems: PurchaseOrderItem[] = [];
    const locationVo = LocationId.fromString(locationId);

    for (const { variantId, receivedQty } of items) {
      // Aggregate enforces canReceive(), item existence, and auto-transitions
      // status. Throws on violations — no need for additional service-side
      // pre-checks.
      const item = purchaseOrder.receiveItem(variantId, receivedQty);
      updatedItems.push(item);

      const variantVo = VariantId.fromString(variantId);
      let stock = await this.stockRepository.findByVariantAndLocation(variantVo, locationVo);
      if (!stock) {
        stock = Stock.create({ variantId, locationId, onHand: receivedQty, reserved: 0 });
      } else {
        stock.addStock(receivedQty);
      }
      await this.stockRepository.save(stock);

      const transaction = InventoryTransaction.create({
        variantId,
        locationId,
        qtyDelta: receivedQty,
        reason: "po",
      });
      await this.transactionRepository.save(transaction);
    }

    await this.purchaseOrderRepository.save(purchaseOrder);

    return {
      purchaseOrder: PurchaseOrder.toDTO(purchaseOrder),
      items: updatedItems.map(PurchaseOrderItem.toDTO),
    };
  }

  async deletePurchaseOrder(poId: string): Promise<void> {
    const poIdVO = PurchaseOrderId.fromString(poId);
    const purchaseOrder = await this.purchaseOrderRepository.findById(poIdVO);

    if (!purchaseOrder) {
      throw new PurchaseOrderNotFoundError(poId);
    }

    if (!purchaseOrder.isDraft()) {
      throw new InvalidOperationError("Only draft purchase orders can be deleted");
    }

    await this.purchaseOrderRepository.delete(poIdVO);
  }

  async getPurchaseOrder(poId: string): Promise<PurchaseOrderDTO> {
    const po = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.fromString(poId),
    );
    if (!po) {
      throw new PurchaseOrderNotFoundError(poId);
    }
    return PurchaseOrder.toDTO(po);
  }

  async getPurchaseOrderItems(poId: string): Promise<PurchaseOrderItemDTO[]> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.fromString(poId),
    );
    if (!purchaseOrder) {
      throw new PurchaseOrderNotFoundError(poId);
    }
    return purchaseOrder.items.map(PurchaseOrderItem.toDTO);
  }

  async listPurchaseOrders(options?: {
    limit?: number;
    offset?: number;
    status?: string;
    supplierId?: string;
    sortBy?: "createdAt" | "updatedAt" | "eta";
    sortOrder?: "asc" | "desc";
  }): Promise<{ purchaseOrders: PurchaseOrderDTO[]; total: number }> {
    const result = await this.purchaseOrderRepository.findAll({
      limit: options?.limit,
      offset: options?.offset,
      sortBy: options?.sortBy,
      sortOrder: options?.sortOrder,
      status: options?.status ? PurchaseOrderStatusVO.create(options.status) : undefined,
      supplierId: options?.supplierId ? SupplierId.fromString(options.supplierId) : undefined,
    });
    return {
      purchaseOrders: result.items.map(PurchaseOrder.toDTO),
      total: result.total,
    };
  }

  async getOverduePurchaseOrders(): Promise<PurchaseOrderDTO[]> {
    const orders = await this.purchaseOrderRepository.findOverduePurchaseOrders();
    return orders.map(PurchaseOrder.toDTO);
  }

  async getPendingReceival(): Promise<PurchaseOrderDTO[]> {
    const orders = await this.purchaseOrderRepository.findPendingReceival();
    return orders.map(PurchaseOrder.toDTO);
  }
}

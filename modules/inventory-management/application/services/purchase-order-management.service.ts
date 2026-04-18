import { PurchaseOrder, PurchaseOrderDTO } from "../../domain/entities/purchase-order.entity";
import { PurchaseOrderItem, PurchaseOrderItemDTO } from "../../domain/entities/purchase-order-item.entity";
import { Stock } from "../../domain/entities/stock.entity";
import { InventoryTransaction } from "../../domain/entities/inventory-transaction.entity";
import { PurchaseOrderId } from "../../domain/value-objects/purchase-order-id.vo";
import { PurchaseOrderStatus, PurchaseOrderStatusVO } from "../../domain/value-objects/purchase-order-status.vo";
import { IPurchaseOrderRepository } from "../../domain/repositories/purchase-order.repository";
import { IPurchaseOrderItemRepository } from "../../domain/repositories/purchase-order-item.repository";
import { IStockRepository } from "../../domain/repositories/stock.repository";
import { IInventoryTransactionRepository } from "../../domain/repositories/inventory-transaction.repository";
import {
  PurchaseOrderNotFoundError,
  PurchaseOrderNotEditableError,
  PurchaseOrderItemAlreadyExistsError,
  PurchaseOrderItemNotFoundError,
  InvalidOperationError,
} from "../../domain/errors/inventory-management.errors";

export class PurchaseOrderManagementService {
  constructor(
    private readonly purchaseOrderRepository: IPurchaseOrderRepository,
    private readonly purchaseOrderItemRepository: IPurchaseOrderItemRepository,
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
    const poIdVO = PurchaseOrderId.fromString(poId);
    const purchaseOrder = await this.purchaseOrderRepository.findById(poIdVO);

    if (!purchaseOrder) {
      throw new PurchaseOrderNotFoundError(poId);
    }

    if (!purchaseOrder.canEdit()) {
      throw new PurchaseOrderNotEditableError(purchaseOrder.status.getValue());
    }

    const existingItem = await this.purchaseOrderItemRepository.findByPoAndVariant(
      poIdVO,
      variantId,
    );

    if (existingItem) {
      throw new PurchaseOrderItemAlreadyExistsError(variantId);
    }

    const item = PurchaseOrderItem.create({ poId: poIdVO, variantId, orderedQty });

    await this.purchaseOrderItemRepository.save(item);
    return PurchaseOrderItem.toDTO(item);
  }

  async updatePurchaseOrderItem(
    poId: string,
    variantId: string,
    orderedQty: number,
  ): Promise<PurchaseOrderItemDTO> {
    const poIdVO = PurchaseOrderId.fromString(poId);
    const purchaseOrder = await this.purchaseOrderRepository.findById(poIdVO);

    if (!purchaseOrder) {
      throw new PurchaseOrderNotFoundError(poId);
    }

    if (!purchaseOrder.canEdit()) {
      throw new PurchaseOrderNotEditableError(purchaseOrder.status.getValue());
    }

    const item = await this.purchaseOrderItemRepository.findByPoAndVariant(poIdVO, variantId);

    if (!item) {
      throw new PurchaseOrderItemNotFoundError(variantId);
    }

    item.updateOrderedQty(orderedQty);
    await this.purchaseOrderItemRepository.save(item);
    return PurchaseOrderItem.toDTO(item);
  }

  async removePurchaseOrderItem(
    poId: string,
    variantId: string,
  ): Promise<void> {
    const poIdVO = PurchaseOrderId.fromString(poId);
    const purchaseOrder = await this.purchaseOrderRepository.findById(poIdVO);

    if (!purchaseOrder) {
      throw new PurchaseOrderNotFoundError(poId);
    }

    if (!purchaseOrder.canEdit()) {
      throw new PurchaseOrderNotEditableError(purchaseOrder.status.getValue());
    }

    await this.purchaseOrderItemRepository.delete(poIdVO, variantId);
  }

  async receivePurchaseOrderItems(
    poId: string,
    locationId: string,
    items: { variantId: string; receivedQty: number }[],
  ): Promise<{ purchaseOrder: PurchaseOrderDTO; items: PurchaseOrderItemDTO[] }> {
    const poIdVO = PurchaseOrderId.fromString(poId);
    const purchaseOrder = await this.purchaseOrderRepository.findById(poIdVO);

    if (!purchaseOrder) {
      throw new PurchaseOrderNotFoundError(poId);
    }

    if (!purchaseOrder.isSent() && !purchaseOrder.isPartiallyReceived()) {
      throw new InvalidOperationError(
        `Cannot receive items for a purchase order in '${purchaseOrder.status.getValue()}' status`,
      );
    }

    const updatedItems: PurchaseOrderItem[] = [];

    for (const { variantId, receivedQty } of items) {
      const item = await this.purchaseOrderItemRepository.findByPoAndVariant(poIdVO, variantId);

      if (!item) {
        throw new PurchaseOrderItemNotFoundError(variantId);
      }

      item.receiveQuantity(receivedQty);
      await this.purchaseOrderItemRepository.save(item);
      updatedItems.push(item);

      let stock = await this.stockRepository.findByVariantAndLocation(variantId, locationId);
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

    const allItems = await this.purchaseOrderItemRepository.findByPurchaseOrder(poIdVO);

    const allFullyReceived = allItems.every((item) => item.isFullyReceived());
    const anyPartiallyReceived = allItems.some((item) => item.isPartiallyReceived());

    if (allFullyReceived) {
      purchaseOrder.updateStatus(PurchaseOrderStatusVO.create("received"));
    } else if (anyPartiallyReceived || updatedItems.length > 0) {
      if (purchaseOrder.status.getValue() === "sent") {
        purchaseOrder.updateStatus(PurchaseOrderStatusVO.create("part_received"));
      }
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
    const items = await this.purchaseOrderItemRepository.findByPurchaseOrder(
      PurchaseOrderId.fromString(poId),
    );
    return items.map(PurchaseOrderItem.toDTO);
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
      ...options,
      status: options?.status
        ? (options.status.toLowerCase() as PurchaseOrderStatus)
        : undefined,
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

import { v4 as uuidv4 } from "uuid";
import { PurchaseOrder } from "../../domain/entities/purchase-order.entity";
import { PurchaseOrderItem } from "../../domain/entities/purchase-order-item.entity";
import { PurchaseOrderId } from "../../domain/value-objects/purchase-order-id.vo";
import { SupplierId } from "../../domain/value-objects/supplier-id.vo";
import {
  PurchaseOrderStatus,
  PurchaseOrderStatusVO,
} from "../../domain/value-objects/purchase-order-status.vo";
import { IPurchaseOrderRepository } from "../../domain/repositories/purchase-order.repository";
import { IPurchaseOrderItemRepository } from "../../domain/repositories/purchase-order-item.repository";
import { StockManagementService } from "./stock-management.service";

export class PurchaseOrderManagementService {
  constructor(
    private readonly purchaseOrderRepository: IPurchaseOrderRepository,
    private readonly purchaseOrderItemRepository: IPurchaseOrderItemRepository,
    private readonly stockManagementService: StockManagementService,
  ) {}

  async createPurchaseOrder(
    supplierId: string,
    eta?: Date,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = PurchaseOrder.create({
      poId: PurchaseOrderId.create(uuidv4()),
      supplierId: SupplierId.create(supplierId),
      eta,
      status: PurchaseOrderStatusVO.create("draft"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.purchaseOrderRepository.save(purchaseOrder);
    return purchaseOrder;
  }

  async updatePurchaseOrderStatus(
    poId: string,
    status: string,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.create(poId),
    );

    if (!purchaseOrder) {
      throw new Error(`Purchase order with ID ${poId} not found`);
    }

    const updatedPurchaseOrder = purchaseOrder.updateStatus(
      PurchaseOrderStatusVO.create(status),
    );

    await this.purchaseOrderRepository.save(updatedPurchaseOrder);
    return updatedPurchaseOrder;
  }

  async updatePurchaseOrderEta(
    poId: string,
    eta: Date,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.create(poId),
    );

    if (!purchaseOrder) {
      throw new Error(`Purchase order with ID ${poId} not found`);
    }

    const updatedPurchaseOrder = purchaseOrder.updateEta(eta);
    await this.purchaseOrderRepository.save(updatedPurchaseOrder);
    return updatedPurchaseOrder;
  }

  async addPurchaseOrderItem(
    poId: string,
    variantId: string,
    orderedQty: number,
  ): Promise<PurchaseOrderItem> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.create(poId),
    );

    if (!purchaseOrder) {
      throw new Error(`Purchase order with ID ${poId} not found`);
    }

    if (!purchaseOrder.canEdit()) {
      throw new Error("Purchase order cannot be edited in current status");
    }

    // Check if item already exists
    const existingItem =
      await this.purchaseOrderItemRepository.findByPoAndVariant(
        PurchaseOrderId.create(poId),
        variantId,
      );

    if (existingItem) {
      throw new Error(
        `Item with variant ID ${variantId} already exists in this purchase order`,
      );
    }

    const item = PurchaseOrderItem.create({
      poId: PurchaseOrderId.create(poId),
      variantId,
      orderedQty,
      receivedQty: 0,
    });

    await this.purchaseOrderItemRepository.save(item);
    return item;
  }

  async updatePurchaseOrderItem(
    poId: string,
    variantId: string,
    orderedQty: number,
  ): Promise<PurchaseOrderItem> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.create(poId),
    );

    if (!purchaseOrder) {
      throw new Error(`Purchase order with ID ${poId} not found`);
    }

    if (!purchaseOrder.canEdit()) {
      throw new Error("Purchase order cannot be edited in current status");
    }

    const item = await this.purchaseOrderItemRepository.findByPoAndVariant(
      PurchaseOrderId.create(poId),
      variantId,
    );

    if (!item) {
      throw new Error(
        `Item with variant ID ${variantId} not found in purchase order`,
      );
    }

    const updatedItem = item.updateOrderedQty(orderedQty);
    await this.purchaseOrderItemRepository.save(updatedItem);
    return updatedItem;
  }

  async removePurchaseOrderItem(
    poId: string,
    variantId: string,
  ): Promise<void> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.create(poId),
    );

    if (!purchaseOrder) {
      throw new Error(`Purchase order with ID ${poId} not found`);
    }

    if (!purchaseOrder.canEdit()) {
      throw new Error("Purchase order cannot be edited in current status");
    }

    await this.purchaseOrderItemRepository.delete(
      PurchaseOrderId.create(poId),
      variantId,
    );
  }

  async receivePurchaseOrderItems(
    poId: string,
    locationId: string,
    items: { variantId: string; receivedQty: number }[],
  ): Promise<{ purchaseOrder: PurchaseOrder; items: PurchaseOrderItem[] }> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.create(poId),
    );

    if (!purchaseOrder) {
      throw new Error(`Purchase order with ID ${poId} not found`);
    }

    const updatedItems: PurchaseOrderItem[] = [];

    // Process each received item
    for (const { variantId, receivedQty } of items) {
      const item = await this.purchaseOrderItemRepository.findByPoAndVariant(
        PurchaseOrderId.create(poId),
        variantId,
      );

      if (!item) {
        throw new Error(
          `Item with variant ID ${variantId} not found in purchase order`,
        );
      }

      // Update item received quantity
      const updatedItem = item.receiveQuantity(receivedQty);
      await this.purchaseOrderItemRepository.save(updatedItem);
      updatedItems.push(updatedItem);

      // Add stock to inventory
      await this.stockManagementService.addStock(
        variantId,
        locationId,
        receivedQty,
        "po",
      );
    }

    // Check if all items are fully received
    const allItems = await this.purchaseOrderItemRepository.findByPurchaseOrder(
      PurchaseOrderId.create(poId),
    );

    const allFullyReceived = allItems.every((item) => item.isFullyReceived());
    const anyPartiallyReceived = allItems.some((item) =>
      item.isPartiallyReceived(),
    );

    // Update purchase order status
    let updatedPurchaseOrder = purchaseOrder;
    if (allFullyReceived) {
      updatedPurchaseOrder = purchaseOrder.updateStatus(
        PurchaseOrderStatusVO.create("received"),
      );
    } else if (anyPartiallyReceived || updatedItems.length > 0) {
      if (purchaseOrder.getStatus().getValue() === "sent") {
        updatedPurchaseOrder = purchaseOrder.updateStatus(
          PurchaseOrderStatusVO.create("part_received"),
        );
      }
    }

    await this.purchaseOrderRepository.save(updatedPurchaseOrder);

    return {
      purchaseOrder: updatedPurchaseOrder,
      items: updatedItems,
    };
  }

  async deletePurchaseOrder(poId: string): Promise<void> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      PurchaseOrderId.create(poId),
    );

    if (!purchaseOrder) {
      throw new Error(`Purchase order with ID ${poId} not found`);
    }

    // Only allow deletion of draft purchase orders
    if (!purchaseOrder.isDraft()) {
      throw new Error("Only draft purchase orders can be deleted");
    }

    await this.purchaseOrderRepository.delete(PurchaseOrderId.create(poId));
  }

  async getPurchaseOrder(poId: string): Promise<PurchaseOrder | null> {
    return this.purchaseOrderRepository.findById(PurchaseOrderId.create(poId));
  }

  async getPurchaseOrderItems(poId: string): Promise<PurchaseOrderItem[]> {
    return this.purchaseOrderItemRepository.findByPurchaseOrder(
      PurchaseOrderId.create(poId),
    );
  }

  async listPurchaseOrders(options?: {
    limit?: number;
    offset?: number;
    status?: string;
    supplierId?: string;
    sortBy?: "createdAt" | "updatedAt" | "eta";
    sortOrder?: "asc" | "desc";
  }): Promise<{ purchaseOrders: PurchaseOrder[]; total: number }> {
    return this.purchaseOrderRepository.findAll({
      ...options,
      status: options?.status
        ? (options.status.toLowerCase() as PurchaseOrderStatus)
        : undefined,
    });
  }

  async getOverduePurchaseOrders(): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.findOverduePurchaseOrders();
  }

  async getPendingReceival(): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.findPendingReceival();
  }
}

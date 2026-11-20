import {
  IShipmentRepository,
  ShipmentQueryOptions,
  ShipmentFilterOptions,
} from "../../domain/repositories/shipment.repository";
import { IShipmentItemRepository } from "../../domain/repositories/shipment-item.repository";
import {
  Shipment,
  CreateShipmentData,
  CreateShipmentItemData,
} from "../../domain/entities/shipment.entity";
import { ShipmentItem } from "../../domain/entities/shipment-item.entity";
import { ShipmentId, ShipmentStatus } from "../../domain/value-objects";
import { IShipmentAllocationPort } from "../../domain/repositories/shipment-allocation.port";

export interface ListShipmentsResult {
  shipments: Shipment[];
  total: number;
}

export class ShipmentService {
  constructor(
    private readonly shipmentRepository: IShipmentRepository,
    private readonly shipmentItemRepository: IShipmentItemRepository,
    private readonly allocation: IShipmentAllocationPort
  ) {}

  /**
   * A shipment may only contain items of its own order, each once, and never
   * more of an item than was ordered across all shipments that have not failed.
   */
  private async assertAllocatable(
    orderId: string,
    items: { orderItemId: string; qty: number }[],
    excludeShipmentId?: string
  ): Promise<void> {
    const lines = await this.allocation.getOrderLines(orderId, excludeShipmentId);
    if (!lines) {
      throw new Error("Order not found");
    }
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.orderItemId)) {
        throw new Error(`Order item ${item.orderItemId} is listed more than once`);
      }
      seen.add(item.orderItemId);
      const line = lines.get(item.orderItemId);
      if (!line) {
        throw new Error(`Order item ${item.orderItemId} does not belong to this order`);
      }
      const available = line.orderedQty - line.allocatedQty;
      if (item.qty > available) {
        throw new Error(
          `Only ${Math.max(available, 0)} of order item ${item.orderItemId} can still be shipped`
        );
      }
    }
  }

  /** Items can change only until the parcel leaves (created or label printed). */
  private assertItemsEditable(shipment: Shipment): void {
    const status = shipment.getStatus();
    if (!status.isCreated() && !status.isLabelPrinted()) {
      throw new Error(`Items cannot be changed once a shipment is ${status.toString()}`);
    }
  }

  async createShipment(data: CreateShipmentData): Promise<Shipment> {
    // Validate order exists (this would typically involve calling order service)
    if (!data.orderId?.trim()) {
      throw new Error("Order ID is required");
    }

    // The order must exist and the items must belong to it, within the ordered quantity.
    await this.assertAllocatable(data.orderId, data.items ?? []);
    const shipment = Shipment.create(data);

    // Saved together with its items in one statement.
    await this.shipmentRepository.save(shipment);

    return shipment;
  }

  async getShipment(shipmentId: string): Promise<Shipment | null> {
    const id = ShipmentId.fromString(shipmentId);
    const shipment = await this.shipmentRepository.findById(id);

    if (!shipment) {
      return null;
    }

    // Load items for the shipment
    const items =
      await this.shipmentItemRepository.findByShipmentId(shipmentId);

    // Reconstitute with items
    return Shipment.reconstitute({
      shipmentId: shipment.getShipmentId(),
      orderId: shipment.getOrderId(),
      carrier: shipment.getCarrier(),
      service: shipment.getService(),
      labelUrl: shipment.getLabelUrl(),
      isGift: shipment.isGiftOrder(),
      giftMessage: shipment.getGiftMessage(),
      status: shipment.getStatus(),
      items,
      shippedAt: shipment.getShippedAt(),
      deliveredAt: shipment.getDeliveredAt(),
      createdAt: shipment.getCreatedAt(),
      updatedAt: shipment.getUpdatedAt(),
    });
  }

  async updateShipmentStatus(
    shipmentId: string,
    newStatus: ShipmentStatus
  ): Promise<Shipment> {
    const shipment = await this.getShipment(shipmentId);

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    // Update status (this will validate the transition)
    shipment.updateStatus(newStatus);

    // Save the updated shipment
    await this.shipmentRepository.update(shipment);

    return shipment;
  }

  async addShipmentItem(
    shipmentId: string,
    itemData: CreateShipmentItemData
  ): Promise<Shipment> {
    const shipment = await this.getShipment(shipmentId);

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    // Add item to shipment (this will create the item entity)
    this.assertItemsEditable(shipment);
    const current = shipment.getItems().map((item) => ({
      orderItemId: item.getOrderItemId(),
      qty: item.getQty(),
    }));
    await this.assertAllocatable(
      shipment.getOrderId(),
      [...current, { orderItemId: itemData.orderItemId, qty: itemData.qty }],
      shipmentId
    );
    shipment.addItem(itemData);

    // Save the updated shipment
    await this.shipmentRepository.update(shipment);

    // Save the new item
    const items = shipment.getItems();
    const newItem = items[items.length - 1]; // Get the last added item
    await this.shipmentItemRepository.save(newItem);

    return shipment;
  }

  async removeShipmentItem(
    shipmentId: string,
    orderItemId: string
  ): Promise<Shipment> {
    const shipment = await this.getShipment(shipmentId);

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    // Remove item from shipment
    this.assertItemsEditable(shipment);
    shipment.removeItem(orderItemId);

    // Save the updated shipment
    await this.shipmentRepository.update(shipment);

    // Delete the item from repository
    await this.shipmentItemRepository.delete(shipmentId, orderItemId);

    return shipment;
  }

  async updateItemQuantity(
    shipmentId: string,
    orderItemId: string,
    qty: number
  ): Promise<ShipmentItem> {
    const shipment = await this.getShipment(shipmentId);
    if (!shipment) {
      throw new Error("Shipment not found");
    }
    this.assertItemsEditable(shipment);
    const item = shipment.getItems().find((i) => i.getOrderItemId() === orderItemId);
    if (!item) {
      throw new Error("Shipment item not found");
    }
    const items = shipment.getItems().map((i) => ({
      orderItemId: i.getOrderItemId(),
      qty: i.getOrderItemId() === orderItemId ? qty : i.getQty(),
    }));
    await this.assertAllocatable(shipment.getOrderId(), items, shipmentId);
    item.updateQty(qty);
    await this.shipmentItemRepository.update(item);
    return item;
  }

  async listShipments(
    filters: Partial<ShipmentFilterOptions>,
    options: Partial<ShipmentQueryOptions> = {}
  ): Promise<ListShipmentsResult> {
    const queryOptions: ShipmentQueryOptions = {
      limit: options.limit || 50,
      offset: options.offset || 0,
      sortBy: options.sortBy || "createdAt",
      sortOrder: options.sortOrder || "desc",
    };

    const shipments = await this.shipmentRepository.findWithFilters(
      filters,
      queryOptions
    );
    const total = await this.shipmentRepository.count(filters);

    // Load items for each shipment
    const shipmentsWithItems = await Promise.all(
      shipments.map(async (shipment) => {
        const items = await this.shipmentItemRepository.findByShipmentId(
          shipment.getShipmentId().getValue()
        );

        return Shipment.reconstitute({
          shipmentId: shipment.getShipmentId(),
          orderId: shipment.getOrderId(),
          carrier: shipment.getCarrier(),
          service: shipment.getService(),
          labelUrl: shipment.getLabelUrl(),
          isGift: shipment.isGiftOrder(),
          giftMessage: shipment.getGiftMessage(),
          status: shipment.getStatus(),
          items,
          shippedAt: shipment.getShippedAt(),
          deliveredAt: shipment.getDeliveredAt(),
          createdAt: shipment.getCreatedAt(),
          updatedAt: shipment.getUpdatedAt(),
        });
      })
    );

    return {
      shipments: shipmentsWithItems,
      total,
    };
  }

  async getShipmentsByOrderId(orderId: string): Promise<Shipment[]> {
    const shipments = await this.shipmentRepository.findByOrderId(orderId);

    // Load items for each shipment
    return Promise.all(
      shipments.map(async (shipment) => {
        const items = await this.shipmentItemRepository.findByShipmentId(
          shipment.getShipmentId().getValue()
        );

        return Shipment.reconstitute({
          shipmentId: shipment.getShipmentId(),
          orderId: shipment.getOrderId(),
          carrier: shipment.getCarrier(),
          service: shipment.getService(),
          labelUrl: shipment.getLabelUrl(),
          isGift: shipment.isGiftOrder(),
          giftMessage: shipment.getGiftMessage(),
          status: shipment.getStatus(),
          items,
          shippedAt: shipment.getShippedAt(),
          deliveredAt: shipment.getDeliveredAt(),
          createdAt: shipment.getCreatedAt(),
          updatedAt: shipment.getUpdatedAt(),
        });
      })
    );
  }

  async updateShipmentCarrier(
    shipmentId: string,
    carrier: string
  ): Promise<Shipment> {
    const shipment = await this.getShipment(shipmentId);

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    shipment.updateCarrier(carrier);
    await this.shipmentRepository.update(shipment);

    return shipment;
  }

  async updateShipmentService(
    shipmentId: string,
    service: string
  ): Promise<Shipment> {
    const shipment = await this.getShipment(shipmentId);

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    shipment.updateService(service);
    await this.shipmentRepository.update(shipment);

    return shipment;
  }

  async updateShipmentGift(
    shipmentId: string,
    isGift: boolean,
    giftMessage?: string
  ): Promise<Shipment> {
    const shipment = await this.getShipment(shipmentId);

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    shipment.updateGift(isGift, giftMessage);
    await this.shipmentRepository.update(shipment);

    return shipment;
  }

  async updateShipmentLabelUrl(
    shipmentId: string,
    labelUrl: string
  ): Promise<Shipment> {
    const shipment = await this.getShipment(shipmentId);

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    shipment.updateLabelUrl(labelUrl);
    await this.shipmentRepository.update(shipment);

    return shipment;
  }

  async deleteShipment(shipmentId: string): Promise<void> {
    const id = ShipmentId.fromString(shipmentId);

    // Check if shipment exists
    const exists = await this.shipmentRepository.exists(id);
    if (!exists) {
      throw new Error("Shipment not found");
    }

    // Delete all items first
    await this.shipmentItemRepository.deleteByShipmentId(shipmentId);

    // Delete the shipment
    await this.shipmentRepository.delete(id);
  }
}

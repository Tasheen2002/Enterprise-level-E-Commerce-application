import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { ShipmentManagementService } from "../services/shipment-management.service";
import { OrderShipment } from "../../domain/entities/order-shipment.entity";
import { OrderNotFoundError, OrderShipmentNotFoundError } from "../../domain/errors/order-management.errors";

export interface TrackOrderQuery extends IQuery {
  readonly orderNumber?: string;
  readonly contact?: string;
  readonly trackingNumber?: string;
}

export interface TrackOrderResult {
  orderId: string;
  orderNumber: string;
  status: string;
  items: unknown[];
  totals: unknown;
  shipments: unknown[];
  billingAddress: unknown;
  shippingAddress: unknown;
  createdAt: string;
  updatedAt: string;
}

export class TrackOrderHandler implements IQueryHandler<TrackOrderQuery, QueryResult<TrackOrderResult>> {
  constructor(
    private readonly orderService: OrderManagementService,
    private readonly shipmentService: ShipmentManagementService,
  ) {}

  async handle(query: TrackOrderQuery): Promise<QueryResult<TrackOrderResult>> {
    if (query.orderNumber && query.contact) {
      const order = await this.orderService.getOrderByNumber(query.orderNumber);
      if (!order) throw new OrderNotFoundError(query.orderNumber);

      const orderAddress = await this.orderService.getOrderAddress(order.id);
      const billing = orderAddress?.billingAddress;
      const shipping = orderAddress?.shippingAddress;

      const contactLower = query.contact.toLowerCase().trim();
      const contactMatches =
        contactLower === (billing?.email as string | undefined)?.toLowerCase().trim() ||
        contactLower === (shipping?.email as string | undefined)?.toLowerCase().trim() ||
        query.contact === (billing?.phone as string | undefined)?.trim() ||
        query.contact === (shipping?.phone as string | undefined)?.trim();

      if (!contactMatches) {
        throw new Error("CONTACT_MISMATCH");
      }

      const shipments = await this.shipmentService.getShipmentsByOrderId(order.id);

      return QueryResult.success<TrackOrderResult>({
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        items: order.items,
        totals: order.totals,
        shipments,
        billingAddress: billing ?? {},
        shippingAddress: shipping ?? {},
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    }

    if (query.trackingNumber) {
      const shipmentDTO = await this.shipmentService.getShipmentByTrackingNumber(query.trackingNumber);
      if (!shipmentDTO) throw new OrderShipmentNotFoundError(query.trackingNumber);

      return QueryResult.success<TrackOrderResult>({
        orderId: shipmentDTO.orderId,
        orderNumber: "",
        status: "",
        items: [],
        totals: {},
        shipments: [shipmentDTO],
        billingAddress: {},
        shippingAddress: {},
        createdAt: "",
        updatedAt: "",
      });
    }

    throw new Error("INVALID_TRACK_REQUEST");
  }
}

import { api, ApiCallError } from "@/lib/api-client";
export { ApiCallError };
import type {
  Order,
  CreateOrderRequest,
  TrackOrderResult,
  ListOrdersResult,
  AddressSnapshot,
} from "./types";

function getHeaders() {
  if (typeof window === "undefined") return {};
  const guestToken = localStorage.getItem("ts_guest_token");
  return guestToken
    ? { headers: { "x-guest-token": guestToken, "guest-token": guestToken } }
    : {};
}

export interface InitializeCheckoutRequest {
  cartId: string;
  expiresInMinutes?: number;
}

export interface InitializeCheckoutResponse {
  checkoutId: string;
  cartId: string;
  status: string;
  totalAmount: number;
  currency: string;
  expiresAt: string;
}

export interface CreateStripePaymentIntentRequest {
  orderId?: string;
  checkoutId?: string;
  amount: number;
  currency?: string;
  idempotencyKey?: string;
}

export interface CreateStripePaymentIntentResponse {
  intentId: string;
  clientSecret: string;
  stripeIntentId: string;
}

export interface CompleteCheckoutWithOrderRequest {
  paymentIntentId: string;
  shippingAddress: AddressSnapshot;
  billingAddress?: AddressSnapshot;
}

export interface CompleteCheckoutWithOrderResponse {
  orderId: string;
  orderNo: string;
  checkoutId: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export async function initializeCheckout(input: InitializeCheckoutRequest): Promise<InitializeCheckoutResponse> {
  return api.post<InitializeCheckoutResponse>("/checkout/initialize", input, getHeaders());
}

export async function createStripePaymentIntent(input: CreateStripePaymentIntentRequest): Promise<CreateStripePaymentIntentResponse> {
  return api.post<CreateStripePaymentIntentResponse>("/payments/stripe/create-intent", input, getHeaders());
}

export async function completeCheckoutWithOrder(checkoutId: string, input: CompleteCheckoutWithOrderRequest): Promise<CompleteCheckoutWithOrderResponse> {
  return api.post<CompleteCheckoutWithOrderResponse>(`/checkout/${checkoutId}/complete-with-order`, input, getHeaders());
}

export async function createOrder(input: CreateOrderRequest): Promise<Order> {
  return api.post<Order>("/orders", input);
}

export async function getOrder(orderId: string): Promise<Order> {
  return api.get<Order>(`/orders/${orderId}`);
}

export async function getOrderByNumber(orderNumber: string): Promise<Order> {
  return api.get<Order>(`/orders/number/${orderNumber}`);
}

export interface TrackOrderParams {
  orderNumber?: string;
  contact?: string;
  trackingNumber?: string;
}

export async function trackOrder(params: TrackOrderParams): Promise<TrackOrderResult> {
  const queryParams = new URLSearchParams();
  if (params.orderNumber) queryParams.set("orderNumber", params.orderNumber);
  if (params.contact) queryParams.set("contact", params.contact);
  if (params.trackingNumber) queryParams.set("trackingNumber", params.trackingNumber);

  return api.get<TrackOrderResult>(`/orders/track?${queryParams.toString()}`);
}

export async function cancelOrder(orderId: string): Promise<Order> {
  return api.post<Order>(`/orders/${orderId}/cancel`, {});
}

export interface ListOrdersParams {
  limit?: number;
  offset?: number;
  status?: string;
}

export async function listUserOrders(params?: ListOrdersParams): Promise<ListOrdersResult> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set("limit", String(params.limit));
  if (params?.offset) queryParams.set("offset", String(params.offset));
  if (params?.status) queryParams.set("status", params.status);

  return api.get<ListOrdersResult>(`/orders?${queryParams.toString()}`);
}

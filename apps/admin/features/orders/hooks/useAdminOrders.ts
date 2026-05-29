"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "../api";

export function useAdminOrders(query?: Parameters<typeof ordersApi.getOrders>[0]) {
  return useQuery({
    queryKey: ["admin-orders", query],
    queryFn: () => ordersApi.getOrders(query),
  });
}

export function useAdminOrder(orderId: string) {
  return useQuery({
    queryKey: ["admin-order", orderId],
    queryFn: () => ordersApi.getOrder(orderId),
    enabled: !!orderId,
  });
}

export function useAdminOrderStatusHistory(orderId: string) {
  return useQuery({
    queryKey: ["admin-order-status-history", orderId],
    queryFn: () => ordersApi.getOrderStatusHistory(orderId),
    enabled: !!orderId,
  });
}

export function useAdminOrderEvents(orderId: string) {
  return useQuery({
    queryKey: ["admin-order-events", orderId],
    queryFn: () => ordersApi.getOrderEvents(orderId),
    enabled: !!orderId,
  });
}

export function useAdminUpdateOrderStatus(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => ordersApi.updateOrderStatus(orderId, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.setQueryData(["admin-order", orderId], data);
      queryClient.invalidateQueries({ queryKey: ["admin-order-status-history", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-events", orderId] });
    },
  });
}

export function useAdminUpdateOrderTotals(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (totals: { tax: number; shipping: number; discount: number }) =>
      ordersApi.updateOrderTotals(orderId, totals),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.setQueryData(["admin-order", orderId], data);
      queryClient.invalidateQueries({ queryKey: ["admin-order-events", orderId] });
    },
  });
}

export function useAdminMarkOrderPaid(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ordersApi.markOrderAsPaid(orderId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.setQueryData(["admin-order", orderId], data);
      queryClient.invalidateQueries({ queryKey: ["admin-order-status-history", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-events", orderId] });
    },
  });
}

export function useAdminMarkOrderFulfilled(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ordersApi.markOrderAsFulfilled(orderId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.setQueryData(["admin-order", orderId], data);
      queryClient.invalidateQueries({ queryKey: ["admin-order-status-history", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-events", orderId] });
    },
  });
}

export function useAdminCancelOrder(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ordersApi.cancelOrder(orderId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.setQueryData(["admin-order", orderId], data);
      queryClient.invalidateQueries({ queryKey: ["admin-order-status-history", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-events", orderId] });
    },
  });
}

export function useAdminCreateShipment(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof ordersApi.createShipment>[1]) =>
      ordersApi.createShipment(orderId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-events", orderId] });
    },
  });
}

export function useAdminMarkShipmentShipped(orderId: string, shipmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof ordersApi.markShipmentShipped>[2]) =>
      ordersApi.markShipmentShipped(orderId, shipmentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-events", orderId] });
    },
  });
}

export function useAdminMarkShipmentDelivered(orderId: string, shipmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body?: Parameters<typeof ordersApi.markShipmentDelivered>[2]) =>
      ordersApi.markShipmentDelivered(orderId, shipmentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-events", orderId] });
    },
  });
}

export function useAdminUpdateShipmentTracking(orderId: string, shipmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof ordersApi.updateShipmentTracking>[2]) =>
      ordersApi.updateShipmentTracking(orderId, shipmentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-events", orderId] });
    },
  });
}

export function useAdminPreorders(query?: Parameters<typeof ordersApi.getPreorders>[0]) {
  return useQuery({
    queryKey: ["admin-preorders", query],
    queryFn: () => ordersApi.getPreorders(query),
  });
}

export function useAdminBackorders(query?: Parameters<typeof ordersApi.getBackorders>[0]) {
  return useQuery({
    queryKey: ["admin-backorders", query],
    queryFn: () => ordersApi.getBackorders(query),
  });
}

export function useAdminUpdatePreorderDate(orderItemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (releaseDate: Date) => ordersApi.updatePreorderReleaseDate(orderItemId, releaseDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-preorders"] });
    },
  });
}

export function useAdminUpdateBackorderEta(orderItemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (promisedEta: Date) => ordersApi.updateBackorderEta(orderItemId, promisedEta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-backorders"] });
    },
  });
}

export function useAdminNotifyPreorder(orderItemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ordersApi.notifyPreorder(orderItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-preorders"] });
    },
  });
}

export function useAdminNotifyBackorder(orderItemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ordersApi.notifyBackorder(orderItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-backorders"] });
    },
  });
}

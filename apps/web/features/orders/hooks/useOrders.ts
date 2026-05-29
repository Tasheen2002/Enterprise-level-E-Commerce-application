"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createOrder,
  getOrder,
  getOrderByNumber,
  trackOrder,
  cancelOrder,
  listUserOrders,
  ListOrdersParams,
  TrackOrderParams,
} from "../api";
import type { CreateOrderRequest } from "../types";

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
  });
}

export function useOrderByNumber(orderNumber: string) {
  return useQuery({
    queryKey: ["order-by-number", orderNumber],
    queryFn: () => getOrderByNumber(orderNumber),
    enabled: !!orderNumber,
  });
}

export function useUserOrders(params?: ListOrdersParams) {
  return useQuery({
    queryKey: ["user-orders", params],
    queryFn: () => listUserOrders(params),
  });
}

export function useTrackOrder(params: TrackOrderParams, enabled = false) {
  return useQuery({
    queryKey: ["track-order", params],
    queryFn: () => trackOrder(params),
    enabled: enabled && (!!params.trackingNumber || (!!params.orderNumber && !!params.contact)),
    retry: false,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateOrderRequest) => createOrder(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.setQueryData(["order", data.id], data);
      queryClient.setQueryData(["order-by-number", data.orderNumber], data);
    },
  });
}

export function useCancelOrder(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.setQueryData(["order", orderId], data);
      queryClient.setQueryData(["order-by-number", data.orderNumber], data);
    },
  });
}

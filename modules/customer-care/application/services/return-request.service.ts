import {
  IReturnRequestRepository,
  ReturnRequestQueryOptions,
  ReturnRequestFilterOptions,
} from "../../domain/repositories/return-request.repository.js";
import { ReturnRequest } from "../../domain/entities/return-request.entity.js";
import { RmaId, RmaType, RmaStatus } from "../../domain/value-objects/index.js";

export class ReturnRequestService {
  constructor(private readonly returnRepository: IReturnRequestRepository) {}

  async createReturnRequest(data: {
    orderId: string;
    type: RmaType;
    reason?: string;
  }): Promise<ReturnRequest> {
    const request = ReturnRequest.create({
      orderId: data.orderId,
      type: data.type,
      reason: data.reason,
    });

    await this.returnRepository.save(request);
    return request;
  }

  async getReturnRequest(rmaId: string): Promise<ReturnRequest | null> {
    return await this.returnRepository.findById(RmaId.create(rmaId));
  }

  async updateReturnRequest(
    rmaId: string,
    data: {
      status?: RmaStatus;
      reason?: string;
    }
  ): Promise<void> {
    const request = await this.returnRepository.findById(RmaId.create(rmaId));

    if (!request) {
      throw new Error(`Return request with ID ${rmaId} not found`);
    }

    if (data.status) {
      request.updateStatus(data.status);
    }

    if (data.reason) {
      request.updateReason(data.reason);
    }

    await this.returnRepository.update(request);
  }

  async deleteReturnRequest(rmaId: string): Promise<void> {
    const exists = await this.returnRepository.exists(RmaId.create(rmaId));

    if (!exists) {
      throw new Error(`Return request with ID ${rmaId} not found`);
    }

    await this.returnRepository.delete(RmaId.create(rmaId));
  }

  async getReturnRequestsByOrder(
    orderId: string,
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]> {
    return await this.returnRepository.findByOrderId(orderId, options);
  }

  async getReturnRequestsByType(
    type: RmaType,
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]> {
    return await this.returnRepository.findByType(type, options);
  }

  async getReturnRequestsByStatus(
    status: RmaStatus,
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]> {
    return await this.returnRepository.findByStatus(status, options);
  }

  async getPendingEligibility(
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]> {
    return await this.returnRepository.findPendingEligibility(options);
  }

  async getApprovedReturns(
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]> {
    return await this.returnRepository.findApproved(options);
  }

  async getInTransitReturns(
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]> {
    return await this.returnRepository.findInTransit(options);
  }

  async getRecentReturnsByOrder(
    orderId: string,
    limit?: number
  ): Promise<ReturnRequest[]> {
    return await this.returnRepository.findRecentByOrder(orderId, limit);
  }

  async getReturnRequestsWithFilters(
    filters: ReturnRequestFilterOptions,
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]> {
    return await this.returnRepository.findWithFilters(filters, options);
  }

  async getAllReturnRequests(
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]> {
    return await this.returnRepository.findAll(options);
  }

  async countReturnsByStatus(status: RmaStatus): Promise<number> {
    return await this.returnRepository.countByStatus(status);
  }

  async countReturnsByOrder(orderId: string): Promise<number> {
    return await this.returnRepository.countByOrderId(orderId);
  }

  async countReturnsByType(type: RmaType): Promise<number> {
    return await this.returnRepository.countByType(type);
  }

  async countReturns(filters?: ReturnRequestFilterOptions): Promise<number> {
    return await this.returnRepository.count(filters);
  }

  async returnRequestExists(rmaId: string): Promise<boolean> {
    return await this.returnRepository.exists(RmaId.create(rmaId));
  }

  async hasOrderReturns(orderId: string): Promise<boolean> {
    return await this.returnRepository.hasOrderReturns(orderId);
  }

  async hasActiveReturnForOrder(orderId: string): Promise<boolean> {
    return await this.returnRepository.hasActiveReturnForOrder(orderId);
  }
}

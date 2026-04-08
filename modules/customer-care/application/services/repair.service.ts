import {
  IRepairRepository,
  RepairQueryOptions,
  RepairFilterOptions,
} from "../../domain/repositories/repair.repository.js";
import { Repair } from "../../domain/entities/repair.entity.js";
import { RepairId, RepairStatus } from "../../domain/value-objects/index.js";

export class RepairService {
  constructor(private readonly repairRepository: IRepairRepository) {}

  async createRepair(data: {
    orderItemId: string;
    notes?: string;
  }): Promise<Repair> {
    const repair = Repair.create({
      orderItemId: data.orderItemId,
      notes: data.notes,
    });
    await this.repairRepository.save(repair);
    return repair;
  }

  async getRepairById(repairId: string): Promise<Repair | null> {
    return await this.repairRepository.findById(RepairId.create(repairId));
  }

  async updateRepair(
    repairId: string,
    data: { notes?: string; status?: RepairStatus }
  ): Promise<void> {
    const repair = await this.repairRepository.findById(
      RepairId.create(repairId)
    );
    if (!repair) {
      throw new Error(`Repair not found for id=${repairId}`);
    }
    if (data.notes !== undefined) {
      repair.updateNotes(data.notes);
    }
    if (data.status !== undefined) {
      repair.updateStatus(data.status);
    }
    await this.repairRepository.update(repair);
  }

  async deleteRepair(repairId: string): Promise<void> {
    await this.repairRepository.delete(RepairId.create(repairId));
  }

  async getRepairsByOrderItemId(
    orderItemId: string,
    options?: RepairQueryOptions
  ): Promise<Repair[]> {
    return await this.repairRepository.findByOrderItemId(orderItemId, options);
  }

  async getRepairsByStatus(
    status: RepairStatus,
    options?: RepairQueryOptions
  ): Promise<Repair[]> {
    return await this.repairRepository.findByStatus(status, options);
  }

  async getAllRepairs(options?: RepairQueryOptions): Promise<Repair[]> {
    return await this.repairRepository.findAll(options);
  }

  async getRepairsWithFilters(
    filters: RepairFilterOptions,
    options?: RepairQueryOptions
  ): Promise<Repair[]> {
    return await this.repairRepository.findWithFilters(filters, options);
  }

  async getPendingRepairs(options?: RepairQueryOptions): Promise<Repair[]> {
    return await this.repairRepository.findPending(options);
  }

  async getInProgressRepairs(options?: RepairQueryOptions): Promise<Repair[]> {
    return await this.repairRepository.findInProgress(options);
  }

  async getCompletedRepairs(options?: RepairQueryOptions): Promise<Repair[]> {
    return await this.repairRepository.findCompleted(options);
  }

  async getFailedRepairs(options?: RepairQueryOptions): Promise<Repair[]> {
    return await this.repairRepository.findFailed(options);
  }

  async countRepairsByStatus(status: RepairStatus): Promise<number> {
    return await this.repairRepository.countByStatus(status);
  }

  async countRepairsByOrderItemId(orderItemId: string): Promise<number> {
    return await this.repairRepository.countByOrderItemId(orderItemId);
  }

  async countRepairs(filters?: RepairFilterOptions): Promise<number> {
    return await this.repairRepository.count(filters);
  }

  async repairExists(repairId: string): Promise<boolean> {
    return await this.repairRepository.exists(RepairId.create(repairId));
  }

  async hasActiveRepairForItem(orderItemId: string): Promise<boolean> {
    return await this.repairRepository.hasActiveRepairForItem(orderItemId);
  }

  async appendNotes(repairId: string, additionalNotes: string): Promise<void> {
    const repair = await this.repairRepository.findById(
      RepairId.create(repairId)
    );
    if (!repair) {
      throw new Error(`Repair not found for id=${repairId}`);
    }
    repair.appendNotes(additionalNotes);
    await this.repairRepository.update(repair);
  }

  async startRepair(repairId: string): Promise<void> {
    const repair = await this.repairRepository.findById(
      RepairId.create(repairId)
    );
    if (!repair) {
      throw new Error(`Repair not found for id=${repairId}`);
    }
    repair.startRepair();
    await this.repairRepository.update(repair);
  }

  async completeRepair(repairId: string): Promise<void> {
    const repair = await this.repairRepository.findById(
      RepairId.create(repairId)
    );
    if (!repair) {
      throw new Error(`Repair not found for id=${repairId}`);
    }
    repair.complete();
    await this.repairRepository.update(repair);
  }

  async markRepairAsFailed(repairId: string): Promise<void> {
    const repair = await this.repairRepository.findById(
      RepairId.create(repairId)
    );
    if (!repair) {
      throw new Error(`Repair not found for id=${repairId}`);
    }
    repair.markAsFailed();
    await this.repairRepository.update(repair);
  }

  async cancelRepair(repairId: string): Promise<void> {
    const repair = await this.repairRepository.findById(
      RepairId.create(repairId)
    );
    if (!repair) {
      throw new Error(`Repair not found for id=${repairId}`);
    }
    repair.cancel();
    await this.repairRepository.update(repair);
  }
}

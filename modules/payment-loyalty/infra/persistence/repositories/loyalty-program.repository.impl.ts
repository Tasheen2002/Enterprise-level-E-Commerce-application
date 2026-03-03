import { PrismaClient } from "@prisma/client";
import { ILoyaltyProgramRepository } from "../../../domain/repositories/loyalty-program.repository";
import {
  LoyaltyProgram,
  EarnRule,
  BurnRule,
  LoyaltyTier,
} from "../../../domain/entities/loyalty-program.entity";

export class LoyaltyProgramRepository implements ILoyaltyProgramRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(program: LoyaltyProgram): Promise<void> {
    const data = this.dehydrate(program);
    await (this.prisma as any).loyaltyProgram.create({ data });
  }

  async update(program: LoyaltyProgram): Promise<void> {
    const data = this.dehydrate(program);
    const { programId, ...updateData } = data;
    await (this.prisma as any).loyaltyProgram.update({
      where: { programId },
      data: updateData,
    });
  }

  async delete(programId: string): Promise<void> {
    await (this.prisma as any).loyaltyProgram.delete({
      where: { programId },
    });
  }

  async findById(programId: string): Promise<LoyaltyProgram | null> {
    const record = await (this.prisma as any).loyaltyProgram.findUnique({
      where: { programId },
    });
    return record ? this.hydrate(record) : null;
  }

  async findByName(name: string): Promise<LoyaltyProgram | null> {
    const record = await (this.prisma as any).loyaltyProgram.findFirst({
      where: { name },
    });
    return record ? this.hydrate(record) : null;
  }

  async findAll(): Promise<LoyaltyProgram[]> {
    const records = await (this.prisma as any).loyaltyProgram.findMany({
      orderBy: { name: "asc" },
    });
    return records.map((record: any) => this.hydrate(record));
  }

  async exists(programId: string): Promise<boolean> {
    const count = await (this.prisma as any).loyaltyProgram.count({
      where: { programId },
    });
    return count > 0;
  }

  private hydrate(record: any): LoyaltyProgram {
    return LoyaltyProgram.reconstitute({
      programId: record.programId,
      name: record.name,
      earnRules: record.earnRules as EarnRule | EarnRule[],
      burnRules: record.burnRules as BurnRule | BurnRule[],
      tiers: record.tiers as LoyaltyTier[],
    });
  }

  private dehydrate(program: LoyaltyProgram): any {
    return {
      programId: program.programId,
      name: program.name,
      earnRules: program.earnRules,
      burnRules: program.burnRules,
      tiers: program.tiers,
    };
  }
}

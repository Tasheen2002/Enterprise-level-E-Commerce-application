import { PrismaClient } from "@prisma/client";
import { ILoyaltyAccountRepository } from "../../domain/repositories/loyalty-account.repository";
import { ILoyaltyProgramRepository } from "../../domain/repositories/loyalty-program.repository";
import { ILoyaltyTransactionRepository } from "../../domain/repositories/loyalty-transaction.repository";
import { LoyaltyAccount } from "../../domain/entities/loyalty-account.entity";
import {
  LoyaltyProgram,
  EarnRule,
  BurnRule,
  LoyaltyTier,
} from "../../domain/entities/loyalty-program.entity";
import { LoyaltyTransaction } from "../../domain/entities/loyalty-transaction.entity";
import { LoyaltyReason } from "../../domain/value-objects/loyalty-reason.vo";

export interface CreateLoyaltyProgramDto {
  name: string;
  earnRules: EarnRule | EarnRule[];
  burnRules: BurnRule | BurnRule[];
  tiers: LoyaltyTier[];
}

export interface AwardPointsDto {
  userId: string;
  programId: string;
  points: number;
  reason: string;
  orderId?: string;
}

export interface RedeemPointsDto {
  userId: string;
  programId: string;
  points: number;
  orderId: string;
}

export interface LoyaltyProgramDto {
  programId: string;
  name: string;
  earnRules: EarnRule | EarnRule[];
  burnRules: BurnRule | BurnRule[];
  tiers: LoyaltyTier[];
}

export interface LoyaltyAccountDto {
  accountId: string;
  userId: string;
  programId: string;
  pointsBalance: number;
  tier: string | null;
  updatedAt: Date;
}

export interface LoyaltyTransactionDto {
  ltxnId: string;
  accountId: string;
  pointsDelta: number;
  reason: string;
  orderId: string | null;
  createdAt: Date;
}

export class LoyaltyService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly loyaltyAccountRepo: ILoyaltyAccountRepository,
    private readonly loyaltyProgramRepo: ILoyaltyProgramRepository,
    private readonly loyaltyTxnRepo: ILoyaltyTransactionRepository,
  ) {}

  async createLoyaltyProgram(
    dto: CreateLoyaltyProgramDto,
  ): Promise<LoyaltyProgramDto> {
    const program = LoyaltyProgram.create({
      name: dto.name,
      earnRules: dto.earnRules,
      burnRules: dto.burnRules,
      tiers: dto.tiers,
    });

    await this.loyaltyProgramRepo.save(program);

    return this.toLoyaltyProgramDto(program);
  }

  async enrollUser(
    userId: string,
    programId: string,
  ): Promise<LoyaltyAccountDto> {
    // Check if user is already enrolled
    const existing = await this.loyaltyAccountRepo.findByUserIdAndProgramId(
      userId,
      programId,
    );
    if (existing) {
      throw new Error("User is already enrolled in this program");
    }

    // Verify program exists
    const program = await this.loyaltyProgramRepo.findById(programId);
    if (!program) {
      throw new Error(`Loyalty program ${programId} not found`);
    }

    const account = LoyaltyAccount.create({
      userId,
      programId,
    });

    await this.loyaltyAccountRepo.save(account);

    return this.toLoyaltyAccountDto(account);
  }

  async awardPoints(dto: AwardPointsDto): Promise<LoyaltyAccountDto> {
    // Get or create loyalty account
    let account = await this.loyaltyAccountRepo.findByUserIdAndProgramId(
      dto.userId,
      dto.programId,
    );

    if (!account) {
      // Auto-enroll user if not already enrolled
      account = await this.enrollUserInternal(dto.userId, dto.programId);
    }

    // Get program to check tier updates
    const program = await this.loyaltyProgramRepo.findById(dto.programId);
    if (!program) {
      throw new Error(`Loyalty program ${dto.programId} not found`);
    }

    // Add points to account
    account.addPoints(dto.points);

    // Update tier if necessary
    const newTier = program.getTierForPoints(account.pointsBalance);
    if (newTier && newTier.name !== account.tier) {
      account.updateTier(newTier.name);
    }

    // Create transaction record
    const transaction = LoyaltyTransaction.create({
      accountId: account.accountId,
      pointsDelta: dto.points,
      reason: LoyaltyReason.fromString(dto.reason),
      orderId: dto.orderId || null,
    });

    await this.prisma.$transaction([
      this.loyaltyAccountRepo.update(account) as any,
      this.loyaltyTxnRepo.save(transaction) as any,
    ]);

    return this.toLoyaltyAccountDto(account);
  }

  async redeemPoints(dto: RedeemPointsDto): Promise<LoyaltyAccountDto> {
    const account = await this.loyaltyAccountRepo.findByUserIdAndProgramId(
      dto.userId,
      dto.programId,
    );

    if (!account) {
      throw new Error("User is not enrolled in this loyalty program");
    }

    if (!account.hasEnoughPoints(dto.points)) {
      throw new Error(
        `Insufficient points. Available: ${account.pointsBalance}, Required: ${dto.points}`,
      );
    }

    // Get program to check tier updates
    const program = await this.loyaltyProgramRepo.findById(dto.programId);
    if (!program) {
      throw new Error(`Loyalty program ${dto.programId} not found`);
    }

    // Subtract points from account
    account.subtractPoints(dto.points);

    // Update tier if necessary (downgrade)
    const newTier = program.getTierForPoints(account.pointsBalance);
    const newTierName = newTier ? newTier.name : null;
    if (newTierName !== account.tier) {
      account.updateTier(newTierName || "");
    }

    // Create transaction record (negative points delta for redemption)
    const transaction = LoyaltyTransaction.create({
      accountId: account.accountId,
      pointsDelta: -dto.points,
      reason: LoyaltyReason.purchase(),
      orderId: dto.orderId,
    });

    await this.prisma.$transaction([
      this.loyaltyAccountRepo.update(account) as any,
      this.loyaltyTxnRepo.save(transaction) as any,
    ]);

    return this.toLoyaltyAccountDto(account);
  }

  async calculatePointsForPurchase(
    programId: string,
    amount: number,
  ): Promise<number> {
    const program = await this.loyaltyProgramRepo.findById(programId);
    if (!program) {
      throw new Error(`Loyalty program ${programId} not found`);
    }

    return program.calculatePointsForPurchase(amount);
  }

  async getLoyaltyAccount(
    userId: string,
    programId: string,
  ): Promise<LoyaltyAccountDto | null> {
    const account = await this.loyaltyAccountRepo.findByUserIdAndProgramId(
      userId,
      programId,
    );
    return account ? this.toLoyaltyAccountDto(account) : null;
  }

  async getLoyaltyProgram(
    programId: string,
  ): Promise<LoyaltyProgramDto | null> {
    const program = await this.loyaltyProgramRepo.findById(programId);
    return program ? this.toLoyaltyProgramDto(program) : null;
  }

  async getAllLoyaltyPrograms(): Promise<LoyaltyProgramDto[]> {
    const programs = await this.loyaltyProgramRepo.findAll();
    return programs.map((p) => this.toLoyaltyProgramDto(p));
  }

  async getLoyaltyTransactions(
    accountId: string,
  ): Promise<LoyaltyTransactionDto[]> {
    const transactions = await this.loyaltyTxnRepo.findByAccountId(accountId);
    return transactions.map((t) => this.toLoyaltyTransactionDto(t));
  }

  async getUserPointsBalance(
    userId: string,
    programId: string,
  ): Promise<number | null> {
    const account = await this.loyaltyAccountRepo.findByUserIdAndProgramId(
      userId,
      programId,
    );
    return account ? Number(account.pointsBalance) : null;
  }

  async getUserTier(userId: string, programId: string): Promise<string | null> {
    const account = await this.loyaltyAccountRepo.findByUserIdAndProgramId(
      userId,
      programId,
    );
    return account ? account.tier : null;
  }

  private async enrollUserInternal(
    userId: string,
    programId: string,
  ): Promise<LoyaltyAccount> {
    const account = LoyaltyAccount.create({
      userId,
      programId,
    });

    await this.loyaltyAccountRepo.save(account);

    return account;
  }

  private toLoyaltyProgramDto(program: LoyaltyProgram): LoyaltyProgramDto {
    return {
      programId: program.programId,
      name: program.name,
      earnRules: program.earnRules,
      burnRules: program.burnRules,
      tiers: program.tiers,
    };
  }

  private toLoyaltyAccountDto(account: LoyaltyAccount): LoyaltyAccountDto {
    return {
      accountId: account.accountId,
      userId: account.userId,
      programId: account.programId,
      pointsBalance: Number(account.pointsBalance),
      tier: account.tier,
      updatedAt: account.updatedAt,
    };
  }

  private toLoyaltyTransactionDto(
    transaction: LoyaltyTransaction,
  ): LoyaltyTransactionDto {
    return {
      ltxnId: transaction.ltxnId,
      accountId: transaction.accountId,
      pointsDelta: transaction.pointsDelta,
      reason: transaction.reason.getValue(),
      orderId: transaction.orderId,
      createdAt: transaction.createdAt,
    };
  }
}

import { PrismaClient } from "@prisma/client";
import {
  ISupportAgentRepository,
  AgentQueryOptions,
  AgentFilterOptions,
} from "../../../domain/repositories/support-agent.repository.js";
import { SupportAgent } from "../../../domain/entities/support-agent.entity.js";
import { AgentId } from "../../../domain/value-objects/index.js";

export class SupportAgentRepositoryImpl implements ISupportAgentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(record: any): SupportAgent {
    return SupportAgent.fromDatabaseRow({
      agent_id: record.id,
      name: record.name,
      roster: record.roster,
      skills: record.skills,
    });
  }

  private dehydrate(agent: SupportAgent): any {
    const row = agent.toDatabaseRow();
    return {
      id: row.agent_id,
      name: row.name,
      roster: row.roster,
      skills: row.skills,
    };
  }

  private buildOrderBy(options?: AgentQueryOptions): any {
    if (!options?.sortBy) {
      return { name: "asc" };
    }

    return {
      [options.sortBy]: options.sortOrder || "asc",
    };
  }

  async save(agent: SupportAgent): Promise<void> {
    const data = this.dehydrate(agent);
    await this.prisma.supportAgent.create({ data });
  }

  async update(agent: SupportAgent): Promise<void> {
    const data = this.dehydrate(agent);
    const { id, ...updateData } = data;
    await this.prisma.supportAgent.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(agentId: AgentId): Promise<void> {
    await this.prisma.supportAgent.delete({
      where: { id: agentId.getValue() },
    });
  }

  async findById(agentId: AgentId): Promise<SupportAgent | null> {
    const record = await this.prisma.supportAgent.findUnique({
      where: { id: agentId.getValue() },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByName(name: string): Promise<SupportAgent | null> {
    const record = await this.prisma.supportAgent.findFirst({
      where: { name },
    });

    return record ? this.hydrate(record) : null;
  }

  async findAll(options?: AgentQueryOptions): Promise<SupportAgent[]> {
    const records = await this.prisma.supportAgent.findMany({
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findWithFilters(
    filters: AgentFilterOptions,
    options?: AgentQueryOptions
  ): Promise<SupportAgent[]> {
    const where: any = {};

    if (filters.hasSkill) {
      where.skills = {
        array_contains: filters.hasSkill,
      };
    }

    if (filters.hasAnySkills && filters.hasAnySkills.length > 0) {
      where.OR = filters.hasAnySkills.map((skill) => ({
        skills: {
          array_contains: skill,
        },
      }));
    }

    if (filters.hasAllSkills && filters.hasAllSkills.length > 0) {
      where.AND = filters.hasAllSkills.map((skill) => ({
        skills: {
          array_contains: skill,
        },
      }));
    }

    const records = await this.prisma.supportAgent.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findBySkill(
    skill: string,
    options?: AgentQueryOptions
  ): Promise<SupportAgent[]> {
    const records = await this.prisma.supportAgent.findMany({
      where: {
        skills: {
          array_contains: skill,
        },
      },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAvailableAgents(
    options?: AgentQueryOptions
  ): Promise<SupportAgent[]> {
    return this.findAll(options);
  }

  async count(): Promise<number> {
    return await this.prisma.supportAgent.count();
  }

  async countBySkill(skill: string): Promise<number> {
    return await this.prisma.supportAgent.count({
      where: {
        skills: {
          array_contains: skill,
        },
      },
    });
  }

  async exists(agentId: AgentId): Promise<boolean> {
    const count = await this.prisma.supportAgent.count({
      where: { id: agentId.getValue() },
    });

    return count > 0;
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.supportAgent.count({
      where: { name },
    });

    return count > 0;
  }
}

import { SupportAgent } from "../entities/support-agent.entity.js";
import { AgentId } from "../value-objects/index.js";

export interface AgentQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "name";
  sortOrder?: "asc" | "desc";
}

export interface AgentFilterOptions {
  hasSkill?: string;
  hasAnySkills?: string[];
  hasAllSkills?: string[];
}

export interface ISupportAgentRepository {
  // Basic CRUD
  save(agent: SupportAgent): Promise<void>;
  update(agent: SupportAgent): Promise<void>;
  delete(agentId: AgentId): Promise<void>;

  // Finders
  findById(agentId: AgentId): Promise<SupportAgent | null>;
  findByName(name: string): Promise<SupportAgent | null>;
  findAll(options?: AgentQueryOptions): Promise<SupportAgent[]>;

  // Advanced queries
  findWithFilters(
    filters: AgentFilterOptions,
    options?: AgentQueryOptions
  ): Promise<SupportAgent[]>;
  findBySkill(skill: string, options?: AgentQueryOptions): Promise<SupportAgent[]>;
  findAvailableAgents(options?: AgentQueryOptions): Promise<SupportAgent[]>;

  // Counts
  count(): Promise<number>;
  countBySkill(skill: string): Promise<number>;

  // Existence checks
  exists(agentId: AgentId): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
}

import {
  ISupportAgentRepository,
  AgentQueryOptions,
  AgentFilterOptions,
} from "../../domain/repositories/support-agent.repository.js";
import { SupportAgent } from "../../domain/entities/support-agent.entity.js";
import { AgentId } from "../../domain/value-objects/index.js";

export class SupportAgentService {
  constructor(private readonly agentRepository: ISupportAgentRepository) {}

  async createAgent(data: {
    name: string;
    roster?: string[];
    skills?: string[];
  }): Promise<SupportAgent> {
    const agent = SupportAgent.create({
      name: data.name,
      roster: data.roster,
      skills: data.skills,
    });

    await this.agentRepository.save(agent);
    return agent;
  }

  async getAgent(agentId: string): Promise<SupportAgent | null> {
    return await this.agentRepository.findById(AgentId.create(agentId));
  }

  async getAgentByName(name: string): Promise<SupportAgent | null> {
    return await this.agentRepository.findByName(name);
  }

  async updateAgent(
    agentId: string,
    data: {
      name?: string;
      roster?: string[];
      skills?: string[];
    }
  ): Promise<void> {
    const agent = await this.agentRepository.findById(AgentId.create(agentId));

    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    if (data.name) {
      agent.updateName(data.name);
    }

    if (data.roster) {
      agent.updateRoster(data.roster);
    }

    if (data.skills) {
      agent.updateSkills(data.skills);
    }

    await this.agentRepository.update(agent);
  }

  async addSkill(agentId: string, skill: string): Promise<void> {
    const agent = await this.agentRepository.findById(AgentId.create(agentId));

    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    agent.addSkill(skill);
    await this.agentRepository.update(agent);
  }

  async removeSkill(agentId: string, skill: string): Promise<void> {
    const agent = await this.agentRepository.findById(AgentId.create(agentId));

    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    agent.removeSkill(skill);
    await this.agentRepository.update(agent);
  }

  async deleteAgent(agentId: string): Promise<void> {
    const exists = await this.agentRepository.exists(AgentId.create(agentId));

    if (!exists) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    await this.agentRepository.delete(AgentId.create(agentId));
  }

  async getAllAgents(options?: AgentQueryOptions): Promise<SupportAgent[]> {
    return await this.agentRepository.findAll(options);
  }

  async getAgentsBySkill(
    skill: string,
    options?: AgentQueryOptions
  ): Promise<SupportAgent[]> {
    return await this.agentRepository.findBySkill(skill, options);
  }

  async getAvailableAgents(
    options?: AgentQueryOptions
  ): Promise<SupportAgent[]> {
    return await this.agentRepository.findAvailableAgents(options);
  }

  async getAgentsWithFilters(
    filters: AgentFilterOptions,
    options?: AgentQueryOptions
  ): Promise<SupportAgent[]> {
    return await this.agentRepository.findWithFilters(filters, options);
  }

  async countAgents(): Promise<number> {
    return await this.agentRepository.count();
  }

  async countAgentsBySkill(skill: string): Promise<number> {
    return await this.agentRepository.countBySkill(skill);
  }

  async agentExists(agentId: string): Promise<boolean> {
    return await this.agentRepository.exists(AgentId.create(agentId));
  }

  async agentExistsByName(name: string): Promise<boolean> {
    return await this.agentRepository.existsByName(name);
  }
}

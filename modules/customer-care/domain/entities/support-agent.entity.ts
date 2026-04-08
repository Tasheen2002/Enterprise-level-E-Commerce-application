import { AgentId } from "../value-objects/index.js";

export class SupportAgent {
  private constructor(
    private readonly agentId: AgentId,
    private name: string,
    private roster: string[], // Array of schedule/availability info
    private skills: string[] // Array of skills/expertise
  ) {}

  static create(data: CreateSupportAgentData): SupportAgent {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Agent name cannot be empty");
    }

    const agentId = AgentId.generate();

    return new SupportAgent(
      agentId,
      data.name.trim(),
      data.roster || [],
      data.skills || []
    );
  }

  static reconstitute(data: SupportAgentData): SupportAgent {
    return new SupportAgent(
      AgentId.create(data.agentId),
      data.name,
      data.roster,
      data.skills
    );
  }

  static fromDatabaseRow(row: SupportAgentDatabaseRow): SupportAgent {
    return new SupportAgent(
      AgentId.create(row.agent_id),
      row.name,
      Array.isArray(row.roster) ? row.roster : [],
      Array.isArray(row.skills) ? row.skills : []
    );
  }

  // Getters
  getAgentId(): AgentId {
    return this.agentId;
  }

  getName(): string {
    return this.name;
  }

  getRoster(): string[] {
    return [...this.roster];
  }

  getSkills(): string[] {
    return [...this.skills];
  }

  // Business logic methods
  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error("Agent name cannot be empty");
    }

    this.name = newName.trim();
  }

  updateRoster(newRoster: string[]): void {
    this.roster = [...newRoster];
  }

  addToRoster(entry: string): void {
    if (!entry || entry.trim().length === 0) {
      throw new Error("Roster entry cannot be empty");
    }

    if (!this.roster.includes(entry)) {
      this.roster.push(entry);
    }
  }

  removeFromRoster(entry: string): void {
    this.roster = this.roster.filter((item) => item !== entry);
  }

  updateSkills(newSkills: string[]): void {
    this.skills = [...newSkills];
  }

  addSkill(skill: string): void {
    if (!skill || skill.trim().length === 0) {
      throw new Error("Skill cannot be empty");
    }

    const normalizedSkill = skill.trim().toLowerCase();
    if (!this.skills.map((s) => s.toLowerCase()).includes(normalizedSkill)) {
      this.skills.push(skill.trim());
    }
  }

  removeSkill(skill: string): void {
    const normalizedSkill = skill.toLowerCase();
    this.skills = this.skills.filter(
      (s) => s.toLowerCase() !== normalizedSkill
    );
  }

  // Validation methods
  hasSkill(skill: string): boolean {
    const normalizedSkill = skill.toLowerCase();
    return this.skills.map((s) => s.toLowerCase()).includes(normalizedSkill);
  }

  hasAnySkill(skills: string[]): boolean {
    return skills.some((skill) => this.hasSkill(skill));
  }

  hasAllSkills(skills: string[]): boolean {
    return skills.every((skill) => this.hasSkill(skill));
  }

  isOnRoster(entry: string): boolean {
    return this.roster.includes(entry);
  }

  // Convert to data for persistence
  toData(): SupportAgentData {
    return {
      agentId: this.agentId.getValue(),
      name: this.name,
      roster: [...this.roster],
      skills: [...this.skills],
    };
  }

  toDatabaseRow(): SupportAgentDatabaseRow {
    return {
      agent_id: this.agentId.getValue(),
      name: this.name,
      roster: this.roster,
      skills: this.skills,
    };
  }

  equals(other: SupportAgent): boolean {
    return this.agentId.equals(other.agentId);
  }
}

// Supporting types and interfaces
export interface CreateSupportAgentData {
  name: string;
  roster?: string[];
  skills?: string[];
}

export interface SupportAgentData {
  agentId: string;
  name: string;
  roster: string[];
  skills: string[];
}

export interface SupportAgentDatabaseRow {
  agent_id: string;
  name: string;
  roster: string[];
  skills: string[];
}

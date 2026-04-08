import { SupportAgentService } from "../services/support-agent.service.js";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "./get-support-ticket.query.js";

export interface ListSupportAgentsQuery extends IQuery {}

export interface SupportAgentDto {
  agentId: string;
  name: string;
  roster: string[];
  skills: string[];
}

export class ListSupportAgentsHandler
  implements
    IQueryHandler<ListSupportAgentsQuery, QueryResult<SupportAgentDto[]>>
{
  constructor(private readonly supportAgentService: SupportAgentService) {}

  async handle(
    query: ListSupportAgentsQuery
  ): Promise<QueryResult<SupportAgentDto[]>> {
    try {
      const agents = await this.supportAgentService.getAllAgents();
      const result: SupportAgentDto[] = agents.map((agent) => ({
        agentId: agent.getAgentId().getValue(),
        name: agent.getName(),
        roster: agent.getRoster(),
        skills: agent.getSkills(),
      }));
      return QueryResult.success<SupportAgentDto[]>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<SupportAgentDto[]>(
          "Failed to list support agents",
          [error.message]
        );
      }
      return QueryResult.failure<SupportAgentDto[]>(
        "An unexpected error occurred while listing support agents"
      );
    }
  }
}

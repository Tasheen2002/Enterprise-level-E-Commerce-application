import { SupportAgentService } from "../services/support-agent.service.js";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "./get-support-ticket.query.js";

export interface GetSupportAgentQuery extends IQuery {
  agentId: string;
}

export interface SupportAgentDto {
  agentId: string;
  name: string;
  roster: string[];
  skills: string[];
}

export class GetSupportAgentHandler
  implements
    IQueryHandler<GetSupportAgentQuery, QueryResult<SupportAgentDto | null>>
{
  constructor(private readonly supportAgentService: SupportAgentService) {}

  async handle(
    query: GetSupportAgentQuery
  ): Promise<QueryResult<SupportAgentDto | null>> {
    try {
      if (!query.agentId) {
        return QueryResult.failure<SupportAgentDto | null>(
          "Agent ID is required",
          ["agentId"]
        );
      }

      const agent = await this.supportAgentService.getAgent(query.agentId);
      if (!agent) {
        return QueryResult.success<SupportAgentDto | null>(null);
      }
      const result: SupportAgentDto = {
        agentId: agent.getAgentId().getValue(),
        name: agent.getName(),
        roster: agent.getRoster(),
        skills: agent.getSkills(),
      };
      return QueryResult.success<SupportAgentDto | null>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<SupportAgentDto | null>(
          "Failed to get support agent",
          [error.message]
        );
      }
      return QueryResult.failure<SupportAgentDto | null>(
        "An unexpected error occurred while getting support agent"
      );
    }
  }
}

import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { ISessionRepository } from "../../domain/repositories/isession.repository";
import { UserId } from "../../domain/value-objects/user-id.vo";

export interface GetActiveSessionsQuery extends IQuery {
  userId: string;
}

export interface ActiveSessionDTO {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  createdAt: string;
  expiresAt: string;
}

export class GetActiveSessionsHandler implements IQueryHandler<GetActiveSessionsQuery, QueryResult<ActiveSessionDTO[]>> {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async handle(query: GetActiveSessionsQuery): Promise<QueryResult<ActiveSessionDTO[]>> {
    const userIdVo = UserId.fromString(query.userId);
    const sessions = await this.sessionRepository.findByUserId(userIdVo);

    const sessionDTOs = sessions.map(session => ({
      id: session.id!,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
      deviceType: session.deviceType ?? null,
      browser: session.browser ?? null,
      os: session.os ?? null,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    }));

    return QueryResult.success(sessionDTOs);
  }
}

import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateLoyaltyProgramCommand,
  CreateLoyaltyProgramHandler,
  GetLoyaltyProgramsQuery,
  GetLoyaltyProgramsHandler,
} from "../../../application";
import { LoyaltyService } from "../../../application/services/loyalty.service";

export interface CreateLoyaltyProgramRequest {
  name: string;
  earnRules: any;
  burnRules: any;
  tiers: any[];
}

export class LoyaltyProgramController {
  private createHandler: CreateLoyaltyProgramHandler;
  private listHandler: GetLoyaltyProgramsHandler;

  constructor(private readonly loyaltyService: LoyaltyService) {
    this.createHandler = new CreateLoyaltyProgramHandler(loyaltyService);
    this.listHandler = new GetLoyaltyProgramsHandler(loyaltyService);
  }

  /**
   * POST /loyalty/programs
   * Create a new loyalty program
   */
  async create(
    request: FastifyRequest<{ Body: CreateLoyaltyProgramRequest }>,
    reply: FastifyReply,
  ) {
    const body = request.body;
    const cmd: CreateLoyaltyProgramCommand = {
      name: body.name,
      earnRules: body.earnRules,
      burnRules: body.burnRules,
      tiers: body.tiers,
      timestamp: new Date(),
    };
    const result = await this.createHandler.handle(cmd);
    return reply.code(result.success ? 201 : 400).send(result);
  }

  /**
   * GET /loyalty/programs
   * List all loyalty programs
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    const result = await this.listHandler.handle({ timestamp: new Date() });
    return reply.code(result.success ? 200 : 400).send(result);
  }
}

import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateLoyaltyProgramCommand,
  CreateLoyaltyProgramHandler,
  GetLoyaltyProgramsQuery,
  GetLoyaltyProgramsHandler,
} from "../../../application";
import { LoyaltyService } from "../../../application/services/loyalty.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

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
    return ResponseHelper.fromCommand(
      reply,
      result,
      "Loyalty program created",
      201,
    );
  }

  /**
   * GET /loyalty/programs
   * List all loyalty programs
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    const result = await this.listHandler.handle({ timestamp: new Date() });
    return ResponseHelper.fromQuery(
      reply,
      result,
      "Loyalty programs retrieved",
    );
  }
}

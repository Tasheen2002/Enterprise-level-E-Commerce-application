import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateGoodwillRecordCommand,
  CreateGoodwillRecordHandler,
} from "../../../application/commands/create-goodwill-record.command";
import {
  GetGoodwillRecordQuery,
  GetGoodwillRecordHandler,
} from "../../../application/queries/get-goodwill-record.query";
import {
  ListGoodwillRecordsQuery,
  ListGoodwillRecordsHandler,
} from "../../../application/queries/list-goodwill-records.query";
import { GoodwillRecordService } from "../../../application/services/goodwill-record.service";

interface CreateGoodwillRecordRequest {
  userId?: string;
  orderId?: string;
  type: string;
  value: number;
  currency?: string;
  reason?: string;
}

export class GoodwillRecordController {
  private createGoodwillRecordHandler: CreateGoodwillRecordHandler;
  private getGoodwillRecordHandler: GetGoodwillRecordHandler;
  private listGoodwillRecordsHandler: ListGoodwillRecordsHandler;

  constructor(private readonly goodwillRecordService: GoodwillRecordService) {
    this.createGoodwillRecordHandler = new CreateGoodwillRecordHandler(
      goodwillRecordService
    );
    this.getGoodwillRecordHandler = new GetGoodwillRecordHandler(
      goodwillRecordService
    );
    this.listGoodwillRecordsHandler = new ListGoodwillRecordsHandler(
      goodwillRecordService
    );
  }

  async createRecord(
    request: FastifyRequest<{ Body: CreateGoodwillRecordRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { userId, orderId, type, value, currency, reason } = request.body;
      const command: CreateGoodwillRecordCommand = {
        userId,
        orderId,
        type,
        value,
        currency,
        reason,
      };
      const result = await this.createGoodwillRecordHandler.handle(command);
      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Goodwill record created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to create goodwill record",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create goodwill record");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create goodwill record",
      });
    }
  }

  async getRecord(
    request: FastifyRequest<{ Params: { goodwillId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { goodwillId } = request.params;
      if (!goodwillId || typeof goodwillId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Goodwill ID is required and must be a valid string",
        });
      }
      const query: GetGoodwillRecordQuery = { goodwillId };
      const result = await this.getGoodwillRecordHandler.handle(query);
      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else if (result.success && result.data === null) {
        return reply.code(404).send({
          success: false,
          error: "Goodwill record not found",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve goodwill record",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get goodwill record");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve goodwill record",
      });
    }
  }

  async listRecords(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query: ListGoodwillRecordsQuery = {};
      const result = await this.listGoodwillRecordsHandler.handle(query);
      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          total: result.data.length,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to list goodwill records",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to list goodwill records");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to list goodwill records",
      });
    }
  }
}

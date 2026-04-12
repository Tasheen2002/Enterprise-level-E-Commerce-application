import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateSupplierHandler,
  UpdateSupplierHandler,
  DeleteSupplierHandler,
  GetSupplierHandler,
  ListSuppliersHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class SupplierController {
  constructor(
    private readonly createSupplierHandler: CreateSupplierHandler,
    private readonly updateSupplierHandler: UpdateSupplierHandler,
    private readonly deleteSupplierHandler: DeleteSupplierHandler,
    private readonly getSupplierHandler: GetSupplierHandler,
    private readonly listSuppliersHandler: ListSuppliersHandler,
  ) {}

  async getSupplier(
    request: AuthenticatedRequest<{ Params: { supplierId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { supplierId } = request.params;
      const result = await this.getSupplierHandler.handle({ supplierId });
      return ResponseHelper.fromQuery(reply, result, "Supplier retrieved", "Supplier not found");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listSuppliers(
    request: AuthenticatedRequest<{
      Querystring: { limit?: number; offset?: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { limit, offset } = request.query;
      const result = await this.listSuppliersHandler.handle({
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      return ResponseHelper.fromQuery(reply, result, "Suppliers retrieved");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createSupplier(
    request: AuthenticatedRequest<{
      Body: {
        name: string;
        leadTimeDays?: number;
        contacts?: Array<{ name?: string; email?: string; phone?: string }>;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createSupplierHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "Supplier created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateSupplier(
    request: AuthenticatedRequest<{
      Params: { supplierId: string };
      Body: {
        name?: string;
        leadTimeDays?: number;
        contacts?: Array<{ name?: string; email?: string; phone?: string }>;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { supplierId } = request.params;
      const result = await this.updateSupplierHandler.handle({ supplierId, ...request.body });
      return ResponseHelper.fromCommand(reply, result, "Supplier updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteSupplier(
    request: AuthenticatedRequest<{ Params: { supplierId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { supplierId } = request.params;
      const result = await this.deleteSupplierHandler.handle({ supplierId });
      return ResponseHelper.fromCommand(reply, result, "Supplier deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}

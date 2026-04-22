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
import {
  CreateSupplierBody,
  UpdateSupplierBody,
  ListSuppliersQuery,
} from "../validation/supplier.schema";

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
      return ResponseHelper.ok(reply, "Supplier retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listSuppliers(
    request: AuthenticatedRequest<{ Querystring: ListSuppliersQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { limit, offset } = request.query;
      const result = await this.listSuppliersHandler.handle({ limit, offset });
      return ResponseHelper.ok(reply, "Suppliers retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createSupplier(
    request: AuthenticatedRequest<{ Body: CreateSupplierBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { name, leadTimeDays, contacts } = request.body;
      const result = await this.createSupplierHandler.handle({ name, leadTimeDays, contacts });
      return ResponseHelper.fromCommand(reply, result, "Supplier created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateSupplier(
    request: AuthenticatedRequest<{
      Params: { supplierId: string };
      Body: UpdateSupplierBody;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { supplierId } = request.params;
      const { name, leadTimeDays, contacts } = request.body;
      const result = await this.updateSupplierHandler.handle({ supplierId, name, leadTimeDays, contacts });
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

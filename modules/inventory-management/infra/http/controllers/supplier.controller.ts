import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateSupplierHandler,
  UpdateSupplierHandler,
  DeleteSupplierHandler,
  GetSupplierHandler,
  ListSuppliersHandler,
} from "../../../application";
import { SupplierManagementService } from "../../../application/services/supplier-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class SupplierController {
  private createSupplierHandler: CreateSupplierHandler;
  private updateSupplierHandler: UpdateSupplierHandler;
  private deleteSupplierHandler: DeleteSupplierHandler;
  private getSupplierHandler: GetSupplierHandler;
  private listSuppliersHandler: ListSuppliersHandler;

  constructor(supplierService: SupplierManagementService) {
    this.createSupplierHandler = new CreateSupplierHandler(supplierService);
    this.updateSupplierHandler = new UpdateSupplierHandler(supplierService);
    this.deleteSupplierHandler = new DeleteSupplierHandler(supplierService);
    this.getSupplierHandler = new GetSupplierHandler(supplierService);
    this.listSuppliersHandler = new ListSuppliersHandler(supplierService);
  }

  async getSupplier(
    request: AuthenticatedRequest<{
      Params: { supplierId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { supplierId } = request.params;
      const result = await this.getSupplierHandler.handle({ supplierId });
      return ResponseHelper.fromQuery(reply, result, "Supplier retrieved", "Supplier not found");
    } catch (error) {
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
    } catch (error) {
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
      if (result.success && result.data) {
        return ResponseHelper.created(reply, "Supplier created successfully", result.data);
      }
      return ResponseHelper.badRequest(reply, result.error || "Supplier creation failed");
    } catch (error) {
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
      if (result.success && result.data) {
        return ResponseHelper.ok(reply, "Supplier updated successfully", result.data);
      }
      return ResponseHelper.badRequest(reply, result.error || "Supplier update failed");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteSupplier(
    request: AuthenticatedRequest<{
      Params: { supplierId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { supplierId } = request.params;
      const result = await this.deleteSupplierHandler.handle({ supplierId });
      return ResponseHelper.fromCommand(reply, result, "Supplier deleted successfully", undefined, 204);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}

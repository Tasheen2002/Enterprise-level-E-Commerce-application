import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateSupplierCommand,
  CreateSupplierHandler,
  UpdateSupplierCommand,
  UpdateSupplierHandler,
  DeleteSupplierCommand,
  DeleteSupplierHandler,
  GetSupplierQuery,
  GetSupplierHandler,
  ListSuppliersQuery,
  ListSuppliersHandler,
} from "../../../application";
import { SupplierManagementService } from "../../../application/services/supplier-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface CreateSupplierBody {
  name: string;
  leadTimeDays?: number;
  contacts?: Array<{ name?: string; email?: string; phone?: string }>;
}

export interface UpdateSupplierBody {
  name?: string;
  leadTimeDays?: number;
  contacts?: any[];
}

export interface ListSuppliersQuerystring {
  limit?: number;
  offset?: number;
}

export class SupplierController {
  private createSupplierHandler: CreateSupplierHandler;
  private updateSupplierHandler: UpdateSupplierHandler;
  private deleteSupplierHandler: DeleteSupplierHandler;
  private getSupplierHandler: GetSupplierHandler;
  private listSuppliersHandler: ListSuppliersHandler;

  constructor(private readonly supplierService: SupplierManagementService) {
    // Initialize CQRS handlers
    this.createSupplierHandler = new CreateSupplierHandler(supplierService);
    this.updateSupplierHandler = new UpdateSupplierHandler(supplierService);
    this.deleteSupplierHandler = new DeleteSupplierHandler(supplierService);
    this.getSupplierHandler = new GetSupplierHandler(supplierService);
    this.listSuppliersHandler = new ListSuppliersHandler(supplierService);
  }

  async getSupplier(
    request: FastifyRequest<{ Params: { supplierId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { supplierId } = request.params;

      const query: GetSupplierQuery = {
        supplierId,
      };

      const result = await this.getSupplierHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Supplier retrieved",
        "Supplier not found",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listSuppliers(
    request: FastifyRequest<{
      Querystring: ListSuppliersQuerystring;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { limit, offset } = request.query;

      const query: ListSuppliersQuery = {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      };

      const result = await this.listSuppliersHandler.handle(query);
      return ResponseHelper.fromQuery(reply, result, "Suppliers retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createSupplier(
    request: FastifyRequest<{ Body: CreateSupplierBody }>,
    reply: FastifyReply,
  ) {
    try {
      const body = request.body;

      const command: CreateSupplierCommand = {
        name: body.name,
        leadTimeDays: body.leadTimeDays,
        contacts: body.contacts,
      };

      const result = await this.createSupplierHandler.handle(command);

      if (result.success && result.data) {
        const supplier = result.data;
        return ResponseHelper.created(reply, "Supplier created successfully", {
          supplierId: supplier.getSupplierId().getValue(),
          name: supplier.getName(),
          leadTimeDays: supplier.getLeadTimeDays(),
          contacts: supplier.getContacts(),
        });
      }
      return ResponseHelper.badRequest(
        reply,
        result.error || "Supplier creation failed",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateSupplier(
    request: FastifyRequest<{
      Params: { supplierId: string };
      Body: UpdateSupplierBody;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { supplierId } = request.params;
      const body = request.body;

      const command: UpdateSupplierCommand = {
        supplierId,
        name: body.name,
        leadTimeDays: body.leadTimeDays,
        contacts: body.contacts,
      };

      const result = await this.updateSupplierHandler.handle(command);

      if (result.success && result.data) {
        const supplier = result.data;
        return ResponseHelper.ok(reply, "Supplier updated successfully", {
          supplierId: supplier.getSupplierId().getValue(),
          name: supplier.getName(),
          leadTimeDays: supplier.getLeadTimeDays(),
          contacts: supplier.getContacts(),
        });
      }
      return ResponseHelper.badRequest(
        reply,
        result.error || "Supplier update failed",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteSupplier(
    request: FastifyRequest<{ Params: { supplierId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { supplierId } = request.params;

      const command: DeleteSupplierCommand = {
        supplierId,
      };

      const result = await this.deleteSupplierHandler.handle(command);
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Supplier deleted successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}

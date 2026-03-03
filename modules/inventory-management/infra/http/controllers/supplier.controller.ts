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

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else if (result.success && result.data === null) {
        return reply.code(404).send({
          success: false,
          error: "Supplier not found",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to get supplier",
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get supplier");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async listSuppliers(
    request: FastifyRequest<{
      Querystring: { limit?: number; offset?: number };
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

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to list suppliers",
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to list suppliers");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async createSupplier(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;

      const command: CreateSupplierCommand = {
        name: body.name,
        leadTimeDays: body.leadTimeDays,
        contacts: body.contacts,
      };

      const result = await this.createSupplierHandler.handle(command);

      if (result.success && result.data) {
        const supplier = result.data;

        return reply.code(201).send({
          success: true,
          data: {
            supplierId: supplier.getSupplierId().getValue(),
            name: supplier.getName(),
            leadTimeDays: supplier.getLeadTimeDays(),
            contacts: supplier.getContacts(),
          },
          message: "Supplier created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Supplier creation failed",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create supplier");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async updateSupplier(
    request: FastifyRequest<{ Params: { supplierId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { supplierId } = request.params;
      const body = request.body as any;

      const command: UpdateSupplierCommand = {
        supplierId,
        name: body.name,
        leadTimeDays: body.leadTimeDays,
        contacts: body.contacts,
      };

      const result = await this.updateSupplierHandler.handle(command);

      if (result.success && result.data) {
        const supplier = result.data;

        return reply.code(200).send({
          success: true,
          data: {
            supplierId: supplier.getSupplierId().getValue(),
            name: supplier.getName(),
            leadTimeDays: supplier.getLeadTimeDays(),
            contacts: supplier.getContacts(),
          },
          message: "Supplier updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Supplier update failed",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update supplier");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
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

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Supplier deleted successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Supplier deletion failed",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to delete supplier");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }
}

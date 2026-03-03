import { FastifyInstance } from "fastify";
import { ProductController } from "../controllers/product.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";

export async function registerProductRoutes(
  fastify: FastifyInstance,
  controller: ProductController,
): Promise<void> {
  // GET /products — List products (public)
  fastify.get(
    "/products",
    {
      schema: {
        description: "Get paginated list of products with filtering options",
        tags: ["Products"],
        summary: "List Products",
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            status: {
              type: "string",
              enum: ["draft", "published", "scheduled", "archived"],
            },
            categoryId: { type: "string", format: "uuid" },
            brand: { type: "string" },
            includeDrafts: { type: "boolean", default: false },
            sortBy: {
              type: "string",
              enum: ["title", "createdAt", "updatedAt", "publishAt"],
              default: "createdAt",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              default: "desc",
            },
          },
        },
        response: {
          200: {
            description: "List of products with pagination",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  products: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        productId: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        slug: { type: "string" },
                        brand: { type: "string", nullable: true },
                        shortDesc: { type: "string", nullable: true },
                        status: {
                          type: "string",
                          enum: ["draft", "published", "scheduled", "archived"],
                        },
                        longDescHtml: { type: "string", nullable: true },
                        countryOfOrigin: { type: "string", nullable: true },
                        seoTitle: { type: "string", nullable: true },
                        seoDescription: { type: "string", nullable: true },
                        publishAt: {
                          type: "string",
                          format: "date-time",
                          nullable: true,
                        },
                        price: { type: "number" },
                        priceSgd: { type: "number", nullable: true },
                        priceUsd: { type: "number", nullable: true },
                        compareAtPrice: { type: "number", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                        variants: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              sku: { type: "string" },
                              size: { type: "string", nullable: true },
                              color: { type: "string", nullable: true },
                              inventory: { type: "integer" },
                            },
                          },
                        },
                        images: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              url: { type: "string" },
                              alt: { type: "string", nullable: true },
                              width: { type: "integer", nullable: true },
                              height: { type: "integer", nullable: true },
                            },
                          },
                        },
                        categories: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              slug: { type: "string" },
                              position: { type: "integer", nullable: true },
                            },
                          },
                        },
                      },
                    },
                  },
                  total: { type: "integer" },
                  page: { type: "integer" },
                  limit: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    controller.listProducts.bind(controller) as any,
  );

  // GET /products/slug/:slug — Get by slug (public, registered before /:productId to avoid conflict)
  fastify.get(
    "/products/slug/:slug",
    {
      schema: {
        description: "Get product by slug with full details",
        tags: ["Products"],
        summary: "Get Product by Slug",
        params: {
          type: "object",
          required: ["slug"],
          properties: { slug: { type: "string" } },
        },
        response: {
          200: {
            description: "Product details",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  productId: { type: "string", format: "uuid" },
                  title: { type: "string" },
                  slug: { type: "string" },
                  brand: { type: "string", nullable: true },
                  shortDesc: { type: "string", nullable: true },
                  longDescHtml: { type: "string", nullable: true },
                  status: {
                    type: "string",
                    enum: ["draft", "published", "scheduled", "archived"],
                  },
                  publishAt: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                  },
                  countryOfOrigin: { type: "string", nullable: true },
                  seoTitle: { type: "string", nullable: true },
                  seoDescription: { type: "string", nullable: true },
                  price: { type: "number" },
                  priceSgd: { type: "number", nullable: true },
                  priceUsd: { type: "number", nullable: true },
                  compareAtPrice: { type: "number", nullable: true },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                  images: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        url: { type: "string" },
                        alt: { type: "string" },
                        width: { type: "number" },
                        height: { type: "number" },
                      },
                    },
                  },
                  variants: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        sku: { type: "string" },
                        size: { type: "string", nullable: true },
                        color: { type: "string", nullable: true },
                        inventory: { type: "number" },
                      },
                    },
                  },
                  categories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        slug: { type: "string" },
                        position: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "Product not found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Product not found" },
            },
          },
        },
      },
    },
    controller.getProductBySlug.bind(controller),
  );

  // GET /products/:productId — Get by ID (public)
  fastify.get(
    "/products/:productId",
    {
      schema: {
        description: "Get product by ID with full details",
        tags: ["Products"],
        summary: "Get Product by ID",
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            description: "Product details",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  productId: { type: "string", format: "uuid" },
                  title: { type: "string" },
                  slug: { type: "string" },
                  brand: { type: "string", nullable: true },
                  shortDesc: { type: "string", nullable: true },
                  longDescHtml: { type: "string", nullable: true },
                  status: {
                    type: "string",
                    enum: ["draft", "published", "scheduled", "archived"],
                  },
                  publishAt: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                  },
                  countryOfOrigin: { type: "string", nullable: true },
                  seoTitle: { type: "string", nullable: true },
                  seoDescription: { type: "string", nullable: true },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                  images: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        url: { type: "string" },
                        alt: { type: "string", nullable: true },
                        width: { type: "integer", nullable: true },
                        height: { type: "integer", nullable: true },
                      },
                    },
                  },
                  media: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
          404: {
            description: "Product not found",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Product not found" },
            },
          },
        },
      },
    },
    controller.getProduct.bind(controller),
  );

  // POST /products — Create product (Admin only)
  fastify.post(
    "/products",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Create a new product",
        tags: ["Products"],
        summary: "Create Product",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", description: "Product title" },
            brand: { type: "string", description: "Product brand" },
            shortDesc: { type: "string", description: "Short description" },
            longDescHtml: {
              type: "string",
              description: "Long description in HTML",
            },
            status: {
              type: "string",
              enum: ["draft", "published", "scheduled"],
              default: "draft",
            },
            publishAt: {
              type: "string",
              format: "date-time",
              description: "Publish date for scheduled products",
            },
            countryOfOrigin: {
              type: "string",
              description: "Country of origin",
            },
            seoTitle: { type: "string", description: "SEO title" },
            seoDescription: { type: "string", description: "SEO description" },
            price: { type: "number", minimum: 0, description: "Price in LKR" },
            priceSgd: {
              type: "number",
              minimum: 0,
              description: "Price in SGD",
            },
            priceUsd: {
              type: "number",
              minimum: 0,
              description: "Price in USD",
            },
            compareAtPrice: {
              type: "number",
              minimum: 0,
              description: "Compare-at price in LKR",
            },
            categoryIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
              description: "Category IDs",
            },
          },
        },
        response: {
          201: {
            description: "Product created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  productId: { type: "string", format: "uuid" },
                  title: { type: "string" },
                  slug: { type: "string" },
                  status: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          400: {
            description: "Validation error",
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
              errors: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    controller.createProduct.bind(controller) as any,
  );

  // PUT /products/:productId — Update product (Admin only)
  fastify.put(
    "/products/:productId",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update an existing product",
        tags: ["Products"],
        summary: "Update Product",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          properties: {
            title: { type: "string" },
            brand: { type: "string" },
            shortDesc: { type: "string" },
            longDescHtml: { type: "string" },
            status: {
              type: "string",
              enum: ["draft", "published", "scheduled", "archived"],
            },
            publishAt: { type: "string", format: "date-time" },
            countryOfOrigin: { type: "string" },
            seoTitle: { type: "string" },
            seoDescription: { type: "string" },
            price: { type: "number", minimum: 0 },
            priceSgd: { type: "number", minimum: 0, nullable: true },
            priceUsd: { type: "number", minimum: 0, nullable: true },
            compareAtPrice: { type: "number", minimum: 0, nullable: true },
            categoryIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
            },
            tags: { type: "array", items: { type: "string" } },
          },
        },
        response: {
          200: {
            description: "Product updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  productId: { type: "string", format: "uuid" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
    controller.updateProduct.bind(controller) as any,
  );

  // DELETE /products/:productId — Delete product (Admin only)
  fastify.delete(
    "/products/:productId",
    {
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a product",
        tags: ["Products"],
        summary: "Delete Product",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["productId"],
          properties: { productId: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            description: "Product deleted successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "Product deleted successfully",
              },
            },
          },
        },
      },
    },
    controller.deleteProduct.bind(controller) as any,
  );
}

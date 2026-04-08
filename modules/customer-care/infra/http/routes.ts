import { FastifyInstance } from "fastify";
import {
  SupportTicketController,
  SupportAgentController,
  ChatSessionController,
  ReturnRequestController,
  RepairController,
  GoodwillRecordController,
  CustomerFeedbackController,
  TicketMessageController,
  ChatMessageController,
  ReturnItemController,
} from "./controllers";
import { SupportTicketService } from "../../application/services/support-ticket.service";
import { TicketMessageService } from "../../application/services/ticket-message.service";
import { SupportAgentService } from "../../application/services/support-agent.service";
import { ChatSessionService } from "../../application/services/chat-session.service";
import { ChatMessageService } from "../../application/services/chat-message.service";
import { ReturnRequestService } from "../../application/services/return-request.service";
import { ReturnItemService } from "../../application/services/return-item.service";
import { RepairService } from "../../application/services/repair.service";
import { GoodwillRecordService } from "../../application/services/goodwill-record.service";
import { CustomerFeedbackService } from "../../application/services/customer-feedback.service";
import {
  authenticateUser,
  optionalAuth,
  authenticateAdmin,
  authenticateStaff,
} from "../../../user-management/infra/http/middleware/auth.middleware";

// Standard error responses for Swagger/OpenAPI
const errorResponses = {
  400: {
    description: "Bad request - validation failed",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Validation failed" },
      errors: { type: "array", items: { type: "string" } },
    },
  },
  401: {
    description: "Unauthorized - authentication required",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Authentication required" },
    },
  },
  404: {
    description: "Not found",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Resource not found" },
    },
  },
  500: {
    description: "Internal server error",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Internal server error" },
    },
  },
};

// Route registration function
export async function registerCustomerCareRoutes(
  fastify: FastifyInstance,
  services: {
    supportTicketService: SupportTicketService;
    ticketMessageService: TicketMessageService;
    supportAgentService: SupportAgentService;
    chatSessionService: ChatSessionService;
    chatMessageService: ChatMessageService;
    returnRequestService: ReturnRequestService;
    returnItemService: ReturnItemService;
    repairService: RepairService;
    goodwillRecordService: GoodwillRecordService;
    customerFeedbackService: CustomerFeedbackService;
  }
) {
  // Initialize controllers
  const supportTicketController = new SupportTicketController(
    services.supportTicketService
  );
  const ticketMessageController = new TicketMessageController(
    services.ticketMessageService
  );
  const supportAgentController = new SupportAgentController(
    services.supportAgentService
  );
  const chatSessionController = new ChatSessionController(
    services.chatSessionService
  );
  const chatMessageController = new ChatMessageController(
    services.chatMessageService
  );
  const returnRequestController = new ReturnRequestController(
    services.returnRequestService
  );
  const returnItemController = new ReturnItemController(
    services.returnItemService
  );
  const repairController = new RepairController(services.repairService);
  const goodwillRecordController = new GoodwillRecordController(
    services.goodwillRecordService
  );
  const customerFeedbackController = new CustomerFeedbackController(
    services.customerFeedbackService
  );

  // =============================================================================
  // SUPPORT TICKET ROUTES
  // =============================================================================

  // Create support ticket
  fastify.post(
    "/customer-care/tickets",
    {
      preHandler: optionalAuth,
      schema: {
        description: "Create a new support ticket",
        tags: ["Customer Care - Tickets"],
        summary: "Create Support Ticket",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["source", "subject"],
          properties: {
            userId: { type: "string", format: "uuid" },
            orderId: { type: "string", format: "uuid" },
            source: {
              type: "string",
              enum: ["phone", "email", "chat"],
              description: "Ticket source channel",
            },
            subject: {
              type: "string",
              minLength: 1,
              maxLength: 500,
              description: "Ticket subject",
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "Ticket priority level",
            },
          },
        },
        response: {
          201: {
            description: "Support ticket created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  ticketId: { type: "string", format: "uuid" },
                  userId: { type: "string", format: "uuid" },
                  orderId: { type: "string", format: "uuid" },
                  source: {
                    type: "string",
                    enum: ["phone", "email", "chat"],
                  },
                  subject: { type: "string" },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "urgent"],
                  },
                  status: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    supportTicketController.createTicket.bind(supportTicketController) as any
  );

  // Get support ticket by ID
  fastify.get(
    "/customer-care/tickets/:ticketId",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Get support ticket by ID",
        tags: ["Customer Care - Tickets"],
        summary: "Get Support Ticket",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["ticketId"],
          properties: {
            ticketId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Support ticket details",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  ticketId: { type: "string", format: "uuid" },
                  userId: { type: "string", format: "uuid" },
                  orderId: { type: "string", format: "uuid" },
                  source: {
                    type: "string",
                    enum: ["phone", "email", "chat"],
                  },
                  subject: { type: "string" },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "urgent"],
                  },
                  status: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    supportTicketController.getTicket.bind(supportTicketController) as any
  );

  // List support tickets
  fastify.get(
    "/customer-care/tickets",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "List all support tickets",
        tags: ["Customer Care - Tickets"],
        summary: "List Support Tickets",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "List of support tickets",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ticketId: { type: "string", format: "uuid" },
                    userId: { type: "string", format: "uuid" },
                    orderId: { type: "string", format: "uuid" },
                    source: {
                      type: "string",
                      enum: ["phone", "email", "chat"],
                    },
                    subject: { type: "string" },
                    priority: {
                      type: "string",
                      enum: ["low", "medium", "high", "urgent"],
                    },
                    status: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                  },
                },
              },
              total: { type: "integer" },
            },
          },
          ...errorResponses,
        },
      },
    },
    supportTicketController.listTickets.bind(supportTicketController) as any
  );

  // Update support ticket
  fastify.patch(
    "/customer-care/tickets/:ticketId",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Update support ticket details",
        tags: ["Customer Care - Tickets"],
        summary: "Update Support Ticket",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["ticketId"],
          properties: {
            ticketId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            subject: {
              type: "string",
              minLength: 1,
              maxLength: 500,
              description: "Ticket subject",
            },
            status: {
              type: "string",
              enum: ["open", "in_progress", "resolved", "closed"],
              description: "Ticket status",
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "Ticket priority",
            },
          },
        },
        response: {
          200: {
            description: "Support ticket updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    supportTicketController.updateTicket.bind(supportTicketController) as any
  );

  // Delete support ticket
  fastify.delete(
    "/customer-care/tickets/:ticketId",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Delete a support ticket",
        tags: ["Customer Care - Tickets"],
        summary: "Delete Support Ticket",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["ticketId"],
          properties: {
            ticketId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Support ticket deleted successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    supportTicketController.deleteTicket.bind(supportTicketController) as any
  );

  // =============================================================================
  // TICKET MESSAGE ROUTES
  // =============================================================================

  // Add message to ticket
  fastify.post(
    "/customer-care/tickets/:ticketId/messages",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Add a message to a support ticket",
        tags: ["Customer Care - Tickets"],
        summary: "Add Ticket Message",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["ticketId"],
          properties: {
            ticketId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["sender", "message"],
          properties: {
            sender: {
              type: "string",
              enum: ["customer", "agent"],
              description: "Message sender type",
            },
            message: {
              type: "string",
              minLength: 1,
              description: "Message content",
            },
          },
        },
        response: {
          201: {
            description: "Message added successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  messageId: { type: "string", format: "uuid" },
                  ticketId: { type: "string", format: "uuid" },
                  sender: {
                    type: "string",
                    enum: ["customer", "agent"],
                  },
                  body: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    ticketMessageController.addMessage.bind(ticketMessageController) as any
  );

  // Get ticket messages
  fastify.get(
    "/customer-care/tickets/:ticketId/messages",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Get all messages for a ticket",
        tags: ["Customer Care - Tickets"],
        summary: "Get Ticket Messages",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["ticketId"],
          properties: {
            ticketId: { type: "string", format: "uuid" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            sender: {
              type: "string",
              enum: ["customer", "agent"],
              description: "Filter by sender type",
            },
          },
        },
        response: {
          200: {
            description: "List of ticket messages",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    messageId: { type: "string", format: "uuid" },
                    ticketId: { type: "string", format: "uuid" },
                    sender: {
                      type: "string",
                      enum: ["customer", "agent"],
                    },
                    body: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              total: { type: "integer" },
            },
          },
          ...errorResponses,
        },
      },
    },
    ticketMessageController.getMessages.bind(ticketMessageController) as any
  );

  // =============================================================================
  // SUPPORT AGENT ROUTES
  // =============================================================================

  // Create support agent
  fastify.post(
    "/customer-care/agents",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Create a new support agent",
        tags: ["Customer Care - Agents"],
        summary: "Create Support Agent",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              minLength: 1,
              description: "Agent name",
            },
            roster: {
              type: "array",
              items: { type: "string" },
              description: "Agent roster/schedule",
            },
            skills: {
              type: "array",
              items: { type: "string" },
              description: "Agent skills",
            },
          },
        },
        response: {
          201: {
            description: "Support agent created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    supportAgentController.createAgent.bind(supportAgentController) as any
  );

  // Get support agent by ID
  fastify.get(
    "/customer-care/agents/:agentId",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Get support agent by ID",
        tags: ["Customer Care - Agents"],
        summary: "Get Support Agent",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["agentId"],
          properties: {
            agentId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Support agent details",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...errorResponses,
        },
      },
    },
    supportAgentController.getAgent.bind(supportAgentController) as any
  );

  // Update support agent
  fastify.patch(
    "/customer-care/agents/:agentId",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Update support agent details",
        tags: ["Customer Care - Agents"],
        summary: "Update Support Agent",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["agentId"],
          properties: {
            agentId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            roster: {
              type: "array",
              items: { type: "string" },
            },
            skills: {
              type: "array",
              items: { type: "string" },
              description: "Agent skills",
            },
          },
        },
        response: {
          200: {
            description: "Support agent updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    supportAgentController.updateAgent.bind(supportAgentController) as any
  );

  // List support agents
  fastify.get(
    "/customer-care/agents",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "List all support agents",
        tags: ["Customer Care - Agents"],
        summary: "List Support Agents",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "List of support agents",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
              total: { type: "integer" },
            },
          },
          ...errorResponses,
        },
      },
    },
    supportAgentController.listAgents.bind(supportAgentController) as any
  );

  // Delete support agent
  fastify.delete(
    "/customer-care/agents/:agentId",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Delete a support agent",
        tags: ["Customer Care - Agents"],
        summary: "Delete Support Agent",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["agentId"],
          properties: {
            agentId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Support agent deleted successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    supportAgentController.deleteAgent.bind(supportAgentController) as any
  );

  // =============================================================================
  // CHAT SESSION ROUTES
  // =============================================================================

  // Create chat session
  fastify.post(
    "/customer-care/chat-sessions",
    {
      preHandler: optionalAuth,
      schema: {
        description: "Create a new chat session",
        tags: ["Customer Care - Chat"],
        summary: "Create Chat Session",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            userId: { type: "string", format: "uuid" },
            topic: { type: "string", maxLength: 500 },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
            },
          },
        },
        response: {
          201: {
            description: "Chat session created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    chatSessionController.createSession.bind(chatSessionController) as any
  );

  // Get chat session by ID
  fastify.get(
    "/customer-care/chat-sessions/:sessionId",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Get chat session by ID",
        tags: ["Customer Care - Chat"],
        summary: "Get Chat Session",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["sessionId"],
          properties: {
            sessionId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Chat session details",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...errorResponses,
        },
      },
    },
    chatSessionController.getSession.bind(chatSessionController) as any
  );

  // End chat session
  fastify.post(
    "/customer-care/chat-sessions/:sessionId/end",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "End a chat session",
        tags: ["Customer Care - Chat"],
        summary: "End Chat Session",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["sessionId"],
          properties: {
            sessionId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Chat session ended successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    chatSessionController.endSession.bind(chatSessionController) as any
  );

  // List chat sessions
  fastify.get(
    "/customer-care/chat-sessions",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "List all chat sessions",
        tags: ["Customer Care - Chat"],
        summary: "List Chat Sessions",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "List of chat sessions",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
              total: { type: "integer" },
            },
          },
          ...errorResponses,
        },
      },
    },
    chatSessionController.listSessions.bind(chatSessionController) as any
  );

  // =============================================================================
  // CHAT MESSAGE ROUTES
  // =============================================================================

  // Add message to chat session
  fastify.post(
    "/customer-care/chat-sessions/:sessionId/messages",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Add a message to a chat session",
        tags: ["Customer Care - Chat"],
        summary: "Add Chat Message",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["sessionId"],
          properties: {
            sessionId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["senderId", "senderType", "content"],
          properties: {
            senderId: { type: "string", format: "uuid" },
            senderType: {
              type: "string",
              enum: ["user", "agent"],
            },
            content: { type: "string", minLength: 1 },
            messageType: { type: "string" },
            metadata: {
              type: "object",
              description:
                "Optional metadata for the message (attachments, formatting, etc.)",
              additionalProperties: true,
            },
            isAutomated: { type: "boolean" },
          },
        },
        response: {
          201: {
            description: "Message added successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    chatMessageController.addMessage.bind(chatMessageController) as any
  );

  // Get chat messages
  fastify.get(
    "/customer-care/chat-sessions/:sessionId/messages",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Get all messages for a chat session",
        tags: ["Customer Care - Chat"],
        summary: "Get Chat Messages",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["sessionId"],
          properties: {
            sessionId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "List of chat messages",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
              total: { type: "integer" },
            },
          },
          ...errorResponses,
        },
      },
    },
    chatMessageController.getMessages.bind(chatMessageController) as any
  );

  // =============================================================================
  // RETURN REQUEST ROUTES
  // =============================================================================

  // Create return request
  fastify.post(
    "/customer-care/returns",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Create a new return request",
        tags: ["Customer Care - Returns"],
        summary: "Create Return Request",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["orderId", "type"],
          properties: {
            orderId: { type: "string", format: "uuid" },
            type: {
              type: "string",
              enum: ["return", "exchange", "gift_return"],
            },
            reason: { type: "string", maxLength: 1000 },
          },
        },
        response: {
          201: {
            description: "Return request created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    returnRequestController.createReturnRequest.bind(
      returnRequestController
    ) as any
  );

  // Get return request by ID
  fastify.get(
    "/customer-care/returns/:rmaId",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Get return request by RMA ID",
        tags: ["Customer Care - Returns"],
        summary: "Get Return Request",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["rmaId"],
          properties: {
            rmaId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Return request details",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...errorResponses,
        },
      },
    },
    returnRequestController.getReturnRequest.bind(
      returnRequestController
    ) as any
  );

  // List return requests
  fastify.get(
    "/customer-care/returns",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "List all return requests",
        tags: ["Customer Care - Returns"],
        summary: "List Return Requests",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "List of return requests",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
              total: { type: "integer" },
            },
          },
          ...errorResponses,
        },
      },
    },
    returnRequestController.listReturnRequests.bind(
      returnRequestController
    ) as any
  );

  // Update return request
  fastify.patch(
    "/customer-care/returns/:rmaId",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Update return request details",
        tags: ["Customer Care - Returns"],
        summary: "Update Return Request",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["rmaId"],
          properties: {
            rmaId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: [
                "eligibility",
                "approved",
                "in_transit",
                "received",
                "refunded",
                "rejected",
              ],
              description: "RMA status",
            },
            reason: {
              type: "string",
              maxLength: 1000,
              description: "Return reason",
            },
          },
        },
        response: {
          200: {
            description: "Return request updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    returnRequestController.updateReturnRequest.bind(
      returnRequestController
    ) as any
  );

  // Delete return request
  fastify.delete(
    "/customer-care/returns/:rmaId",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Delete a return request",
        tags: ["Customer Care - Returns"],
        summary: "Delete Return Request",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["rmaId"],
          properties: {
            rmaId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Return request deleted successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    returnRequestController.deleteReturnRequest.bind(
      returnRequestController
    ) as any
  );

  // =============================================================================
  // RETURN ITEM ROUTES
  // =============================================================================

  // Add item to return request
  fastify.post(
    "/customer-care/returns/:rmaId/items",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Add an item to a return request",
        tags: ["Customer Care - Returns"],
        summary: "Add Return Item",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["rmaId"],
          properties: {
            rmaId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["orderItemId", "quantity"],
          properties: {
            orderItemId: { type: "string", format: "uuid" },
            quantity: { type: "integer", minimum: 1 },
            condition: {
              type: "string",
              enum: ["new", "used", "damaged"],
            },
            disposition: {
              type: "string",
              enum: ["restock", "repair", "discard"],
            },
            fees: { type: "number", minimum: 0 },
            currency: { type: "string", default: "USD" },
          },
        },
        response: {
          201: {
            description: "Return item added successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    returnItemController.addReturnItem.bind(returnItemController) as any
  );

  // Get return items
  fastify.get(
    "/customer-care/returns/:rmaId/items",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Get all items for a return request",
        tags: ["Customer Care - Returns"],
        summary: "Get Return Items",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["rmaId"],
          properties: {
            rmaId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "List of return items",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
              total: { type: "integer" },
            },
          },
          ...errorResponses,
        },
      },
    },
    returnItemController.getReturnItems.bind(returnItemController) as any
  );

  // Update return item condition
  fastify.patch(
    "/customer-care/returns/:rmaId/items/:orderItemId/condition",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Update return item condition",
        tags: ["Customer Care - Returns"],
        summary: "Update Return Item Condition",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["rmaId", "orderItemId"],
          properties: {
            rmaId: { type: "string", format: "uuid" },
            orderItemId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["condition"],
          properties: {
            condition: {
              type: "string",
              enum: ["new", "used", "damaged"],
            },
          },
        },
        response: {
          200: {
            description: "Return item condition updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    returnItemController.updateReturnItemCondition.bind(
      returnItemController
    ) as any
  );

  // =============================================================================
  // REPAIR ROUTES
  // =============================================================================

  // Create repair
  fastify.post(
    "/customer-care/repairs",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Create a new repair request",
        tags: ["Customer Care - Repairs"],
        summary: "Create Repair",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["orderItemId"],
          properties: {
            orderItemId: { type: "string", format: "uuid" },
            notes: { type: "string", maxLength: 1000 },
          },
        },
        response: {
          201: {
            description: "Repair created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    repairController.createRepair.bind(repairController) as any
  );

  // Get repair by ID
  fastify.get(
    "/customer-care/repairs/:repairId",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Get repair by ID",
        tags: ["Customer Care - Repairs"],
        summary: "Get Repair",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["repairId"],
          properties: {
            repairId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Repair details",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...errorResponses,
        },
      },
    },
    repairController.getRepair.bind(repairController) as any
  );

  // Update repair status
  fastify.patch(
    "/customer-care/repairs/:repairId/status",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Update repair status",
        tags: ["Customer Care - Repairs"],
        summary: "Update Repair Status",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["repairId"],
          properties: {
            repairId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed", "cancelled"],
            },
          },
        },
        response: {
          200: {
            description: "Repair status updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    repairController.updateRepairStatus.bind(repairController) as any
  );

  // List repairs
  fastify.get(
    "/customer-care/repairs",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "List all repairs",
        tags: ["Customer Care - Repairs"],
        summary: "List Repairs",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "List of repairs",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
              total: { type: "integer" },
            },
          },
          ...errorResponses,
        },
      },
    },
    repairController.listRepairs.bind(repairController) as any
  );

  // Update repair
  fastify.patch(
    "/customer-care/repairs/:repairId",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Update repair details (notes and/or status)",
        tags: ["Customer Care - Repairs"],
        summary: "Update Repair",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["repairId"],
          properties: {
            repairId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            notes: {
              type: "string",
              maxLength: 1000,
              description: "Repair notes",
            },
            status: {
              type: "string",
              enum: [
                "pending",
                "in_progress",
                "completed",
                "failed",
                "cancelled",
              ],
              description: "Repair status",
            },
          },
        },
        response: {
          200: {
            description: "Repair updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    repairController.updateRepair.bind(repairController) as any
  );

  // Delete repair
  fastify.delete(
    "/customer-care/repairs/:repairId",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Delete a repair",
        tags: ["Customer Care - Repairs"],
        summary: "Delete Repair",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["repairId"],
          properties: {
            repairId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Repair deleted successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    repairController.deleteRepair.bind(repairController) as any
  );

  // =============================================================================
  // GOODWILL RECORD ROUTES
  // =============================================================================

  // Create goodwill record
  fastify.post(
    "/customer-care/goodwill",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Create a new goodwill record",
        tags: ["Customer Care - Goodwill"],
        summary: "Create Goodwill Record",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["type", "value"],
          properties: {
            userId: { type: "string", format: "uuid" },
            orderId: { type: "string", format: "uuid" },
            type: {
              type: "string",
              enum: ["store_credit", "discount", "points"],
            },
            value: { type: "number", minimum: 0 },
            currency: { type: "string", default: "USD" },
            reason: { type: "string", maxLength: 1000 },
          },
        },
        response: {
          201: {
            description: "Goodwill record created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    goodwillRecordController.createRecord.bind(goodwillRecordController) as any
  );

  // Get goodwill record by ID
  fastify.get(
    "/customer-care/goodwill/:goodwillId",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Get goodwill record by ID",
        tags: ["Customer Care - Goodwill"],
        summary: "Get Goodwill Record",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["goodwillId"],
          properties: {
            goodwillId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Goodwill record details",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...errorResponses,
        },
      },
    },
    goodwillRecordController.getRecord.bind(goodwillRecordController) as any
  );

  // List goodwill records
  fastify.get(
    "/customer-care/goodwill",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "List all goodwill records",
        tags: ["Customer Care - Goodwill"],
        summary: "List Goodwill Records",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "List of goodwill records",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
              total: { type: "integer" },
            },
          },
          ...errorResponses,
        },
      },
    },
    goodwillRecordController.listRecords.bind(goodwillRecordController) as any
  );

  // =============================================================================
  // CUSTOMER FEEDBACK ROUTES
  // =============================================================================

  // Add customer feedback
  fastify.post(
    "/customer-care/feedback",
    {
      preHandler: optionalAuth,
      schema: {
        description: "Submit customer feedback",
        tags: ["Customer Care - Feedback"],
        summary: "Add Customer Feedback",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              format: "uuid",
              description:
                "User ID - must be the owner of the ticket/order if provided",
            },
            ticketId: {
              type: "string",
              format: "uuid",
              description:
                "Support ticket ID - must belong to the specified userId if provided",
            },
            orderId: {
              type: "string",
              format: "uuid",
              description:
                "Order ID - must belong to the specified userId if provided",
            },
            npsScore: {
              type: "integer",
              minimum: 0,
              maximum: 10,
              description: "Net Promoter Score (0-10)",
            },
            csatScore: {
              type: "integer",
              minimum: 1,
              maximum: 5,
              description: "Customer Satisfaction Score (1-5)",
            },
            comment: { type: "string", maxLength: 2000 },
          },
          additionalProperties: false,
          anyOf: [
            { required: ["npsScore"] },
            { required: ["csatScore"] },
            { required: ["comment"] },
          ],
        },
        response: {
          201: {
            description: "Feedback submitted successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
              message: { type: "string" },
            },
          },
          ...errorResponses,
        },
      },
    },
    customerFeedbackController.addFeedback.bind(
      customerFeedbackController
    ) as any
  );

  // Get customer feedback by ID
  fastify.get(
    "/customer-care/feedback/:feedbackId",
    {
      preHandler: authenticateStaff as any,
      schema: {
        description: "Get customer feedback by ID",
        tags: ["Customer Care - Feedback"],
        summary: "Get Customer Feedback",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["feedbackId"],
          properties: {
            feedbackId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            description: "Customer feedback details",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...errorResponses,
        },
      },
    },
    customerFeedbackController.getFeedback.bind(
      customerFeedbackController
    ) as any
  );

  // List customer feedback
  fastify.get(
    "/customer-care/feedback",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "List all customer feedback",
        tags: ["Customer Care - Feedback"],
        summary: "List Customer Feedback",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "List of customer feedback",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
              total: { type: "integer" },
            },
          },
          ...errorResponses,
        },
      },
    },
    customerFeedbackController.listFeedback.bind(
      customerFeedbackController
    ) as any
  );
}

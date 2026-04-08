// Barrel for queries

// Base Query Types (exported once from get-support-ticket.query.js)
export {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "./get-support-ticket.query.js";

// Support Ticket Queries
export {
  GetSupportTicketQuery,
  SupportTicketDto,
  GetSupportTicketHandler,
} from "./get-support-ticket.query.js";
export {
  ListSupportTicketsQuery,
  ListSupportTicketsHandler,
} from "./list-support-tickets.query.js";
export {
  GetTicketMessagesQuery,
  TicketMessageResult,
  GetTicketMessagesHandler,
} from "./get-ticket-messages.query.js";

// Support Agent Queries
export {
  GetSupportAgentQuery,
  SupportAgentDto,
  GetSupportAgentHandler,
} from "./get-support-agent.query.js";
export {
  ListSupportAgentsQuery,
  ListSupportAgentsHandler,
} from "./list-support-agents.query.js";

// Chat Session Queries
export {
  GetChatSessionQuery,
  ChatSessionDto,
  GetChatSessionHandler,
} from "./get-chat-session.query.js";
export {
  ListChatSessionsQuery,
  ListChatSessionsHandler,
} from "./list-chat-sessions.query.js";
export {
  GetChatMessagesQuery,
  ChatMessageDto,
  GetChatMessagesHandler,
} from "./get-chat-messages.query.js";

// Return/RMA Queries
export {
  GetReturnRequestQuery,
  ReturnRequestDto,
  GetReturnRequestHandler,
} from "./get-return-request.query.js";
export {
  ListReturnRequestsQuery,
  ListReturnRequestsHandler,
} from "./list-return-requests.query.js";
export {
  GetReturnItemQuery,
  GetReturnItemsQuery,
  ReturnItemDto,
  GetReturnItemHandler,
  GetReturnItemsHandler,
} from "./get-return-items.query.js";

// Repair Queries
export {
  GetRepairQuery,
  RepairDto,
  GetRepairHandler,
} from "./get-repair.query.js";
export { ListRepairsQuery, ListRepairsHandler } from "./list-repairs.query.js";

// Goodwill Queries
export {
  GetGoodwillRecordQuery,
  GoodwillRecordDto,
  GetGoodwillRecordHandler,
} from "./get-goodwill-record.query.js";
export {
  ListGoodwillRecordsQuery,
  ListGoodwillRecordsHandler,
} from "./list-goodwill-records.query.js";

// Customer Feedback Queries
export {
  GetCustomerFeedbackQuery,
  CustomerFeedbackDto,
  GetCustomerFeedbackHandler,
} from "./get-customer-feedback.query.js";
export {
  ListCustomerFeedbackQuery,
  ListCustomerFeedbackHandler,
} from "./list-customer-feedback.query.js";

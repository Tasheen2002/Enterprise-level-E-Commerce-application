// Support Ticket Commands
export {
  CreateSupportTicketCommand,
  CreateSupportTicketHandler,
} from "./create-support-ticket.command.js";
export {
  AddTicketMessageCommand,
  AddTicketMessageHandler,
} from "./add-ticket-message.command.js";
export {
  UpdateTicketStatusCommand,
  UpdateTicketStatusHandler,
} from "./update-ticket-status.command.js";
export {
  CloseTicketCommand,
  CloseTicketHandler,
} from "./close-ticket.command.js";

// Support Agent Commands
export {
  CreateSupportAgentCommand,
  CreateSupportAgentHandler,
} from "./create-support-agent.command.js";
export {
  UpdateSupportAgentCommand,
  UpdateSupportAgentHandler,
} from "./update-support-agent.command.js";
export {
  AssignSupportAgentCommand,
  AssignSupportAgentHandler,
} from "./assign-support-agent.command.js";

// Chat Session Commands
export {
  CreateChatSessionCommand,
  CreateChatSessionHandler,
} from "./create-chat-session.command.js";
export {
  AddChatMessageCommand,
  AddChatMessageHandler,
} from "./add-chat-message.command.js";
export {
  EndChatSessionCommand,
  EndChatSessionHandler,
} from "./end-chat-session.command.js";

// Return/RMA Commands
export {
  CreateReturnRequestCommand,
  CreateReturnRequestHandler,
} from "./create-return-request.command.js";
export {
  AddReturnItemCommand,
  AddReturnItemHandler,
} from "./add-return-item.command.js";
export {
  UpdateRmaStatusCommand,
  UpdateRmaStatusHandler,
} from "./update-rma-status.command.js";
export {
  ApproveReturnCommand,
  ApproveReturnHandler,
} from "./approve-return.command.js";
export {
  RejectReturnCommand,
  RejectReturnHandler,
} from "./reject-return.command.js";
export {
  UpdateReturnItemConditionCommand,
  UpdateReturnItemConditionHandler,
} from "./update-return-item-condition.command.js";
export {
  ProcessRefundCommand,
  ProcessRefundHandler,
} from "./process-refund.command.js";

// Repair Commands
export {
  CreateRepairCommand,
  CreateRepairHandler,
} from "./create-repair.command.js";
export {
  UpdateRepairStatusCommand,
  UpdateRepairStatusHandler,
} from "./update-repair-status.command.js";

// Goodwill Commands
export {
  CreateGoodwillRecordCommand,
  CreateGoodwillRecordHandler,
} from "./create-goodwill-record.command.js";

// Customer Feedback Commands
export {
  AddCustomerFeedbackCommand,
  AddCustomerFeedbackHandler,
} from "./add-customer-feedback.command.js";

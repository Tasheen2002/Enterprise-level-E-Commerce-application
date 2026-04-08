import {
  ITicketMessageRepository,
  MessageQueryOptions,
  MessageFilterOptions,
} from "../../domain/repositories/ticket-message.repository.js";
import { TicketMessage } from "../../domain/entities/ticket-message.entity.js";
import { MessageId, MessageSender } from "../../domain/value-objects/index.js";

export class TicketMessageService {
  constructor(private readonly messageRepository: ITicketMessageRepository) {}

  async createMessage(data: {
    ticketId: string;
    sender: MessageSender;
    body: string;
  }): Promise<TicketMessage> {
    const message = TicketMessage.create({
      ticketId: data.ticketId,
      sender: data.sender,
      body: data.body,
    });

    await this.messageRepository.save(message);
    return message;
  }

  async getMessage(messageId: string): Promise<TicketMessage | null> {
    return await this.messageRepository.findById(MessageId.create(messageId));
  }

  async getMessagesByTicket(
    ticketId: string,
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]> {
    return await this.messageRepository.findByTicketId(ticketId, options);
  }

  async getLatestMessages(
    ticketId: string,
    limit?: number
  ): Promise<TicketMessage[]> {
    return await this.messageRepository.findLatestByTicket(ticketId, limit);
  }

  async getAgentMessages(
    ticketId: string,
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]> {
    return await this.messageRepository.findAgentMessages(ticketId, options);
  }

  async getCustomerMessages(
    ticketId: string,
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]> {
    return await this.messageRepository.findCustomerMessages(ticketId, options);
  }

  async getMessagesBySender(
    sender: MessageSender,
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]> {
    return await this.messageRepository.findBySender(sender, options);
  }

  async getMessagesWithFilters(
    filters: MessageFilterOptions,
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]> {
    return await this.messageRepository.findWithFilters(filters, options);
  }

  async getAllMessages(
    options?: MessageQueryOptions
  ): Promise<TicketMessage[]> {
    return await this.messageRepository.findAll(options);
  }

  async deleteMessage(messageId: string): Promise<void> {
    const exists = await this.messageRepository.exists(
      MessageId.create(messageId)
    );

    if (!exists) {
      throw new Error(`Message with ID ${messageId} not found`);
    }

    await this.messageRepository.delete(MessageId.create(messageId));
  }

  async countMessagesByTicket(ticketId: string): Promise<number> {
    return await this.messageRepository.countByTicketId(ticketId);
  }

  async countMessagesBySender(sender: MessageSender): Promise<number> {
    return await this.messageRepository.countBySender(sender);
  }

  async countMessages(filters?: MessageFilterOptions): Promise<number> {
    return await this.messageRepository.count(filters);
  }

  async messageExists(messageId: string): Promise<boolean> {
    return await this.messageRepository.exists(MessageId.create(messageId));
  }

  async hasTicketMessages(ticketId: string): Promise<boolean> {
    return await this.messageRepository.hasTicketMessages(ticketId);
  }
}

import {
  IChatMessageRepository,
  ChatMessageQueryOptions,
  ChatMessageFilterOptions,
} from "../../domain/repositories/chat-message.repository.js";
import { ChatMessage } from "../../domain/entities/chat-message.entity.js";
import { MessageId, ChatSenderType } from "../../domain/value-objects/index.js";

export class ChatMessageService {
  constructor(private readonly messageRepository: IChatMessageRepository) {}

  async createMessage(data: {
    sessionId: string;
    senderId: string;
    senderType: ChatSenderType;
    content: string;
    messageType?: string;
    metadata?: Record<string, any>;
    isAutomated?: boolean;
  }): Promise<ChatMessage> {
    const message = ChatMessage.create({
      sessionId: data.sessionId,
      senderId: data.senderId,
      senderType: data.senderType,
      content: data.content,
      messageType: data.messageType,
      metadata: data.metadata,
      isAutomated: data.isAutomated,
    });

    await this.messageRepository.save(message);
    return message;
  }

  async getMessage(messageId: string): Promise<ChatMessage | null> {
    return await this.messageRepository.findById(MessageId.create(messageId));
  }

  async getMessagesBySession(
    sessionId: string,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
    return await this.messageRepository.findBySessionId(sessionId, options);
  }

  async getLatestMessages(
    sessionId: string,
    limit?: number
  ): Promise<ChatMessage[]> {
    return await this.messageRepository.findLatestBySession(sessionId, limit);
  }

  async getUserMessages(
    sessionId: string,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
    return await this.messageRepository.findUserMessages(sessionId, options);
  }

  async getAgentMessages(
    sessionId: string,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
    return await this.messageRepository.findAgentMessages(sessionId, options);
  }

  async getAutomatedMessages(
    sessionId: string,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
    return await this.messageRepository.findAutomatedMessages(
      sessionId,
      options
    );
  }

  async getMessagesBySender(
    senderId: string,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
    return await this.messageRepository.findBySenderId(senderId, options);
  }

  async getMessagesBySenderType(
    senderType: ChatSenderType,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
    return await this.messageRepository.findBySenderType(senderType, options);
  }

  async getMessagesWithFilters(
    filters: ChatMessageFilterOptions,
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
    return await this.messageRepository.findWithFilters(filters, options);
  }

  async getAllMessages(
    options?: ChatMessageQueryOptions
  ): Promise<ChatMessage[]> {
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

  async countMessagesBySession(sessionId: string): Promise<number> {
    return await this.messageRepository.countBySessionId(sessionId);
  }

  async countMessagesBySenderType(senderType: ChatSenderType): Promise<number> {
    return await this.messageRepository.countBySenderType(senderType);
  }

  async countAutomatedMessages(sessionId?: string): Promise<number> {
    return await this.messageRepository.countAutomated(sessionId);
  }

  async countMessages(filters?: ChatMessageFilterOptions): Promise<number> {
    return await this.messageRepository.count(filters);
  }

  async messageExists(messageId: string): Promise<boolean> {
    return await this.messageRepository.exists(MessageId.create(messageId));
  }

  async hasSessionMessages(sessionId: string): Promise<boolean> {
    return await this.messageRepository.hasSessionMessages(sessionId);
  }
}

import { describe, it, expect, vi } from "vitest";
import { SubscribeNewsletterHandler, SubscribeNewsletterCommand } from "@modules/engagement/application/commands/subscribe-newsletter.command";
import { NewsletterService } from "@modules/engagement/application/services/newsletter.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("SubscribeNewsletterHandler", () => {
  it("should successfully subscribe email to newsletter using NewsletterService", async () => {
    // Arrange
    const mockDto = {
      id: "sub-123",
      email: "subscriber@example.com",
      status: "active",
      source: "footer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const mockService = {
      subscribe: vi.fn().mockResolvedValue(mockDto)
    } as unknown as NewsletterService;

    const handler = new SubscribeNewsletterHandler(mockService);

    const command: SubscribeNewsletterCommand = {
      email: "subscriber@example.com",
      source: "footer"
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.subscribe).toHaveBeenCalledWith("subscriber@example.com", "footer");
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toBe(mockDto);
  });
});

import { describe, it, expect, vi } from "vitest";
import { CloseTicketHandler, CloseTicketCommand, CommandResult } from "@modules/customer-care/application/commands/close-ticket.command";
import { SupportTicketService } from "@modules/customer-care/application/services/support-ticket.service";

describe("CloseTicketHandler", () => {
  it("should successfully close a ticket using SupportTicketService", async () => {
    // Arrange
    const mockService = {
      closeTicket: vi.fn().mockResolvedValue(undefined),
    } as unknown as SupportTicketService;

    const handler = new CloseTicketHandler(mockService);

    const command: CloseTicketCommand = {
      ticketId: "ticket-123",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.closeTicket).toHaveBeenCalledWith("ticket-123");
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
  });

  it("should fail validation if ticketId is missing", async () => {
    const mockService = {} as unknown as SupportTicketService;
    const handler = new CloseTicketHandler(mockService);
    const command: CloseTicketCommand = {
      ticketId: "",
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Ticket ID is required");
    expect(result.errors).toContain("ticketId");
  });
});

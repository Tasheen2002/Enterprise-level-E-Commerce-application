import { describe, it, expect, vi } from "vitest";
import { DeleteReminderHandler, DeleteReminderCommand } from "@modules/engagement/application/commands/delete-reminder.command";
import { ReminderManagementService } from "@modules/engagement/application/services/reminder-management.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("DeleteReminderHandler", () => {
  it("should successfully delete a reminder using ReminderManagementService", async () => {
    // Arrange
    const mockService = {
      deleteReminder: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReminderManagementService;

    const handler = new DeleteReminderHandler(mockService);

    const command: DeleteReminderCommand = {
      reminderId: "reminder-123",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.deleteReminder).toHaveBeenCalledWith("reminder-123");
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
  });
});

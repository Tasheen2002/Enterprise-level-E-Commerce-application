import { describe, expect, it, vi } from "vitest";
import { UserService } from "../../../application/services/user.service";
import { AdminSafetyError } from "../../../domain/errors/user-management.errors";
import { UserRole } from "../../../domain/value-objects/user-role.vo";
import { UserStatus } from "../../../domain/value-objects/user-status.vo";

const ACTING = "00000000-0000-4000-8000-000000000001";
const TARGET = "00000000-0000-4000-8000-000000000002";

function service(target: { role: UserRole; status: UserStatus }, activeAdmins: number) {
  const user = {
    id: { getValue: () => TARGET },
    role: target.role,
    status: target.status,
    updateRole: vi.fn(),
    deactivate: vi.fn(),
    block: vi.fn(),
    activate: vi.fn(),
  };
  const repo = {
    findById: vi.fn().mockResolvedValue(user),
    findAllWithFilters: vi.fn().mockResolvedValue({ items: [], total: activeAdmins }),
    save: vi.fn(),
    delete: vi.fn(),
  };
  return { svc: new UserService(repo as never), repo, user };
}

vi.mock("../../../domain/entities/user.entity", () => ({
  User: { toDTO: (u: unknown) => u },
}));

describe("admin safety rules", () => {
  it.each([
    ["delete", (s: UserService) => s.deleteUser(TARGET, ACTING)],
    ["demote", (s: UserService) => s.updateUserRole(TARGET, UserRole.CUSTOMER, ACTING)],
    ["deactivate", (s: UserService) => s.updateUserStatus(TARGET, UserStatus.INACTIVE, ACTING)],
  ])("refuses to %s the last active administrator", async (_label, act) => {
    const { svc, repo } = service({ role: UserRole.ADMIN, status: UserStatus.ACTIVE }, 1);
    await expect(act(svc)).rejects.toBeInstanceOf(AdminSafetyError);
    expect(repo.delete).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("refuses to delete one's own account", async () => {
    const { svc, repo } = service({ role: UserRole.CUSTOMER, status: UserStatus.ACTIVE }, 3);
    repo.findById.mockResolvedValueOnce({
      id: { getValue: () => ACTING },
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    await expect(svc.deleteUser(ACTING, ACTING)).rejects.toBeInstanceOf(AdminSafetyError);
  });

  it("allows managing an administrator while another active one remains", async () => {
    const { svc, repo } = service({ role: UserRole.ADMIN, status: UserStatus.ACTIVE }, 2);
    await svc.deleteUser(TARGET, ACTING);
    expect(repo.delete).toHaveBeenCalledOnce();
    expect(repo.findAllWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.ADMIN, status: UserStatus.ACTIVE }),
    );
  });

  it("does not restrict actions on non-admin users or re-activation", async () => {
    const { svc, repo } = service({ role: UserRole.CUSTOMER, status: UserStatus.ACTIVE }, 0);
    await svc.deleteUser(TARGET, ACTING);
    await svc.updateUserStatus(TARGET, UserStatus.BLOCKED, ACTING);
    expect(repo.findAllWithFilters).not.toHaveBeenCalled();
    const admin = service({ role: UserRole.ADMIN, status: UserStatus.INACTIVE }, 0);
    await admin.svc.updateUserStatus(TARGET, UserStatus.ACTIVE, ACTING);
    await admin.svc.updateUserRole(TARGET, UserRole.ADMIN, ACTING);
    expect(admin.repo.findAllWithFilters).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SafeAdmin } from "@/lib/auth";

const doubles = vi.hoisted(() => ({ findUnique: vi.fn(), cookie: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { adminUser: { findUnique: doubles.findUnique } } }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: doubles.cookie }) }));
import { canViewCenter, getCurrentAdmin, registrationAccessWhere, signAdminSession } from "@/lib/auth";

const manager: SafeAdmin = {
  id: "synthetic-manager", name: "Synthetic Manager", email: "manager@example.invalid",
  role: "CENTER_MANAGER", center: "synthetic-centre", active: true, forcePasswordChange: false,
};

describe("admin access boundaries", () => {
  beforeEach(() => { doubles.cookie.mockReset(); doubles.findUnique.mockReset(); });

  it("limits centre managers to their assigned centre and fails closed without assignment", () => {
    expect(canViewCenter(manager, "synthetic-centre")).toBe(true);
    expect(canViewCenter(manager, "other-synthetic-centre")).toBe(false);
    expect(registrationAccessWhere(manager)).toEqual({ center: "synthetic-centre" });
    expect(registrationAccessWhere({ ...manager, center: null })).toEqual({ center: "__NO_CENTER_ASSIGNED__" });
  });

  it.each(["SUPER_ADMIN", "DIRECTOR", "ADMISSION_OFFICIAL"] as const)("permits cross-centre access for %s", (role) => {
    expect(canViewCenter({ ...manager, role }, "other-synthetic-centre")).toBe(true);
    expect(registrationAccessWhere({ ...manager, role })).toEqual({});
  });

  it("rejects missing or invalid session cookies without querying the database", async () => {
    expect(await getCurrentAdmin()).toBeNull();
    doubles.cookie.mockReturnValue({ value: "synthetic-invalid-token" });
    expect(await getCurrentAdmin()).toBeNull();
    expect(doubles.findUnique).not.toHaveBeenCalled();
  });

  it("rejects inactive admins even with a valid session", async () => {
    doubles.cookie.mockReturnValue({ value: signAdminSession(manager.id) });
    doubles.findUnique.mockResolvedValue({ ...manager, active: false });
    expect(await getCurrentAdmin()).toBeNull();
  });

  it("resolves an active admin from a signed session", async () => {
    doubles.cookie.mockReturnValue({ value: signAdminSession(manager.id) });
    doubles.findUnique.mockResolvedValue(manager);
    expect(await getCurrentAdmin()).toEqual(manager);
  });
});

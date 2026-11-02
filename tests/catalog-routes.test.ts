import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as publicGET } from "@/app/api/registration-config/route";
import { GET as coursesGET } from "@/app/api/admin/courses/route";
import { GET as questionsGET } from "@/app/api/admin/questions/route";
import { GET as builderGET } from "@/app/api/admin/form-builder/route";

const doubles = vi.hoisted(() => ({
  bootstrap: vi.fn(), admin: vi.fn(),
  courses: vi.fn(), categories: vi.fn(), verification: vi.fn(), forms: vi.fn(),
}));
vi.mock("@/lib/registration-catalog-bootstrap", () => ({ ensureDefaultRegistrationCatalog: doubles.bootstrap }));
vi.mock("@/lib/auth", () => ({ getCurrentAdmin: doubles.admin }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  course: { findMany: doubles.courses }, courseCategory: { findMany: doubles.categories },
  verificationQuestion: { findMany: doubles.verification }, formQuestion: { findMany: doubles.forms },
} }));

describe("catalogue route boundaries", () => {
  beforeEach(() => {
    Object.values(doubles).forEach((mock) => mock.mockReset());
    doubles.bootstrap.mockResolvedValue(undefined);
    doubles.courses.mockResolvedValue([{ id: "synthetic-course", name: "Synthetic course" }]);
    doubles.categories.mockResolvedValue([]);
    doubles.verification.mockResolvedValue([]);
    doubles.forms.mockResolvedValue([]);
  });

  it("returns the public catalogue after initialization", async () => {
    const response = await publicGET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ courses: [{ id: "synthetic-course", name: "Synthetic course" }], categories: [], questions: [], formQuestions: [] });
    expect(doubles.bootstrap.mock.invocationCallOrder[0]).toBeLessThan(doubles.courses.mock.invocationCallOrder[0]);
    expect(doubles.courses).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ active: true, category: { active: true } }) }));
  });

  it("preserves the existing empty-success response on bootstrap failure", async () => {
    doubles.bootstrap.mockRejectedValue(new Error("Synthetic bootstrap failure"));
    const response = await publicGET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ courses: [], categories: [], questions: [], formQuestions: [] });
    expect(doubles.courses).not.toHaveBeenCalled();
  });

  it.each(["courses", "questions", "form-builder"])("rejects unauthorized admin %s reads before bootstrapping", async (route) => {
    const handlers = {
      courses: coursesGET,
      questions: questionsGET,
      "form-builder": builderGET,
    };
    for (const admin of [null, { role: "CENTER_MANAGER", forcePasswordChange: false }, { role: "SUPER_ADMIN", forcePasswordChange: true }]) {
      doubles.admin.mockResolvedValue(admin);
      const response = await handlers[route as keyof typeof handlers]();
      expect(response.status).toBe(403);
    }
    expect(doubles.bootstrap).not.toHaveBeenCalled();
    expect(doubles.courses).not.toHaveBeenCalled();
  });
});

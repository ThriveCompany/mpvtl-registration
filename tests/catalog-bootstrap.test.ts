import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/default-registration-catalog.json", () => ({
  default: {
    categories: ["Synthetic field"],
    courses: [{
      name: "Synthetic course", category: "Synthetic field", levels: ["Basic"],
      centerIds: ["synthetic-centre"], duration: "Synthetic duration", certificate: "Synthetic",
      description: "Synthetic fixture", learn: [], skills: [], careers: [], requirement: "", value: "",
    }],
    questions: [
      { level: "Basic", key: "canReadAndWrite", questionText: "Synthetic yes/no?", sortOrder: 1 },
      { level: "Basic", key: "availability", questionText: "When are you available?", sortOrder: 2 },
      { level: "Basic", key: "detail", questionText: "Synthetic detail", format: "open", sortOrder: 3 },
    ],
  },
}));

function database(count = 0) {
  const named = () => ({
    count: vi.fn().mockResolvedValue(count),
    upsert: vi.fn().mockImplementation(async ({ where }: { where: { name: string } }) => ({ id: `id-${where.name}`, name: where.name })),
  });
  return {
    courseCategory: named(), courseLevel: named(), courseField: named(),
    course: { ...named(), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    verificationQuestion: {
      count: vi.fn().mockResolvedValue(count), findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "synthetic-question" }),
    },
    formQuestion: { count: vi.fn().mockResolvedValue(count), create: vi.fn().mockResolvedValue({ id: "synthetic-form-question" }) },
  };
}

describe("existing catalogue bootstrap contract", () => {
  beforeEach(() => vi.resetModules());

  async function run(db: ReturnType<typeof database>) {
    const { ensureDefaultRegistrationCatalog } = await import("@/lib/registration-catalog-bootstrap");
    return ensureDefaultRegistrationCatalog(db as unknown as PrismaClient);
  }

  it("does not write when all six catalogue counts are nonzero", async () => {
    const db = database(1);
    await run(db);
    expect(db.course.upsert).not.toHaveBeenCalled();
    expect(db.course.updateMany).not.toHaveBeenCalled();
    expect(db.courseLevel.upsert).not.toHaveBeenCalled();
    expect(db.courseCategory.upsert).not.toHaveBeenCalled();
    expect(db.courseField.upsert).not.toHaveBeenCalled();
    expect(db.verificationQuestion.create).not.toHaveBeenCalled();
    expect(db.formQuestion.create).not.toHaveBeenCalled();
  });

  it("creates defaults with field/level links and preserves empty upsert updates", async () => {
    const db = database();
    await run(db);
    expect(db.course.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: {}, create: expect.objectContaining({ name: "Synthetic course", categoryId: "id-Synthetic field", levelId: "id-Basic", fieldId: "id-Synthetic field" }),
    }));
    expect(db.verificationQuestion.create).toHaveBeenCalledTimes(3);
    expect(db.formQuestion.create).toHaveBeenCalledTimes(3);
    const questions = db.formQuestion.create.mock.calls.map(([arg]) => arg.data);
    expect(questions[0]).toMatchObject({ questionType: "yes_no", options: { create: [{ value: "Yes", sortOrder: 1 }, { value: "No", sortOrder: 2 }, { value: "Other, please describe", sortOrder: 3 }] } });
    expect(questions[1].options.create.map((option: { value: string }) => option.value)).toContain("Maybe");
    expect(questions[2]).toMatchObject({ questionType: "open", options: { create: [] } });
  });

  it("backfills existing courses if another catalogue section is missing", async () => {
    const db = database(1);
    db.courseField.count.mockResolvedValue(0);
    await run(db);
    expect(db.course.upsert).not.toHaveBeenCalled();
    expect(db.course.updateMany).toHaveBeenCalledWith({
      where: { name: "Synthetic course", OR: [{ levelId: null }, { fieldId: null }] },
      data: { levelId: "id-Basic", fieldId: "id-Synthetic field" },
    });
    expect(db.formQuestion.create).not.toHaveBeenCalled();
  });

  it("skips verification questions already present during partial bootstrap", async () => {
    const db = database();
    db.verificationQuestion.findFirst.mockResolvedValue({ id: "existing" });
    await run(db);
    expect(db.verificationQuestion.create).not.toHaveBeenCalled();
    expect(db.formQuestion.create).toHaveBeenCalledTimes(3);
  });

  it("shares concurrent work within a process and checks again after completion", async () => {
    const db = database(1);
    const { ensureDefaultRegistrationCatalog } = await import("@/lib/registration-catalog-bootstrap");
    const client = db as unknown as PrismaClient;
    await Promise.all([ensureDefaultRegistrationCatalog(client), ensureDefaultRegistrationCatalog(client)]);
    expect(db.course.count).toHaveBeenCalledTimes(1);
    await ensureDefaultRegistrationCatalog(client);
    expect(db.course.count).toHaveBeenCalledTimes(2);
  });

  it("propagates count failures and permits retry", async () => {
    const db = database(1);
    db.course.count.mockRejectedValueOnce(new Error("Synthetic unavailable database"));
    await expect(run(db)).rejects.toThrow("Synthetic unavailable database");
    await expect(run(db)).resolves.toBeUndefined();
  });

  it("propagates course writes failing after prerequisite rows were created", async () => {
    const db = database();
    db.course.upsert.mockRejectedValueOnce(new Error("Synthetic course failure"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(run(db)).rejects.toThrow("Synthetic course failure");
      expect(db.courseCategory.upsert).toHaveBeenCalled();
    } finally { log.mockRestore(); }
  });

  it("tolerates question failures after creating courses (existing partial-success behaviour)", async () => {
    const db = database();
    db.verificationQuestion.create.mockRejectedValueOnce(new Error("Synthetic question failure"));
    db.formQuestion.create.mockRejectedValueOnce(new Error("Synthetic form failure"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(run(db)).resolves.toBeUndefined();
      expect(db.course.upsert).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledTimes(2);
    } finally { log.mockRestore(); }
  });
});

import { Socket } from "node:net";
import { vi } from "vitest";

// A regression must fail before it can open a database or external connection.
vi.spyOn(Socket.prototype, "connect").mockImplementation(() => {
  throw new Error("Network connections are forbidden in unit tests");
});
vi.stubGlobal("fetch", vi.fn(() => {
  throw new Error("HTTP requests are forbidden in unit tests");
}));
vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      throw new Error("Use an in-memory Prisma double in unit tests");
    }
  },
}));

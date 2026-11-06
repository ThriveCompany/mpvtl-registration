import { Socket } from "node:net";
import { expect, it } from "vitest";

it("blocks database sockets and HTTP even if accidentally used by a test", () => {
  expect(() => new Socket().connect(5432, "127.0.0.1")).toThrow("Network connections are forbidden");
  expect(() => fetch("https://example.invalid")).toThrow("HTTP requests are forbidden");
});

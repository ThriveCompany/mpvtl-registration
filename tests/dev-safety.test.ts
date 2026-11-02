import { describe, expect, it } from "vitest";
import { assertSyntheticDatabase, developmentEnvironment, syntheticDatabaseUrl } from "../scripts/dev-safety.mjs";

describe("development isolation", () => {
  it.each([undefined, "postgresql://synthetic:synthetic@remote.example.invalid:5432/production", syntheticDatabaseUrl + "?schema=other"])("rejects an unapproved database URL", (url) => {
    expect(() => assertSyntheticDatabase(url)).toThrow("Refusing database access");
  });
  it("uses only fixed synthetic settings and removes inherited service credentials", () => {
    const env = developmentEnvironment({ PATH: "/synthetic/bin", DATABASE_URL: "synthetic-unapproved", SMTP_PASS: "synthetic-unapproved", PAYSTACK_SECRET_KEY: "synthetic-unapproved", NODE_OPTIONS: "synthetic-unapproved" });
    expect(env.DATABASE_URL).toBe(syntheticDatabaseUrl);
    expect(env.SMTP_PASS).toBe("");
    expect(env).not.toHaveProperty("PAYSTACK_SECRET_KEY");
    expect(env).not.toHaveProperty("NODE_OPTIONS");
    expect(env).toHaveProperty("PATH", "/synthetic/bin");
  });
});

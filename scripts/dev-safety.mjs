import { readdirSync } from "node:fs";

export const syntheticDatabaseUrl = "postgresql://synthetic:synthetic-local-only@127.0.0.1:55432/mpvtl_wo03_synthetic";

export function assertSyntheticDatabase(url) {
  if (url !== syntheticDatabaseUrl) {
    throw new Error("Refusing database access outside the fixed WO-03 synthetic database");
  }
}

export function assertNoDotenv(root) {
  // Next and Prisma load dotenv automatically. Refuse even ignored local files.
  if (readdirSync(root).some((name) => name === ".env" || name.startsWith(".env.") && name !== ".env.example") ||
      readdirSync(new URL("prisma/", root)).some((name) => name === ".env" || name.startsWith(".env."))) {
    throw new Error("Use a clean checkout without dotenv files for isolated development");
  }
}

export function developmentEnvironment(source) {
  // Allowlist OS/tooling requirements; never inherit application credentials.
  const allowed = new Set([
    "path", "systemroot", "windir", "comspec", "pathext", "temp", "tmp", "tmpdir",
    "home", "userprofile", "appdata", "localappdata", "programfiles", "programfiles(x86)",
    "programdata", "number_of_processors", "processor_architecture", "ci", "github_actions",
  ]);
  const env = Object.fromEntries(Object.entries(source).filter(([key]) => allowed.has(key.toLowerCase())));
  return {
    ...env,
    NODE_ENV: "development",
    NEXT_TELEMETRY_DISABLED: "1",
    DATABASE_URL: syntheticDatabaseUrl,
    JWT_SECRET: "synthetic-development-secret-do-not-deploy",
    NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3001",
    SMTP_HOST: "", SMTP_PORT: "", SMTP_USER: "", SMTP_PASS: "", SMTP_FROM: "",
    MAKE_WEBHOOK_URL: "", POWER_AUTOMATE_WEBHOOK_URL: "",
    SUPER_ADMIN_NAME: "", SUPER_ADMIN_EMAIL: "", SUPER_ADMIN_PASSWORD: "",
  };
}

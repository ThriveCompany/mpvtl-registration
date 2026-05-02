module.exports = {
  apps: [
    {
      name: "mpvtl-form",
      script: "npm",
      args: "start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
        MAKE_WEBHOOK_URL: process.env.MAKE_WEBHOOK_URL || "",
        POWER_AUTOMATE_WEBHOOK_URL: process.env.POWER_AUTOMATE_WEBHOOK_URL || "",
      },
    },
  ],
};

module.exports = {
  apps: [
    {
      name: "mpvtl-form",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0 -p 3000",
      cwd: __dirname,
      exec_mode: "fork",
      instances: 1,
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

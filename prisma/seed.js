const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const OFFICIAL_EMAIL_DOMAIN = "@moaetscandg.org.ng";

const seededUsers = [
  {
    name: "Adewunmi",
    email: "adewunmi@moaetscandg.org.ng",
    password: "MPVTL-Director-2026",
    role: "DIRECTOR",
  },
  {
    name: "John Adeleke",
    email: "johnadeleke@moaetscandg.org.ng",
    password: "MPVTL-Director-2026",
    role: "DIRECTOR",
  },
  {
    name: "Blessing Akinsola",
    email: "blessing.akinsola@moaetscandg.org.ng",
    password: "MPVTL-Admissions-2026",
    role: "ADMISSION_OFFICIAL",
  },
  {
    name: "Ntamene Jeremiah",
    email: "ntamene.jeremiah@moaetscandg.org.ng",
    password: "MPVTL-Admissions-2026",
    role: "ADMISSION_OFFICIAL",
  },
  {
    name: "Adebisi Tolu",
    email: "adebisi.tolu@moaetscandg.org.ng",
    password: "MPVTL-Admissions-2026",
    role: "ADMISSION_OFFICIAL",
  },
  {
    name: "Adewole Fedrick",
    email: "adewolefedrick@moaetscandg.org.ng",
    password: "MPVTL-Admissions-2026",
    role: "ADMISSION_OFFICIAL",
  },
  {
    name: "Olaleye Ayomide",
    email: "olaleyeayomide@moaetscandg.org.ng",
    password: "Lagos-MPVTL-2026",
    role: "CENTER_MANAGER",
    center: "Lagos",
  },
  {
    name: "Segun Adelaja",
    email: "segun.adelaja@moaetscandg.org.ng",
    password: "Ibadan-MPVTL-2026",
    role: "CENTER_MANAGER",
    center: "Ibadan",
  },
  {
    name: "Solomon Kure",
    email: "solomon.kure@moaetscandg.org.ng",
    password: "Abuja-MPVTL-2026",
    role: "CENTER_MANAGER",
    center: "Abuja",
  },
  {
    name: "Adenike",
    email: "adenike@moaetscandg.org.ng",
    password: "Beauty-MPVTL-2026",
    role: "CENTER_MANAGER",
    center: "Beauty Therapy Centre",
  },
  {
    name: "Tommy Akintan",
    email: "tommyakintan@moaetscandg.org.ng",
    password: "Atan-MPVTL-2026",
    role: "CENTER_MANAGER",
    center: "Atan",
  },
  {
    name: "Amoo",
    email: "amoo@moaetscandg.org.ng",
    password: "Sagamu-MPVTL-2026",
    role: "CENTER_MANAGER",
    center: "Sagamu",
  },
];

function requireOfficialEmail(email) {
  if (!email.endsWith(OFFICIAL_EMAIL_DOMAIN)) {
    throw new Error(`Seed email must use ${OFFICIAL_EMAIL_DOMAIN}: ${email}`);
  }
}

async function seedSuperAdmin() {
  const email = (process.env.SUPER_ADMIN_EMAIL || "jeremiah@moaetscandg.org.ng").trim().toLowerCase();
  const name = process.env.SUPER_ADMIN_NAME || "Jeremiah";
  const password = process.env.SUPER_ADMIN_PASSWORD;

  requireOfficialEmail(email);

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    await prisma.adminUser.update({
      where: { email },
      data: {
        name,
        role: "SUPER_ADMIN",
        active: true,
      },
    });
    console.log(`Super admin exists; password unchanged: ${email}`);
    return;
  }

  if (!password) {
    console.log("SUPER_ADMIN_PASSWORD not set. Skipping super admin creation.");
    return;
  }

  await prisma.adminUser.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "SUPER_ADMIN",
      active: true,
    },
  });

  console.log(`Seeded super admin: ${email}`);
}

async function seedUser(user) {
  requireOfficialEmail(user.email);
  const passwordHash = await bcrypt.hash(user.password, 12);

  await prisma.adminUser.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      passwordHash,
      role: user.role,
      center: user.role === "CENTER_MANAGER" ? user.center : null,
      active: true,
    },
    create: {
      name: user.name,
      email: user.email,
      passwordHash,
      role: user.role,
      center: user.role === "CENTER_MANAGER" ? user.center : null,
      active: true,
    },
  });

  console.log(`Seeded ${user.role}: ${user.email}`);
}

async function main() {
  await seedSuperAdmin();

  for (const user of seededUsers) {
    await seedUser(user);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

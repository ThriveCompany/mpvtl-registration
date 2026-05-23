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

const seededCategories = [
  "Culinary",
  "Beauty Therapy",
  "ICT",
  "Electrical & Solar",
  "Automobile & Mechatronics",
  "Welding & Fabrication",
  "Building & Construction",
  "Teaching & Assessment",
  "Health & Safety",
];

const seededCourses = [
  ["Cake Design, Decoration & Pastry Masterclass", "Culinary", ["Intermediate"]],
  ["Continental Culinary Arts - Nigerian & African Cuisine", "Culinary", ["Intermediate"]],
  ["Professional Food Safety Compliance & Kitchen Hygiene (C&G Certified)", "Culinary", ["Advanced"]],
  ["Hair Styling & Hair Making Technology", "Beauty Therapy", ["Basic"]],
  ["Professional Pedicure & Manicure Services", "Beauty Therapy", ["Basic"]],
  ["CCTV Camera Installation Program", "ICT", ["Intermediate"]],
  ["Computer Appreciation", "ICT", ["Basic"]],
  ["Computer Networking", "ICT", ["Intermediate"]],
  ["Cyber Security", "ICT", ["Advanced"]],
  ["ICT Hardware and Software Maintenance", "ICT", ["Intermediate"]],
  ["Foundational Data Science & Analytics", "ICT", ["Intermediate"]],
  ["Advanced Electrical Installation", "Electrical & Solar", ["Advanced"]],
  ["Beginner Electrical Installation", "Electrical & Solar", ["Basic"]],
  ["Automobile Electrical Works", "Automobile & Mechatronics", ["Intermediate"]],
  ["Mechatronics System Principles & Fault Finding (C&G Certified)", "Automobile & Mechatronics", ["Advanced"]],
  ["Solar System Installation", "Electrical & Solar", ["Intermediate"]],
  ["Manual Arc Welding Technology (SMAW)", "Welding & Fabrication", ["Intermediate"]],
  ["Welding & Metal Fabrication Technology", "Welding & Fabrication", ["Intermediate"]],
  ["AutoCAD Training", "Building & Construction", ["Intermediate"]],
  ["Plumbing & Pipe Fitting", "Building & Construction", ["Basic"]],
  ["Professional Masonry & Construction Technology", "Building & Construction", ["Intermediate"]],
  ["Teaching, Training & Assessing Learning (C&G Certified)", "Teaching & Assessment", ["Advanced"]],
  ["Trade Test Preparation", "Teaching & Assessment", ["Intermediate"]],
  ["Engineering Health and Safety (C&G Certified)", "Health & Safety", ["Advanced"]],
];

const seededQuestions = [
  ["Basic", "canReadAndWrite", "Can you read and write in English?", 1],
  ["Basic", "newToField", "Are you new to {course}?", 2],
  ["Basic", "reasonForCourse", "Why are you registering for {course}?", 3],
  ["Basic", "availableForPracticalTraining", "Are you available for practical training?", 4],
  ["Intermediate", "priorExposure", "Do you have basic knowledge or prior exposure to {course}?", 1],
  ["Intermediate", "completedBasicCourse", "Have you completed a basic course in {course} before?", 2],
  ["Intermediate", "experienceDescription", "Describe your experience with {course} briefly.", 3],
  ["Intermediate", "availableForEntryReview", "Are you available for entry review?", 4],
  ["Advanced", "priorTraining", "Do you have prior training or demonstrable experience in {course}?", 1],
  ["Advanced", "hasPreviousCertificate", "Do you have a previous certificate?", 2],
  ["Advanced", "practicalExperience", "Describe your practical experience with {course}.", 3],
  ["Advanced", "availableForAssessment", "Are you available for assessment or interview?", 4],
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
        forcePasswordChange: false,
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
      forcePasswordChange: true,
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
      forcePasswordChange: true,
    },
    create: {
      name: user.name,
      email: user.email,
      passwordHash,
      role: user.role,
      center: user.role === "CENTER_MANAGER" ? user.center : null,
      active: true,
      forcePasswordChange: true,
    },
  });

  console.log(`Seeded ${user.role}: ${user.email}`);
}

async function seedRegistrationConfiguration() {
  const categoryByName = new Map();

  for (const name of seededCategories) {
    const category = await prisma.courseCategory.upsert({
      where: { name },
      update: {},
      create: { name, active: true },
    });
    categoryByName.set(name, category);
  }

  for (const [name, categoryName, levels] of seededCourses) {
    const category = categoryByName.get(categoryName);
    if (!category) continue;

    await prisma.course.upsert({
      where: { name },
      update: {
        categoryId: category.id,
        levels,
      },
      create: {
        name,
        categoryId: category.id,
        levels,
        active: true,
      },
    });
  }

  for (const category of categoryByName.values()) {
    for (const [level, key, questionText, sortOrder] of seededQuestions) {
      const existingQuestion = await prisma.verificationQuestion.findFirst({
        where: {
          categoryId: category.id,
          level,
          key,
        },
      });

      if (existingQuestion) {
        await prisma.verificationQuestion.update({
          where: { id: existingQuestion.id },
          data: {
            questionText,
            sortOrder,
          },
        });
      } else {
        await prisma.verificationQuestion.create({
          data: {
            categoryId: category.id,
            level,
            key,
            questionText,
            sortOrder,
            active: true,
          },
        });
      }
    }
  }
}

async function main() {
  await seedSuperAdmin();

  for (const user of seededUsers) {
    await seedUser(user);
  }

  await seedRegistrationConfiguration();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'change-me';
  const passwordHash = await bcrypt.hash(password, 10);

  // Idempotent: create the admin on first run, re-hash the password on
  // later runs so a changed ADMIN_PASSWORD takes effect on deploy.
  await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });
  console.log(`Seeded admin user: ${username}`);

  // Site settings singleton — create defaults once, never overwrite admin edits.
  await prisma.siteSettings.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      phone: '01482 838080',
      email: 'info@mepmservices.co.uk',
      addressLine1: 'Unit F2 Rotterdam Park',
      addressLine2: 'Hull, HU7 0AN',
      addressLine3: 'East Riding of Yorkshire',
    },
  });
  console.log('Seeded site settings');

  // Default stats — only when none exist, so edits/deletes survive re-seeding.
  if ((await prisma.stat.count()) === 0) {
    await prisma.stat.createMany({
      data: [
        { value: 29, label: 'Years in practice', order: 0 },
        { value: 3, label: 'Engineering disciplines, one team', order: 1 },
        { value: 6, label: 'Service lines, feasibility to handover', order: 2 },
      ],
    });
    console.log('Seeded default stats');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

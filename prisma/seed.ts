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
    update: { passwordHash, role: 'administrator' },
    create: { username, passwordHash, role: 'administrator' },
  });
  console.log(`Seeded admin user: ${username} (role: administrator)`);

  // Create two additional demo users for testing roles
  const demoUsers = [
    { username: 'alice', password: 'alice123', role: 'editor' },
    { username: 'bob', password: 'bob123', role: 'viewer' },
  ];

  for (const { username: u, password: p, role: r } of demoUsers) {
    const hash = await bcrypt.hash(p, 10);
    await prisma.adminUser.upsert({
      where: { username: u },
      update: { passwordHash: hash, role: r },
      create: { username: u, passwordHash: hash, role: r },
    });
    console.log(`Seeded user: ${u} (role: ${r})`);
  }

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

  // Seed Services
  const services = [
    {
      code: 'ELE',
      title: 'Electrical Engineering',
      desc: 'Power, lighting, fire detection, security systems.',
      points: JSON.stringify(['Power distribution', 'Lighting design', 'Fire alarms']),
      statValue: '100+',
      statLabel: 'Projects',
      order: 0,
    },
    {
      code: 'MEC',
      title: 'Mechanical Engineering',
      desc: 'HVAC, heating, cooling, ventilation design.',
      points: JSON.stringify(['HVAC design', 'Heat pumps', 'Ventilation']),
      statValue: '80+',
      statLabel: 'Designs',
      order: 1,
    },
    {
      code: 'ENV',
      title: 'Environmental Consulting',
      desc: 'Energy assessment, sustainability, Part L compliance.',
      points: JSON.stringify(['Energy modeling', 'Net-zero roadmaps', 'BREEAM']),
      statValue: '50+',
      statLabel: 'Assessments',
      order: 2,
    },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { code: svc.code },
      update: svc,
      create: svc,
    });
  }
  console.log('Seeded 3 services');

  // Seed Team members
  const team = [
    {
      name: 'Sarah Chen',
      role: 'Senior MEP Engineer',
      discipline: 'MEC',
      bio: 'Lead mechanical engineer with 15 years of HVAC design experience.',
      photo: null,
      order: 0,
    },
    {
      name: 'James Patel',
      role: 'Electrical Systems Lead',
      discipline: 'ELE',
      bio: 'Expert in power distribution and lighting design for commercial projects.',
      photo: null,
      order: 1,
    },
    {
      name: 'Emma Rodriguez',
      role: 'Sustainability Consultant',
      discipline: 'ENV',
      bio: 'Specialises in net-zero strategies and Part L compliance.',
      photo: null,
      order: 2,
    },
  ];

  for (const member of team) {
    await prisma.team.create({
      data: member,
    });
  }
  console.log('Seeded 3 team members');

  // Seed Testimonials
  const testimonials = [
    {
      quote: 'The team delivered a world-class MEP design ahead of schedule and under budget.',
      author: 'Dr. Michael Foster',
      company: 'Ashworth Education Trust',
      logo: null,
      order: 0,
    },
    {
      quote: 'Their attention to detail and sustainability focus set a new standard for our portfolio.',
      author: 'Lisa Wang',
      company: 'Landmark Developments',
      logo: null,
      order: 1,
    },
  ];

  for (const testimonial of testimonials) {
    await prisma.testimonial.create({
      data: testimonial,
    });
  }
  console.log('Seeded 2 testimonials');

  // Seed Accreditations
  const accreditations = ['CIBSE', 'ISO 9001', 'Gas Safe', 'F-Gas', 'BREEAM'];

  // Clear and recreate
  await prisma.accreditation.deleteMany({});
  for (const label of accreditations) {
    await prisma.accreditation.create({
      data: { label, order: accreditations.indexOf(label) },
    });
  }
  console.log('Seeded 5 accreditations');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

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

  // Seed Services (disciplines)
  const services = [
    {
      slug: 'electrical',
      code: 'ELE',
      name: 'Electrical engineering',
      navLabel: 'Electrical',
      shortDescription:
        'Power, lighting and life-safety systems designed for performance, compliance and efficiency.',
      intro:
        'From initial load assessments through to detailed design, we engineer electrical systems that are safe, efficient and ready for how a building will actually be used.',
      keywords: JSON.stringify(['Power distribution', 'Lighting design', 'Fire detection', 'EV charging']),
      scope: JSON.stringify([
        { title: 'Power distribution', description: 'LV distribution, switchgear selection and load assessments sized for current demand with headroom for future change.' },
        { title: 'Lighting design', description: 'Interior, exterior and emergency lighting designed for visual comfort, energy efficiency and compliance.' },
        { title: 'Fire detection & alarms', description: 'Life-safety systems designed to the appropriate category and standard for the building and its occupants.' },
        { title: 'Small power & containment', description: 'Socket and data provision with containment routes coordinated against structure and other services.' },
        { title: 'Security & access control', description: 'CCTV, access control and intruder systems specified to suit the building and its operation.' },
        { title: 'EV charging & renewables', description: 'EV charging infrastructure and photovoltaic integration, designed with the supply capacity to back them.' },
      ]),
      deliverables: JSON.stringify([
        'Schematic and detailed design drawings',
        'Electrical load assessments',
        'Lighting calculations and layouts',
        'Specifications and equipment schedules',
        'BS 7671 design compliance',
      ]),
      sustainability:
        'Lighting and power design choices set a building\'s baseline energy use for decades. We design for low energy demand first, then integrate renewables and EV infrastructure where they genuinely pay back.',
      relatedSlugs: JSON.stringify(['mechanical', 'environmental']),
      statValue: '100+',
      statLabel: 'Projects',
      order: 0,
      published: true,
      icon: 'Zap',
    },
    {
      slug: 'mechanical',
      code: 'MEC',
      name: 'Mechanical engineering',
      navLabel: 'Mechanical',
      shortDescription:
        'Heating, cooling and ventilation systems sized for comfort, air quality and running cost.',
      intro:
        'We design the systems that keep buildings comfortable and healthy: heating, cooling, ventilation and water services, sized from real calculations rather than rules of thumb.',
      keywords: JSON.stringify(['HVAC design', 'Heat pumps', 'Ventilation', 'Public health']),
      scope: JSON.stringify([
        { title: 'Heating & hot water', description: 'System design from heat loss calculations up, including heat pump and low-carbon heat source selection.' },
        { title: 'Ventilation & air quality', description: 'Natural and mechanical ventilation strategies designed for air quality, comfort and energy recovery.' },
        { title: 'Cooling & air conditioning', description: 'Cooling loads assessed honestly, with passive measures considered before plant is sized.' },
        { title: 'Public health services', description: 'Hot and cold water, above-ground drainage and sanitary systems designed for safety and reliability.' },
        { title: 'BMS & controls', description: 'Controls strategies that let well-designed plant actually deliver its designed performance in use.' },
        { title: 'Plant replacement & upgrades', description: 'Like-for-like replacement or system redesign for existing buildings, surveyed and specified properly.' },
      ]),
      deliverables: JSON.stringify([
        'Heat loss and heat gain calculations',
        'Duct and pipework sizing and layouts',
        'Plant and equipment selection',
        'Specifications and schedules',
        'Building Regulations compliance design',
      ]),
      sustainability:
        'Heating and cooling dominate most buildings\' carbon footprint. We start with fabric and demand reduction, then size low-carbon plant to the real load, not the worst-case guess.',
      relatedSlugs: JSON.stringify(['electrical', 'environmental']),
      statValue: '80+',
      statLabel: 'Designs',
      order: 1,
      published: true,
      icon: 'Wind',
    },
    {
      slug: 'environmental',
      code: 'ENV',
      name: 'Environmental consulting',
      navLabel: 'Environmental',
      shortDescription:
        'Energy assessment and sustainability strategy, from concept design through to compliance.',
      intro:
        'We turn sustainability ambitions into evidenced, compliant designs: energy modelling, regulatory compliance and decarbonisation strategy grounded in how the building will perform.',
      keywords: JSON.stringify(['Energy assessments', 'Part L compliance', 'Overheating analysis', 'Net zero']),
      scope: JSON.stringify([
        { title: 'Energy assessments', description: 'SAP and SBEM calculations and EPCs for new build and existing stock, produced as design tools rather than tick-boxes.' },
        { title: 'Part L compliance', description: 'Building Regulations energy compliance addressed early, when design changes are still cheap.' },
        { title: 'Overheating analysis', description: 'TM52 and TM59 assessments to demonstrate comfort without defaulting to mechanical cooling.' },
        { title: 'BREEAM support', description: 'Credit strategy and evidence support for projects targeting BREEAM certification.' },
        { title: 'Decarbonisation strategy', description: 'Net-zero roadmaps for estates and portfolios, sequenced by cost and carbon impact.' },
        { title: 'Renewable feasibility', description: 'Honest feasibility studies for PV, heat pumps and other renewables, with payback grounded in real usage.' },
      ]),
      deliverables: JSON.stringify([
        'Energy models and compliance reports',
        'EPCs and statutory certification',
        'Overheating assessment reports',
        'Feasibility studies with costed options',
        'Decarbonisation roadmaps',
      ]),
      sustainability:
        'This discipline is sustainability as a deliverable: every output exists to lower a building\'s energy use and carbon footprint, with the evidence to prove it.',
      relatedSlugs: JSON.stringify(['electrical', 'mechanical']),
      statValue: '50+',
      statLabel: 'Assessments',
      order: 2,
      published: true,
      icon: 'Leaf',
    },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { slug: svc.slug },
      update: svc,
      create: svc,
    });
  }
  console.log('Seeded 3 services');

  // Seed Service Offerings (the "how we deliver it" cross-disciplinary lines)
  const serviceOfferings = [
    {
      slug: 'consulting',
      name: 'Consulting',
      shortDescription: 'Full mechanical, electrical, and public health design services for new builds, refurbishments, and fit-outs.',
      description: 'Full mechanical, electrical, and public health design services, including HVAC, power, lighting, fire alarms, drainage, and water services. Fully coordinated designs for new builds, refurbishments, and tenant fit-outs, delivered in compliance with current building regulations, CIBSE guidance, and industry best practices.',
      keywords: JSON.stringify(['HVAC', 'Power', 'Lighting', 'Drainage', 'Water services']),
      order: 0,
    },
    {
      slug: 'design-review',
      name: 'Design Review',
      shortDescription: 'Integration of MEP systems with architectural and structural elements to ensure clash-free, buildable solutions.',
      description: 'Integration of MEP systems with architectural and structural elements to ensure clash-free, buildable solutions. Support with BIM Level 2+ coordination using industry-standard tools. Review of third-party designs for compliance, completeness, and accuracy.',
      keywords: JSON.stringify(['BIM coordination', 'Design audit', 'Compliance review', 'Clash detection']),
      order: 1,
    },
    {
      slug: 'decarbonisation',
      name: 'Decarbonisation',
      shortDescription: 'Strategic planning and design for low-carbon technologies including heat pumps, PV, battery storage, and heat networks.',
      description: 'Strategic planning and design for low-carbon technologies including heat pumps, PV, battery storage, and heat networks. Feasibility studies and phased transition plans for retrofitting existing assets. Support with government funding applications and carbon reporting.',
      keywords: JSON.stringify(['Heat pumps', 'PV', 'Battery storage', 'Heat networks', 'Net zero']),
      order: 2,
    },
    {
      slug: 'value-engineering',
      name: 'Value Engineering',
      shortDescription: 'Detailed review of MEP systems to identify cost-saving opportunities without compromising performance or compliance.',
      description: 'Detailed review of MEP systems to identify cost-saving opportunities without compromising performance or compliance. Long-term OPEX and CAPEX optimisation through efficient, future-proof designs. Rationalisation of plant and distribution to reduce installation and maintenance costs.',
      keywords: JSON.stringify(['Cost optimisation', 'OPEX reduction', 'CAPEX reduction', 'Efficiency']),
      order: 3,
    },
    {
      slug: 'project-support',
      name: 'Project Support',
      shortDescription: 'End-to-end technical support from tender stage through design, procurement, construction, commissioning, and handover.',
      description: 'End-to-end technical support from tender stage through design, procurement, construction, commissioning, and handover. Acting as a trusted partner to both contractors and developers, we ensure technical clarity and compliance at every phase. Responsive support for resolving on-site installation or design conflicts.',
      keywords: JSON.stringify(['Tender support', 'Procurement', 'Site support', 'Commissioning', 'Handover']),
      order: 4,
    },
    {
      slug: 'commissioning',
      name: 'Commissioning Management',
      shortDescription: 'Independent commissioning planning and witnessing services to ensure all systems operate as per design intent.',
      description: 'Independent commissioning planning and witnessing services. Management of commissioning schedules, witnessing documentation, and O&M manual review. Ensuring all systems are fully tested, balanced, and operating as per design intent before handover.',
      keywords: JSON.stringify(['Commissioning', 'System testing', 'Balancing', 'O&M manuals']),
      order: 5,
    },
  ];

  for (const offering of serviceOfferings) {
    await prisma.serviceOffering.upsert({
      where: { slug: offering.slug },
      update: offering,
      create: offering,
    });
  }
  console.log('Seeded 6 service offerings');

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
    await prisma.team.upsert({
      where: { name: member.name },
      update: member,
      create: member,
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
    await prisma.testimonial.upsert({
      where: { author: testimonial.author },
      update: testimonial,
      create: testimonial,
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

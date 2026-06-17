// Service content: three discipline-specific pages, plus info on six cross-disciplinary service offerings

export interface ServiceOffering {
  name: string;
  shortDescription: string;
  description: string;
  keywords: string[];
}

export interface Service {
  slug: string;
  name: string;
  navLabel: string;
  code: string;
  shortDescription: string;
  keywords: string[];
  intro: string;
  scope: { title: string; description: string }[];
  deliverables: string[];
  sustainability: string;
  relatedSlugs: string[];
}

export const serviceOfferings: Record<string, ServiceOffering> = {
  consulting: {
    name: 'Consulting',
    shortDescription:
      'Full mechanical, electrical, and public health design services for new builds, refurbishments, and fit-outs.',
    description:
      'Full mechanical, electrical, and public health design services, including HVAC, power, lighting, fire alarms, drainage, and water services. Fully coordinated designs for new builds, refurbishments, and tenant fit-outs, delivered in compliance with current building regulations, CIBSE guidance, and industry best practices.',
    keywords: ['HVAC', 'Power', 'Lighting', 'Drainage', 'Water services'],
  },
  'design-review': {
    name: 'Design Review',
    shortDescription:
      'Integration of MEP systems with architectural and structural elements to ensure clash-free, buildable solutions.',
    description:
      'Integration of MEP systems with architectural and structural elements to ensure clash-free, buildable solutions. Support with BIM Level 2+ coordination using industry-standard tools. Review of third-party designs for compliance, completeness, and accuracy.',
    keywords: ['BIM coordination', 'Design audit', 'Compliance review', 'Clash detection'],
  },
  decarbonisation: {
    name: 'Decarbonisation',
    shortDescription:
      'Strategic planning and design for low-carbon technologies including heat pumps, PV, battery storage, and heat networks.',
    description:
      'Strategic planning and design for low-carbon technologies including heat pumps, PV, battery storage, and heat networks. Feasibility studies and phased transition plans for retrofitting existing assets. Support with government funding applications and carbon reporting.',
    keywords: ['Heat pumps', 'PV', 'Battery storage', 'Heat networks', 'Net zero'],
  },
  'value-engineering': {
    name: 'Value Engineering',
    shortDescription:
      'Detailed review of MEP systems to identify cost-saving opportunities without compromising performance or compliance.',
    description:
      'Detailed review of MEP systems to identify cost-saving opportunities without compromising performance or compliance. Long-term OPEX and CAPEX optimisation through efficient, future-proof designs. Rationalisation of plant and distribution to reduce installation and maintenance costs.',
    keywords: ['Cost optimisation', 'OPEX reduction', 'CAPEX reduction', 'Efficiency'],
  },
  'project-support': {
    name: 'Project Support',
    shortDescription:
      'End-to-end technical support from tender stage through design, procurement, construction, commissioning, and handover.',
    description:
      'End-to-end technical support from tender stage through design, procurement, construction, commissioning, and handover. Acting as a trusted partner to both contractors and developers, we ensure technical clarity and compliance at every phase. Responsive support for resolving on-site installation or design conflicts.',
    keywords: ['Tender support', 'Procurement', 'Site support', 'Commissioning', 'Handover'],
  },
  'commissioning': {
    name: 'Commissioning Management',
    shortDescription:
      'Independent commissioning planning and witnessing services to ensure all systems operate as per design intent.',
    description:
      'Independent commissioning planning and witnessing services. Management of commissioning schedules, witnessing documentation, and O&M manual review. Ensuring all systems are fully tested, balanced, and operating as per design intent before handover.',
    keywords: ['Commissioning', 'System testing', 'Balancing', 'O&M manuals'],
  },
};

export const services: Service[] = [
  {
    slug: 'electrical',
    name: 'Electrical engineering',
    navLabel: 'Electrical',
    code: 'ELE',
    shortDescription:
      'Power, lighting and life-safety systems designed for performance, compliance and efficiency.',
    keywords: ['Power distribution', 'Lighting design', 'Fire detection', 'EV charging'],
    intro:
      'From initial load assessments through to detailed design, we engineer electrical systems that are safe, efficient and ready for how a building will actually be used.',
    scope: [
      {
        title: 'Power distribution',
        description:
          'LV distribution, switchgear selection and load assessments sized for current demand with headroom for future change.',
      },
      {
        title: 'Lighting design',
        description:
          'Interior, exterior and emergency lighting designed for visual comfort, energy efficiency and compliance.',
      },
      {
        title: 'Fire detection & alarms',
        description:
          'Life-safety systems designed to the appropriate category and standard for the building and its occupants.',
      },
      {
        title: 'Small power & containment',
        description:
          'Socket and data provision with containment routes coordinated against structure and other services.',
      },
      {
        title: 'Security & access control',
        description:
          'CCTV, access control and intruder systems specified to suit the building and its operation.',
      },
      {
        title: 'EV charging & renewables',
        description:
          'EV charging infrastructure and photovoltaic integration, designed with the supply capacity to back them.',
      },
    ],
    deliverables: [
      'Schematic and detailed design drawings',
      'Electrical load assessments',
      'Lighting calculations and layouts',
      'Specifications and equipment schedules',
      'BS 7671 design compliance',
    ],
    sustainability:
      'Lighting and power design choices set a building\'s baseline energy use for decades. We design for low energy demand first, then integrate renewables and EV infrastructure where they genuinely pay back.',
    relatedSlugs: ['mechanical', 'environmental'],
  },
  {
    slug: 'mechanical',
    name: 'Mechanical engineering',
    navLabel: 'Mechanical',
    code: 'MEC',
    shortDescription:
      'Heating, cooling and ventilation systems sized for comfort, air quality and running cost.',
    keywords: ['HVAC design', 'Heat pumps', 'Ventilation', 'Public health'],
    intro:
      'We design the systems that keep buildings comfortable and healthy: heating, cooling, ventilation and water services, sized from real calculations rather than rules of thumb.',
    scope: [
      {
        title: 'Heating & hot water',
        description:
          'System design from heat loss calculations up, including heat pump and low-carbon heat source selection.',
      },
      {
        title: 'Ventilation & air quality',
        description:
          'Natural and mechanical ventilation strategies designed for air quality, comfort and energy recovery.',
      },
      {
        title: 'Cooling & air conditioning',
        description:
          'Cooling loads assessed honestly, with passive measures considered before plant is sized.',
      },
      {
        title: 'Public health services',
        description:
          'Hot and cold water, above-ground drainage and sanitary systems designed for safety and reliability.',
      },
      {
        title: 'BMS & controls',
        description:
          'Controls strategies that let well-designed plant actually deliver its designed performance in use.',
      },
      {
        title: 'Plant replacement & upgrades',
        description:
          'Like-for-like replacement or system redesign for existing buildings, surveyed and specified properly.',
      },
    ],
    deliverables: [
      'Heat loss and heat gain calculations',
      'Duct and pipework sizing and layouts',
      'Plant and equipment selection',
      'Specifications and schedules',
      'Building Regulations compliance design',
    ],
    sustainability:
      'Heating and cooling dominate most buildings\' carbon footprint. We start with fabric and demand reduction, then size low-carbon plant to the real load, not the worst-case guess.',
    relatedSlugs: ['electrical', 'environmental'],
  },
  {
    slug: 'environmental',
    name: 'Environmental consulting',
    navLabel: 'Environmental',
    code: 'ENV',
    shortDescription:
      'Energy assessment and sustainability strategy, from concept design through to compliance.',
    keywords: ['Energy assessments', 'Part L compliance', 'Overheating analysis', 'Net zero'],
    intro:
      'We turn sustainability ambitions into evidenced, compliant designs: energy modelling, regulatory compliance and decarbonisation strategy grounded in how the building will perform.',
    scope: [
      {
        title: 'Energy assessments',
        description:
          'SAP and SBEM calculations and EPCs for new build and existing stock, produced as design tools rather than tick-boxes.',
      },
      {
        title: 'Part L compliance',
        description:
          'Building Regulations energy compliance addressed early, when design changes are still cheap.',
      },
      {
        title: 'Overheating analysis',
        description:
          'TM52 and TM59 assessments to demonstrate comfort without defaulting to mechanical cooling.',
      },
      {
        title: 'BREEAM support',
        description:
          'Credit strategy and evidence support for projects targeting BREEAM certification.',
      },
      {
        title: 'Decarbonisation strategy',
        description:
          'Net-zero roadmaps for estates and portfolios, sequenced by cost and carbon impact.',
      },
      {
        title: 'Renewable feasibility',
        description:
          'Honest feasibility studies for PV, heat pumps and other renewables, with payback grounded in real usage.',
      },
    ],
    deliverables: [
      'Energy models and compliance reports',
      'EPCs and statutory certification',
      'Overheating assessment reports',
      'Feasibility studies with costed options',
      'Decarbonisation roadmaps',
    ],
    sustainability:
      'This discipline is sustainability as a deliverable: every output exists to lower a building\'s energy use and carbon footprint, with the evidence to prove it.',
    relatedSlugs: ['electrical', 'mechanical'],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

// ============================================================================
// Services CRUD API Validation & Helpers
// ============================================================================

// Service codes for DB validation
export const SERVICE_CODES = ['ELE', 'MEC', 'ENV'] as const;
export type ServiceCode = (typeof SERVICE_CODES)[number];

export const SERVICE_CODE_LABELS: Record<ServiceCode, string> = {
  ELE: 'Electrical',
  MEC: 'Mechanical',
  ENV: 'Environmental',
};

/**
 * Check if a string is a valid service code.
 */
export function isValidServiceCode(value: string): value is ServiceCode {
  return (SERVICE_CODES as readonly string[]).includes(value.toUpperCase());
}

/**
 * Parse JSON-stringified points array from DB string.
 * Returns empty array if invalid/empty string.
 */
export function parsePoints(pointsJson: string): string[] {
  if (!pointsJson || typeof pointsJson !== 'string') return [];
  try {
    const parsed = JSON.parse(pointsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Stringify points array for storage in DB.
 * Input can be array or already-stringified JSON.
 */
export function stringifyPoints(points: string[] | string): string {
  if (typeof points === 'string') return points;
  if (!Array.isArray(points)) return JSON.stringify([]);
  return JSON.stringify(points);
}

/**
 * Validate a service object for CRUD operations. Returns error string or null.
 */
export function validateService(data: Record<string, unknown>): string | null {
  const code = String(data.code || '').toUpperCase();
  if (!code || !isValidServiceCode(code)) {
    return `Code must be one of: ${SERVICE_CODES.join(', ')}`;
  }

  const title = String(data.title || '').trim();
  if (!title) return 'Title is required';

  const desc = String(data.desc || '').trim();
  if (!desc) return 'Description is required';

  return null;
}

export interface ServiceDTO {
  id: string;
  code: string;
  title: string;
  desc: string;
  points: string[]; // Parsed from DB
  statValue: string;
  statLabel: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

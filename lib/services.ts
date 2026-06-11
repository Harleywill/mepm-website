// Service content drafted from standard UK building-services scope.
// NEEDS CLIENT SIGN-OFF before launch — the live site's services page was
// unavailable, so scope lists and copy are our drafts, not their words.

export interface Service {
  slug: string;
  name: string;
  navLabel: string;
  shortDescription: string;
  keywords: string[];
  intro: string;
  scope: { title: string; description: string }[];
  deliverables: string[];
  sustainability: string;
  relatedSlugs: string[];
}

export const services: Service[] = [
  {
    slug: 'electrical',
    name: 'Electrical engineering',
    navLabel: 'Electrical',
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

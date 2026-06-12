// Service content from MEPM's live offering
// These are six cross-disciplinary service lines, each touching mechanical, electrical, and public health engineering

export interface Service {
  slug: string;
  name: string;
  navLabel: string;
  /** Drawing-register discipline code (ELE/MEC/ENV map to hero objects; CON/DES/DEC/VAL/PRJ/COM for services) */
  code: string;
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
    slug: 'consulting',
    name: 'Consulting',
    navLabel: 'Consulting',
    code: 'CON',
    shortDescription:
      'Full mechanical, electrical, and public health design services for new builds, refurbishments, and fit-outs.',
    keywords: ['HVAC', 'Power', 'Lighting', 'Drainage', 'Water services'],
    intro:
      'Full mechanical, electrical, and public health design services, including HVAC, power, lighting, fire alarms, drainage, and water services. Fully coordinated designs for new builds, refurbishments, and tenant fit-outs, delivered in compliance with current building regulations, CIBSE guidance, and industry best practices.',
    scope: [
      {
        title: 'Mechanical design',
        description:
          'HVAC, heating, cooling, ventilation and water services, sized from real calculations rather than rules of thumb.',
      },
      {
        title: 'Electrical design',
        description:
          'Power distribution, lighting, fire alarms, and life-safety systems designed for performance and compliance.',
      },
      {
        title: 'Public health engineering',
        description:
          'Drainage and water services designed for safety, reliability, and regulatory compliance.',
      },
      {
        title: 'New builds',
        description:
          'From initial load assessments through detailed design, fully coordinated MEP systems.',
      },
      {
        title: 'Refurbishments',
        description:
          'System redesign and upgrades for existing buildings, surveyed and specified properly.',
      },
      {
        title: 'Tenant fit-outs',
        description:
          'Rapid, buildable MEP solutions for commercial and retail spaces, coordinated against existing infrastructure.',
      },
    ],
    deliverables: [
      'Schematic and detailed design drawings',
      'Coordinated MEP layouts',
      'Load assessments and calculations',
      'Specifications and equipment schedules',
      'Building Regulations compliance design',
    ],
    sustainability:
      'Every consulting project integrates sustainable design from the outset: low-carbon heating, efficient lighting, demand-controlled ventilation, and renewable integration where justified.',
    relatedSlugs: ['design-review', 'project-support'],
  },
  {
    slug: 'design-review',
    name: 'Design Review',
    navLabel: 'Design Review',
    code: 'DES',
    shortDescription:
      'Integration of MEP systems with architectural and structural elements to ensure clash-free, buildable solutions.',
    keywords: ['BIM coordination', 'Design audit', 'Compliance review', 'Clash detection'],
    intro:
      'Integration of MEP systems with architectural and structural elements to ensure clash-free, buildable solutions. Support with BIM Level 2+ coordination using industry-standard tools. Review of third-party designs for compliance, completeness, and accuracy.',
    scope: [
      {
        title: 'BIM coordination',
        description:
          'Support with BIM Level 2+ coordination using industry-standard tools (e.g., Revit, Navisworks).',
      },
      {
        title: 'Third-party design review',
        description:
          'Review of third-party designs for compliance, completeness, and accuracy.',
      },
      {
        title: 'Early-stage reviews',
        description:
          'Identify potential compliance gaps, performance risks, or coordination issues before they become expensive.',
      },
      {
        title: 'Technical audits',
        description:
          'Peer reviews and design risk assessments to protect your programme and commercial outcomes.',
      },
      {
        title: 'Clash resolution',
        description:
          'Identification and resolution of conflicts between MEP systems and architectural/structural elements.',
      },
      {
        title: 'Design risk mitigation',
        description:
          'Proactive identification of buildability issues, compliance gaps, and performance risks.',
      },
    ],
    deliverables: [
      'Coordination drawings and reports',
      'Clash detection and resolution plans',
      'Compliance audit reports',
      'Risk assessment documentation',
      'Design review and recommendations',
    ],
    sustainability:
      'Design review catches inefficient layouts, oversized plant, and poor coordination early, preventing costly redesigns and enabling genuinely sustainable solutions.',
    relatedSlugs: ['consulting', 'project-support'],
  },
  {
    slug: 'decarbonisation',
    name: 'Decarbonisation',
    navLabel: 'Decarbonisation',
    code: 'DEC',
    shortDescription:
      'Strategic planning and design for low-carbon technologies including heat pumps, PV, battery storage, and heat networks.',
    keywords: ['Heat pumps', 'PV', 'Battery storage', 'Heat networks', 'Net zero'],
    intro:
      'Strategic planning and design for low-carbon technologies including heat pumps, PV, battery storage, and heat networks. Feasibility studies and phased transition plans for retrofitting existing assets. Support with government funding applications and carbon reporting.',
    scope: [
      {
        title: 'Low-carbon technology strategy',
        description:
          'Strategic planning and design for heat pumps, PV, battery storage, and heat networks.',
      },
      {
        title: 'Feasibility studies',
        description:
          'Honest feasibility assessments for low-carbon technologies with payback grounded in real usage.',
      },
      {
        title: 'Retrofit planning',
        description:
          'Phased transition plans for retrofitting existing assets, sequenced by cost and carbon impact.',
      },
      {
        title: 'Net-zero roadmaps',
        description:
          'Long-term decarbonisation pathways for estates and portfolios with costed options.',
      },
      {
        title: 'Funding support',
        description:
          'Support with government funding applications for low-carbon technology installations.',
      },
      {
        title: 'Carbon reporting',
        description:
          'Evidence and documentation for carbon accounting, regulatory reporting, and sustainability claims.',
      },
    ],
    deliverables: [
      'Decarbonisation strategy reports',
      'Technology feasibility studies',
      'Phased retrofit plans',
      'Net-zero roadmaps',
      'Carbon reporting and evidence documentation',
    ],
    sustainability:
      'This service is sustainability as strategy: every output is designed to measurably lower a building\'s carbon footprint, with the evidence to prove it.',
    relatedSlugs: ['value-engineering', 'consulting'],
  },
  {
    slug: 'value-engineering',
    name: 'Value Engineering',
    navLabel: 'Value Engineering',
    code: 'VAL',
    shortDescription:
      'Detailed review of MEP systems to identify cost-saving opportunities without compromising performance or compliance.',
    keywords: ['Cost optimisation', 'OPEX reduction', 'CAPEX reduction', 'Efficiency'],
    intro:
      'Detailed review of MEP systems to identify cost-saving opportunities without compromising performance or compliance. Long-term OPEX and CAPEX optimisation through efficient, future-proof designs. Rationalisation of plant and distribution to reduce installation and maintenance costs.',
    scope: [
      {
        title: 'Cost-saving identification',
        description:
          'Detailed review of MEP systems to identify cost-saving opportunities without compromising performance.',
      },
      {
        title: 'OPEX optimisation',
        description:
          'Long-term operating expense reduction through efficient, future-proof designs.',
      },
      {
        title: 'CAPEX reduction',
        description:
          'Capital cost reduction through rationalisation of plant and distribution.',
      },
      {
        title: 'Installation simplification',
        description:
          'Design refinement to reduce installation complexity, labour, and site coordination effort.',
      },
      {
        title: 'Maintenance cost reduction',
        description:
          'System design and selection to minimise long-term maintenance and replacement costs.',
      },
      {
        title: 'Performance-neutral savings',
        description:
          'Guaranteed savings achieved without compromising comfort, air quality, safety or compliance.',
      },
    ],
    deliverables: [
      'Value engineering reports with costed options',
      'Cost-benefit analysis',
      'Revised designs with savings quantified',
      'Maintenance cost analysis',
      'Payback calculations',
    ],
    sustainability:
      'Value engineering often uncovers oversized or redundant plant that wastes both money and energy; right-sizing is both cheaper and lower-carbon.',
    relatedSlugs: ['consulting', 'decarbonisation'],
  },
  {
    slug: 'project-support',
    name: 'Project Support',
    navLabel: 'Project Support',
    code: 'PRJ',
    shortDescription:
      'End-to-end technical support from tender stage through design, procurement, construction, commissioning, and handover.',
    keywords: ['Tender support', 'Procurement', 'Site support', 'Commissioning', 'Handover'],
    intro:
      'End-to-end technical support from tender stage through design, procurement, construction, commissioning, and handover. Acting as a trusted partner to both contractors and developers, we ensure technical clarity and compliance at every phase. Responsive support for resolving on-site installation or design conflicts.',
    scope: [
      {
        title: 'Tender stage support',
        description:
          'Technical specifications and pricing guidance for MEP procurement.',
      },
      {
        title: 'Design clarification',
        description:
          'Rapid clarification of design intent and technical requirements during procurement and construction.',
      },
      {
        title: 'Procurement support',
        description:
          'Equipment selection and supplier liaison to ensure specification compliance.',
      },
      {
        title: 'On-site technical support',
        description:
          'Hands-on collaboration with site teams to resolve installation conflicts and provide buildable solutions under tight deadlines.',
      },
      {
        title: 'Construction issue resolution',
        description:
          'Responsive support for resolving on-site design or installation conflicts.',
      },
      {
        title: 'Handover coordination',
        description:
          'Technical clarity and compliance support through commissioning and handover.',
      },
    ],
    deliverables: [
      'Technical specifications and bid documents',
      'Site visit reports and issue resolutions',
      'Technical clarifications and RFI responses',
      'As-built coordination',
      'Handover documentation',
    ],
    sustainability:
      'Early technical engagement prevents costly redesigns and ensures low-carbon design intent is preserved through construction and commissioning.',
    relatedSlugs: ['consulting', 'commissioning'],
  },
  {
    slug: 'commissioning',
    name: 'Commissioning Management',
    navLabel: 'Commissioning',
    code: 'COM',
    shortDescription:
      'Independent commissioning planning and witnessing services to ensure all systems operate as per design intent.',
    keywords: ['Commissioning', 'System testing', 'Balancing', 'O&M manuals'],
    intro:
      'Independent commissioning planning and witnessing services. Management of commissioning schedules, witnessing documentation, and O&M manual review. Ensuring all systems are fully tested, balanced, and operating as per design intent before handover.',
    scope: [
      {
        title: 'Commissioning planning',
        description:
          'Independent planning of commissioning scope, schedules, and testing protocols.',
      },
      {
        title: 'System witnessing',
        description:
          'Witnessing and documentation of all mechanical and electrical system testing.',
      },
      {
        title: 'Performance balancing',
        description:
          'Balancing of HVAC systems and verification that they deliver design performance.',
      },
      {
        title: 'Testing documentation',
        description:
          'Management of commissioning schedules, witnessing documentation, and test protocols.',
      },
      {
        title: 'O&M manual review',
        description:
          'Review and verification of operations and maintenance manuals for completeness and accuracy.',
      },
      {
        title: 'Handover sign-off',
        description:
          'Independent sign-off that all systems are fully tested, balanced, and operating as per design intent.',
      },
    ],
    deliverables: [
      'Commissioning plans and schedules',
      'Witnessing reports and test documentation',
      'Balancing certificates',
      'O&M manual review and sign-off',
      'Final commissioning sign-off report',
    ],
    sustainability:
      'Proper commissioning ensures low-carbon plant actually delivers its designed performance in use, maximising the carbon benefits of design investments.',
    relatedSlugs: ['project-support', 'consulting'],
  },
  // Discipline-specific service pages (with 3D hero objects)
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

import { Icon, Reveal } from '../ui';

const STAGES = [
  {
    n: '01',
    icon: 'Search' as const,
    title: 'Brief & feasibility',
    description:
      'We listen, survey constraints and frame the engineering challenge.',
  },
  {
    n: '02',
    icon: 'PenTool' as const,
    title: 'Concept design',
    description:
      'Integrated M&E strategies modelled for performance and carbon.',
  },
  {
    n: '03',
    icon: 'Layers' as const,
    title: 'Coordinated detailing',
    description:
      'BIM-coordinated technical design, clash-free and tender-ready.',
  },
  {
    n: '04',
    icon: 'CircleCheck' as const,
    title: 'Delivery & handover',
    description:
      'On-site support, commissioning and as-built documentation.',
  },
];

export default function ProcessTimeline() {
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <Reveal>
          <h2 className="mepm-h2 text-navy-700 mb-4">How we work</h2>
          <p className="mepm-lead max-w-xl mb-16">
            A precise, four-stage process, from the first conversation to the
            as-built drawings.
          </p>
        </Reveal>

        <div className="relative grid gap-12 sm:gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connector — dashed setting-out line behind the nodes */}
          <div
            className="hidden lg:block absolute top-7 left-[12%] right-[12%] border-t-2 border-dashed border-navy-200"
            aria-hidden
          />
          {STAGES.map((stage, i) => (
            <Reveal key={stage.n} delay={i * 0.08}>
              <div className="relative">
                <div className="w-14 h-14 bg-white border-2 border-navy-700 text-navy-700 flex items-center justify-center mb-5">
                  <Icon name={stage.icon} size={24} />
                </div>
                <span className="font-mono text-sm font-medium text-green-700">
                  {stage.n}
                </span>
                <h3 className="font-body font-semibold text-lg text-navy-700 mt-2 mb-2">
                  {stage.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-[28ch]">
                  {stage.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

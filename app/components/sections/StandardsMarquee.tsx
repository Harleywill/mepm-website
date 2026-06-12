// Standards and frameworks the practice designs to, as a slim ticker
// band. Every item here is backed by content elsewhere on the site
// (services scope and deliverables) — not claimed accreditations.
const STANDARDS = [
  'CIBSE guidance',
  'Part L compliance',
  'SAP / SBEM',
  'BREEAM',
  'BIM Level 2+',
  'BS 7671',
  'TM52 / TM59',
  'Net zero carbon',
  'Building Regulations',
];

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0" aria-hidden={hidden}>
      {STANDARDS.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-3.5 px-8 font-mono text-[13px] uppercase tracking-[0.08em] text-slate-500 whitespace-nowrap"
        >
          <span className="w-[5px] h-[5px] rounded-full bg-mepm-green" aria-hidden />
          {item}
        </span>
      ))}
    </div>
  );
}

export default function StandardsMarquee() {
  return (
    <div className="bg-slate-50 border-y border-slate-200 overflow-hidden py-4">
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        <Row />
        <Row hidden />
      </div>
    </div>
  );
}

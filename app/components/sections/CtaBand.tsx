import Link from 'next/link';

export default function CtaBand() {
  return (
    <section className="bg-navy-900 bp-grid">
      <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row md:items-center md:justify-between gap-10">
        <div className="max-w-xl">
          <h2 className="mepm-h2 text-white mb-4">
            Let&apos;s talk about your project.
          </h2>
          <p className="text-white/72 leading-relaxed">
            Send an enquiry or call us. We will come back with how we can help,
            and what it would take.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-md font-semibold text-base bg-mepm-green text-white hover:bg-green-600 transition-colors duration-200"
          >
            Get a quote
          </Link>
          <a
            href="tel:+441482838080"
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-md font-medium text-base border border-white/30 text-white hover:bg-white/10 transition-colors duration-200"
          >
            01482 838080
          </a>
        </div>
      </div>
    </section>
  );
}

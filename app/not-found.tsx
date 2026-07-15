import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="bp-grid-light flex min-h-[70vh] items-center border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <span className="mepm-eyebrow">MEPM · 404</span>
        <h1 className="mepm-display mt-4 text-navy-700">
          Page not <span className="text-slate-500">found</span>.
        </h1>
        <p className="mepm-lead mx-auto mt-5 max-w-xl">
          The page you are looking for does not exist, or the URL may have
          changed. Try one of the links below, or head back to the homepage.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md font-semibold text-base bg-mepm-green text-white shadow-sm hover:bg-mepm-green/90 transition-colors duration-200"
          >
            Back to home
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md font-medium text-base border border-navy-700/25 text-navy-700 hover:border-navy-700 hover:bg-navy-700 hover:text-white transition-colors duration-200"
          >
            View our projects
          </Link>
        </div>
      </div>
    </section>
  );
}

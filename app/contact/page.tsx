import type { Metadata } from 'next';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact — MEPM Building Services Consultants',
  description:
    'Get in touch with MEPM Building Services Consultants. Call 01482 838080, email info@mepmservices.co.uk, or send an enquiry online.',
};

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="max-w-2xl mb-16">
        <h1 className="mepm-h1 text-navy-700 mb-6">Contact</h1>
        <p className="mepm-lead text-slate-600">
          Tell us about your project and we will come back with how we can
          help. No obligation, no hard sell.
        </p>
      </div>

      <div className="grid gap-16 lg:grid-cols-2 max-w-5xl">
        {/* Form */}
        <ContactForm />

        {/* Direct details */}
        <div className="space-y-8">
          <div>
            <h2 className="font-mono text-xs uppercase tracking-caps text-green-700 mb-3">
              PHONE
            </h2>
            <a
              href="tel:+441482838080"
              className="text-lg font-medium text-navy-700 hover:text-green-600 transition-colors"
            >
              01482 838080
            </a>
          </div>

          <div>
            <h2 className="font-mono text-xs uppercase tracking-caps text-green-700 mb-3">
              EMAIL
            </h2>
            <a
              href="mailto:info@mepmservices.co.uk"
              className="text-lg font-medium text-navy-700 hover:text-green-600 transition-colors"
            >
              info@mepmservices.co.uk
            </a>
          </div>

          <div>
            <h2 className="font-mono text-xs uppercase tracking-caps text-green-700 mb-3">
              OFFICE
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Unit F2 Rotterdam Park
              <br />
              Hull, HU7 0AN
              <br />
              East Riding of Yorkshire
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Reveal } from '../components/ui';
import { getSettings } from '@/lib/settings';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact — MEPM Building Services Consultants',
  description:
    'Tell us about your project. Call us, email us, or send an enquiry online with drawings or photos attached.',
};

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, '')}`;

const NEXT_STEPS = [
  'We read your enquiry and reply within one working day.',
  'A short call to understand the building, scope and timescales.',
  'A tailored engineering approach and fee proposal.',
];

export default async function ContactPage() {
  const { settings } = await getSettings();
  const addressLines = [
    settings.addressLine1,
    settings.addressLine2,
    settings.addressLine3,
  ].filter(Boolean);

  const DETAILS = [
    settings.phone && {
      icon: Phone,
      label: 'Phone',
      value: settings.phone,
      href: telHref(settings.phone),
    },
    settings.email && {
      icon: Mail,
      label: 'Email',
      value: settings.email,
      href: `mailto:${settings.email}`,
    },
    addressLines.length > 0 && {
      icon: MapPin,
      label: 'Office',
      lines: addressLines,
    },
    {
      icon: Clock,
      label: 'Hours',
      lines: ['Mon–Fri · 08:30–17:00', 'Replies within one working day'],
    },
  ].filter(Boolean) as {
    icon: typeof Phone;
    label: string;
    value?: string;
    href?: string;
    lines?: string[];
  }[];

  return (
    <>
      {/* Header — drawing-sheet band */}
      <section className="bp-grid-light border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-14">
          <span className="mepm-spec text-green-700">MEPM · Enquiry</span>
          <h1 className="mepm-display mt-4 text-navy-700">
            Start your{' '}
            <span className="text-slate-400">project</span>
          </h1>
          <p className="mepm-lead mt-5 max-w-xl">
            Tell us about the building and what you need. We will come back with
            how we can help and what it would take. No obligation, no hard sell.
          </p>
          <span className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Typically replies within one working day
          </span>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-16">
          {/* Contact info */}
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                  <span className="mepm-spec">MEPM · Direct lines</span>
                  <span className="font-mono text-xs font-semibold text-green-700">
                    HU7
                  </span>
                </div>
                <dl className="divide-y divide-slate-100">
                  {DETAILS.map((d) => {
                    const Icon = d.icon;
                    return (
                      <div key={d.label} className="flex gap-4 px-5 py-4">
                        <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-md bg-navy-50 text-navy-700">
                          <Icon size={18} strokeWidth={1.75} />
                        </span>
                        <div>
                          <dt className="mepm-spec mb-1">{d.label}</dt>
                          <dd>
                            {d.href ? (
                              <a
                                href={d.href}
                                className="text-[15px] font-medium text-navy-700 transition-colors hover:text-green-600"
                              >
                                {d.value}
                              </a>
                            ) : (
                              <span className="block text-[15px] leading-relaxed text-slate-600">
                                {d.lines?.map((line) => (
                                  <span key={line} className="block">
                                    {line}
                                  </span>
                                ))}
                              </span>
                            )}
                          </dd>
                        </div>
                      </div>
                    );
                  })}
                </dl>
              </div>

              {/* What happens next */}
              <div className="mt-8">
                <h2 className="mepm-spec mb-4">What happens next</h2>
                <ol className="space-y-4">
                  {NEXT_STEPS.map((step, i) => (
                    <li key={step} className="flex gap-4">
                      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-navy-700 font-mono text-xs font-semibold text-white">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-slate-600">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Reveal>

          {/* Form */}
          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}

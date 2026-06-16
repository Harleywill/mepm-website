import Image from 'next/image';
import Link from 'next/link';
import { services } from '@/lib/services';
import type { SiteSettingsDTO } from '@/lib/settings';

const LOGO_REVERSED = '/assets/mepm-logo-reversed-tight.png';

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, '')}`;

const companyLinks = [
  { label: 'Home', href: '/' },
  { label: 'All services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'Contact', href: '/contact' },
];

export default function Footer({ settings }: { settings: SiteSettingsDTO }) {
  const socialLinks = [
    { label: 'LinkedIn', href: settings.linkedin, icon: 'fab fa-linkedin-in' },
    { label: 'Twitter', href: settings.twitter, icon: 'fab fa-twitter' },
    { label: 'Instagram', href: settings.instagram, icon: 'fab fa-instagram' },
    { label: 'Facebook', href: settings.facebook, icon: 'fab fa-facebook-f' },
  ].filter((s) => s.href);

  const addressLines = [
    settings.addressLine1,
    settings.addressLine2,
    settings.addressLine3,
  ].filter(Boolean);

  return (
    <footer className="bg-navy-900 text-white/72 font-body">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand Column */}
        <div>
          <Image
            src={LOGO_REVERSED}
            alt="MEPM"
            width={120}
            height={32}
            style={{ width: 'auto', height: '32px' }}
            className="mb-4"
          />
          <p className="text-sm leading-relaxed text-white/62 max-w-xs">
            Multi-disciplinary building services consultants delivering electrical, mechanical and environmental engineering with sustainability at the core.
          </p>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="flex gap-3 mt-5">
              {socialLinks.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-sm border border-white/18 flex items-center justify-center text-white/80 hover:bg-white/12 transition-colors"
                >
                  <i className={`${icon} text-base`} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Services */}
        <div>
          <div className="font-mono text-xs uppercase tracking-caps text-green-400 mb-4">
            SERVICES
          </div>
          <ul className="space-y-3">
            {services.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/services/${service.slug}`}
                  className="text-sm text-white/72 hover:text-white/90 transition-colors"
                >
                  {service.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <div className="font-mono text-xs uppercase tracking-caps text-green-400 mb-4">
            COMPANY
          </div>
          <ul className="space-y-3">
            {companyLinks.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-sm text-white/72 hover:text-white/90 transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div className="font-mono text-xs uppercase tracking-caps text-green-400 mb-4">
            CONTACT
          </div>
          <ul className="space-y-3 text-sm">
            {settings.phone && (
              <li>
                <a
                  href={telHref(settings.phone)}
                  className="text-white/72 hover:text-white/90 transition-colors"
                >
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="text-white/72 hover:text-white/90 transition-colors"
                >
                  {settings.email}
                </a>
              </li>
            )}
            {addressLines.length > 0 && (
              <li className="text-white/62 leading-relaxed">
                {addressLines.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < addressLines.length - 1 && <br />}
                  </span>
                ))}
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-white/12">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50 font-mono">
          <span>© 2026 MEPM Building Services Consultants Ltd</span>
          <span>Registered in England & Wales</span>
        </div>
      </div>
    </footer>
  );
}

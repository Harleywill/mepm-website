'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Linkedin, Twitter, Mail } from 'lucide-react';

const LOGO_REVERSED = '/assets/mepm-logo-reversed-tight.png';

const footerSections = [
  {
    title: 'SERVICES',
    links: [
      'Electrical engineering',
      'Mechanical engineering',
      'Environmental consultancy',
      'Energy & net zero',
      'BIM & coordination',
    ],
  },
  {
    title: 'COMPANY',
    links: [
      'About MEPM',
      'Our approach',
      'Projects',
      'Careers',
      'Contact',
    ],
  },
  {
    title: 'SECTORS',
    links: [
      'Commercial',
      'Education',
      'Healthcare',
      'Residential',
      'Industrial',
    ],
  },
];

const socialLinks = [
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Mail, label: 'Email', href: '#' },
];

export default function Footer() {
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
            className="h-8 w-auto mb-4"
          />
          <p className="text-sm leading-relaxed text-white/62 max-w-xs">
            Multi-disciplinary building services consultants delivering electrical, mechanical and environmental engineering with sustainability at the core.
          </p>

          {/* Social Links */}
          <div className="flex gap-3 mt-5">
            {socialLinks.map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="w-9.5 h-9.5 rounded-sm border border-white/18 flex items-center justify-center text-white/80 hover:bg-white/12 transition-colors"
              >
                <Icon size={17} />
              </Link>
            ))}
          </div>
        </div>

        {/* Footer Sections */}
        {footerSections.map((section) => (
          <div key={section.title}>
            <div className="font-mono text-xs uppercase tracking-caps text-green-400 mb-4">
              {section.title}
            </div>
            <ul className="space-y-3">
              {section.links.map((link) => (
                <li key={link}>
                  <Link
                    href="#"
                    className="text-sm text-white/72 hover:text-white/90 transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-white/12">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50 font-mono">
          <span>© 2026 MEPM Building Services Consultants Ltd</span>
          <span>Company No. 00000000 · Registered in England & Wales</span>
        </div>
      </div>
    </footer>
  );
}

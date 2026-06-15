'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, ChevronDown, Phone, Mail } from 'lucide-react';
import { Button } from '../ui';
import { services } from '@/lib/services';

const LOGO = '/assets/mepm-logo-tight.png';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services', children: services },
  { label: 'Projects', href: '/projects' },
  { label: 'Contact', href: '/contact' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setMobileOpen(false);
    setServicesOpen(false);
  }, [pathname]);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    if (!servicesOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setServicesOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setServicesOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [servicesOpen]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* Contact bar — not sticky, so it scrolls away while the nav stays pinned */}
      <div className="bg-navy-900 text-white/78 text-[13px]">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5 sm:gap-6">
            <a
              href="tel:+441482838080"
              className="inline-flex items-center gap-2 hover:text-white transition-colors"
            >
              <Phone size={14} aria-hidden />
              01482 838080
            </a>
            <a
              href="mailto:info@mepmservices.co.uk"
              className="inline-flex items-center gap-2 hover:text-white transition-colors"
            >
              <Mail size={14} aria-hidden />
              info@mepmservices.co.uk
            </a>
          </div>
          <span className="hidden md:block font-mono text-[11px] uppercase tracking-[0.08em] text-white/55">
            Building services consultants
          </span>
        </div>
      </div>

      {/* Sticky Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ease-standard ${
          isScrolled
            ? 'bg-white/30 backdrop-blur-md border-b border-slate-200 shadow-sm'
            : 'bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-19 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0" aria-label="MEPM home">
            <Image
              src={LOGO}
              alt="MEPM"
              width={120}
              height={34}
              style={{ width: 'auto', height: '36px' }}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              const linkClasses = `relative px-3.5 py-2 font-body font-medium text-sm transition-colors duration-200 ease-standard ${
                active ? 'text-navy-700' : 'text-slate-700 hover:text-navy-700'
              }`;

              if (link.children) {
                return (
                  <div
                    key={link.label}
                    ref={dropdownRef}
                    className="relative"
                    onMouseEnter={() => setServicesOpen(true)}
                    onMouseLeave={() => setServicesOpen(false)}
                  >
                    <button
                      onClick={() => setServicesOpen(!servicesOpen)}
                      aria-expanded={servicesOpen}
                      aria-haspopup="true"
                      className={`${linkClasses} inline-flex items-center gap-1`}
                    >
                      {link.label}
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${
                          servicesOpen ? 'rotate-180' : ''
                        }`}
                      />
                      {active && <NavUnderline />}
                    </button>

                    <AnimatePresence>
                      {servicesOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 pt-2 w-72"
                        >
                          <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-lg shadow-lg overflow-hidden p-2">
                            {link.children.map((service) => (
                              <Link
                                key={service.slug}
                                href={`/services/${service.slug}`}
                                className={`block px-4 py-3 rounded-md transition-colors ${
                                  pathname === `/services/${service.slug}`
                                    ? 'bg-navy-700/10 text-navy-700'
                                    : 'hover:bg-navy-50/60'
                                }`}
                              >
                                <span className="block font-body font-medium text-sm text-navy-700">
                                  {service.name}
                                </span>
                                <span className="block mt-0.5 text-xs text-slate-600 leading-snug">
                                  {service.shortDescription}
                                </span>
                              </Link>
                            ))}
                            <div className="border-t border-slate-200 mt-2 pt-2">
                              <Link
                                href="/services"
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-navy-700 hover:text-green-600 transition-colors"
                              >
                                All services
                                <ArrowRight size={14} />
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link key={link.label} href={link.href} className={linkClasses}>
                  {link.label}
                  {active && <NavUnderline />}
                </Link>
              );
            })}

            <div className="w-3.5" />

            <Button
              variant="glass"
              size="md"
              icon={<ArrowRight size={18} />}
              onClick={() => router.push('/contact')}
              className="font-semibold"
            >
              Get a quote
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-navy-700 hover:bg-navy-50 rounded-md transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      {/* Mobile Menu — anchored to the header so the contact bar above
          can't push it out of alignment */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-0 right-0 bg-white/85 backdrop-blur-lg border-b border-slate-200 z-40"
          >
            <div className="p-4 space-y-1">
              <MobileLink href="/" label="Home" pathname={pathname} />
              <MobileLink href="/services" label="Services" pathname={pathname} />
              <div className="pl-4 space-y-1">
                {services.map((service) => (
                  <MobileLink
                    key={service.slug}
                    href={`/services/${service.slug}`}
                    label={service.name}
                    pathname={pathname}
                    sub
                  />
                ))}
              </div>
              <MobileLink href="/projects" label="Projects" pathname={pathname} />
              <MobileLink href="/contact" label="Contact" pathname={pathname} />

              <Button
                variant="glass"
                size="md"
                icon={<ArrowRight size={18} />}
                onClick={() => router.push('/contact')}
                className="w-full mt-4"
              >
                Get a quote
              </Button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      </header>
    </>
  );
}

function NavUnderline() {
  return (
    <motion.span
      layoutId="nav-underline"
      className="absolute bottom-1.5 left-3.5 right-3.5 h-0.5 bg-mepm-green"
      transition={{ duration: 0.3 }}
    />
  );
}

function MobileLink({
  href,
  label,
  pathname,
  sub = false,
}: {
  href: string;
  label: string;
  pathname: string;
  sub?: boolean;
}) {
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`block w-full px-4 py-3 rounded-md font-body font-medium transition-colors ${
        sub ? 'text-sm' : 'text-sm'
      } ${
        active
          ? 'bg-navy-700/20 backdrop-blur-sm text-navy-700'
          : 'text-slate-700 hover:bg-navy-50/40'
      }`}
    >
      {label}
    </Link>
  );
}

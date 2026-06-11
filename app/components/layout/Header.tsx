'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '../ui';

const LOGO = '/assets/mepm-logo-tight.png';
const LOGO_REVERSED = '/assets/mepm-logo-reversed-tight.png';

interface HeaderProps {
  activeSection?: string;
  onNavClick?: (section: string) => void;
}

const navLinks = [
  { label: 'Home', id: 'top' },
  { label: 'Services', id: 'services' },
  { label: 'Projects', id: 'projects' },
  { label: 'About', id: 'stats' },
  { label: 'Contact', id: 'contact' },
];

export default function Header({ activeSection = 'Home', onNavClick }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll for subtle shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (section: string, id: string) => {
    setMobileOpen(false);
    onNavClick?.(section);

    // Smooth scroll to section
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.pageYOffset - 76;
      window.scrollTo({ top: id === 'top' ? 0 : y, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Sticky Header */}
      <motion.header
        className={`sticky top-0 z-50 transition-all duration-standard ease-standard ${
          isScrolled
            ? 'bg-white/92 backdrop-blur-md border-b border-slate-200 shadow-sm'
            : 'bg-white'
        }`}
        initial={{ y: 0 }}
        animate={{ y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-6 h-19 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('Home', 'top');
            }}
            className="flex-shrink-0"
          >
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
              const isActive = activeSection === link.label;
              return (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.label, link.id)}
                  className={`relative px-3.5 py-2 font-body font-medium text-sm transition-colors duration-standard ease-standard ${
                    isActive ? 'text-navy-700' : 'text-slate-700 hover:text-navy-700'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-1.5 left-3.5 right-3.5 h-0.5 bg-mepm-green"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      exit={{ scaleX: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </button>
              );
            })}

            {/* Spacer */}
            <div className="w-3.5" />

            {/* Get Quote Button */}
            <Button
              variant="secondary"
              size="md"
              icon={<ArrowRight size={18} />}
              onClick={() => handleNavClick('Contact', 'contact')}
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
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-19 left-0 right-0 bg-white border-b border-slate-200 z-40"
          >
            <div className="p-4 space-y-2">
              {navLinks.map((link) => {
                const isActive = activeSection === link.label;
                return (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link.label, link.id)}
                    className={`w-full text-left px-4 py-3 rounded-md font-body font-medium text-sm transition-colors ${
                      isActive
                        ? 'bg-navy-50 text-navy-700'
                        : 'text-slate-700 hover:bg-navy-50'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}

              {/* Mobile CTA Button */}
              <Button
                variant="secondary"
                size="md"
                icon={<ArrowRight size={18} />}
                onClick={() => handleNavClick('Contact', 'contact')}
                className="w-full mt-4"
              >
                Get a quote
              </Button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}

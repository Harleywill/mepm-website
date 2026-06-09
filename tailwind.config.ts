import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand core
        'mepm-navy': '#004078',
        'mepm-green': '#68B830',

        // Navy scale
        navy: {
          950: '#001A33',
          900: '#002850',
          800: '#013463',
          700: '#004078',
          600: '#0A5491',
          500: '#1E6CAD',
          400: '#4A8DC4',
          300: '#84B2D9',
          200: '#B9D3E9',
          100: '#DCE9F3',
          50: '#EEF4FA',
        },

        // Green scale
        green: {
          950: '#1a3a0c',
          900: '#2E5614',
          800: '#3E7A1C',
          700: '#4F9A25',
          600: '#5AAA2B',
          500: '#68B830',
          400: '#84C857',
          300: '#A6D885',
          200: '#C9E7B5',
          100: '#E4F2D8',
          50: '#F2F8EB',
        },

        // Slate neutrals
        slate: {
          950: '#0E1620',
          900: '#18222E',
          800: '#27323F',
          700: '#3A4654',
          600: '#54616E',
          500: '#717E8A',
          400: '#95A0AB',
          300: '#BFC7CF',
          200: '#DDE2E7',
          100: '#EDF0F3',
          50: '#F6F8FA',
        },

        // Semantic
        steel: '#3D8FCB',
        'steel-dark': '#1E6CAD',
        success: '#4F9A25',
        danger: '#D14343',
        warning: '#E0941A',

        // Semantic surfaces
        'bg-subtle': '#F6F8FA',
        'bg-sunken': '#EEF4FA',
      },

      backgroundColor: {
        'success-bg': '#E4F2D8',
        'info-bg': '#DCE9F3',
        'warning-bg': '#FBEFD5',
        'danger-bg': '#FBE3E3',
      },

      textColor: {
        fg: '#18222E',
        'fg-muted': '#54616E',
        'fg-subtle': '#95A0AB',
        'fg-on-navy': '#FFFFFF',
        link: '#0A5491',
      },

      borderColor: {
        DEFAULT: '#DDE2E7',
        strong: '#BFC7CF',
      },

      fontFamily: {
        display: ["'Archivo'", 'system-ui', 'sans-serif'],
        body: ["'IBM Plex Sans'", 'system-ui', 'sans-serif'],
        mono: ["'IBM Plex Mono'", 'ui-monospace', 'monospace'],
      },

      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.25' }],
        sm: ['0.875rem', { lineHeight: '1.55' }],
        base: ['1rem', { lineHeight: '1.55' }],
        lg: ['1.125rem', { lineHeight: '1.55' }],
        xl: ['1.375rem', { lineHeight: '1.25' }],
        '2xl': ['1.75rem', { lineHeight: '1.18' }],
        '3xl': ['2.25rem', { lineHeight: '1.12' }],
        '4xl': ['3rem', { lineHeight: '1.08' }],
        '5xl': ['3.875rem', { lineHeight: '1.08' }],
        '6xl': ['5rem', { lineHeight: '1.08' }],
      },

      lineHeight: {
        tight: '1.08',
        snug: '1.25',
        normal: '1.55',
      },

      letterSpacing: {
        tight: '-0.02em',
        normal: '0',
        wide: '0.04em',
        caps: '0.12em',
      },

      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '24px',
        6: '32px',
        7: '48px',
        8: '64px',
        9: '96px',
        10: '128px',
      },

      borderRadius: {
        xs: '2px',
        sm: '4px',
        md: '6px',
        lg: '10px',
        xl: '16px',
        pill: '999px',
      },

      boxShadow: {
        xs: '0 1px 2px rgba(0, 40, 80, 0.06)',
        sm: '0 1px 3px rgba(0, 40, 80, 0.08), 0 1px 2px rgba(0, 40, 80, 0.06)',
        md: '0 4px 12px rgba(0, 40, 80, 0.10), 0 2px 4px rgba(0, 40, 80, 0.06)',
        lg: '0 12px 28px rgba(0, 40, 80, 0.14), 0 4px 8px rgba(0, 40, 80, 0.06)',
        xl: '0 24px 48px rgba(0, 40, 80, 0.18)',
      },

      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0.1, 1)',
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      transitionDuration: {
        fast: '120ms',
        DEFAULT: '220ms',
        slow: '360ms',
      },

      animation: {
        marquee: 'marquee 32s linear infinite',
        pulse: 'pulse 1.8s ease-in-out infinite',
      },

      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

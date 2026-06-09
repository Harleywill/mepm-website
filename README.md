# MEPM Building Services Consultants — Website

A modern, professional website for **MEPM Building Services Consultants**, a multi-disciplinary engineering practice delivering electrical, mechanical and environmental engineering with sustainability at its core.

**Repository:** https://github.com/Harleywill/mepm-website

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn

### Installation & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser to http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

---

## 📋 Project Structure

```
app/
├── components/
│   ├── layout/              # Shared layout components
│   │   ├── Header.tsx       # Sticky top navigation
│   │   ├── Footer.tsx       # Footer with links
│   │   └── TopBar.tsx       # Utility bar
│   ├── sections/            # Page sections
│   │   ├── Hero.tsx
│   │   ├── Services.tsx
│   │   ├── Process.tsx
│   │   ├── StatStrip.tsx
│   │   ├── Projects.tsx
│   │   ├── Contact.tsx
│   │   └── Marquee.tsx
│   ├── ui/                  # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Icon.tsx
│   │   └── Input.tsx
│   └── ...
├── globals.css              # Global styles + design tokens
├── layout.tsx               # Root layout
├── page.tsx                 # Homepage
└── favicon.ico

public/
├── assets/                  # Brand assets (logos, etc.)
└── images/                  # Image placeholders

tailwind.config.ts           # Tailwind config with MEPM tokens
postcss.config.mjs           # PostCSS config
tsconfig.json                # TypeScript config
package.json
```

---

## 🎨 Design System

This project uses the **MEPM Design System** with carefully-tuned brand colors, typography, spacing, and components.

### Brand Colors
- **Navy** (`#004078`) — Primary, trust, structure
- **Green** (`#68B830`) — Accent, sustainability, energy
- **Slate** (`#54616E`) — Text, neutrals

### Typography
- **Archivo** (display) — Bold, geometric, for headings
- **IBM Plex Sans** (body) — Technical heritage, highly legible
- **IBM Plex Mono** (specs/mono) — Engineering credibility

### Key Design Rules
- Navy structures, slate carries words, green is a sparing accent
- Navy-tinted shadows only (`rgba(0,40,80,…)`)
- Cards: white, hairline border, soft shadow, optional green top-rule
- No heavy gradients, no purple, no emoji
- One navy "fact" band per page max
- Smooth animations: 120–360ms, `cubic-bezier(0.2,0,0.1,1)`

### Component Documentation
See `tailwind.config.ts` for the complete color scale and token definitions. Global styles in `app/globals.css` include semantic type classes (`.mepm-h1`, `.mepm-eyebrow`, `.mepm-spec`, etc.).

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Type Safety** | TypeScript |
| **Linting** | ESLint + TypeScript |

---

## 📦 Dependencies

### Core
- `next` — React meta-framework
- `react` / `react-dom` — UI library
- `typescript` — Type safety

### Styling & Components
- `tailwindcss` — Utility CSS framework
- `framer-motion` — Smooth animations
- `lucide-react` — Icon library
- `clsx` — Conditional className helper

### Development
- `@types/react`, `@types/node` — TypeScript types
- `eslint`, `eslint-config-next` — Code linting
- `@tailwindcss/postcss` — Tailwind PostCSS plugin

---

## 🛠️ Available Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm start            # Run production build
npm run lint         # Run ESLint
npm run lint --fix   # Auto-fix lint issues
```

---

## 📄 Design Token Reference

### Spacing (4px base)
- `space-1` = 4px, `space-2` = 8px, ... `space-10` = 128px

### Type Scale
- `text-xs` = 12px, `text-sm` = 14px, `text-base` = 16px
- `text-2xl` = 28px, `text-3xl` = 36px, `text-4xl` = 48px, `text-6xl` = 80px

### Radii
- `rounded-xs` = 2px, `rounded-sm` = 4px, `rounded-md` = 6px
- `rounded-lg` = 10px, `rounded-xl` = 16px, `rounded-pill` = 999px

### Shadows (navy-tinted)
- `shadow-xs` through `shadow-xl` (5 steps)

### Motion
- Duration: `fast` (120ms), `default` (220ms), `slow` (360ms)
- Easing: `ease-standard`, `ease-out`

---

## 🎯 Features

- ✅ Sticky header with smooth scrolling navigation
- ✅ Dark blueprint-grid hero with credential card
- ✅ Accreditation marquee ticker
- ✅ Interactive discipline showcase (Electrical/Mechanical/Environmental)
- ✅ 4-stage process timeline
- ✅ Animated count-up statistics
- ✅ Project showcase cards
- ✅ Enquiry form with validation
- ✅ Fully responsive (mobile-first)
- ✅ Accessible (WCAG AA)
- ✅ Brand-compliant styling
- ✅ Smooth animations & transitions

---

## 🚢 Deployment

### Vercel (Recommended)
The easiest way to deploy is via [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the repo in Vercel
3. Vercel auto-detects Next.js and deploys

### Other Platforms
See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for Netlify, Docker, etc.

---

## 📚 Resources

- [MEPM Design System](../mepm-design-system/) — Full design tokens, component library, and guidelines
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev)

---

## 📝 Notes

- All fonts are loaded from Google Fonts CDN (Archivo, IBM Plex Sans, IBM Plex Mono)
- Logo assets are in `public/assets/` — use `mepm-logo-tight.png` for light backgrounds, `mepm-logo-reversed-tight.png` for dark
- Form submissions currently log to console (Phase 2: integrate with backend)
- Images use placeholder components — replace with real building/plant-room photography

---

## 🔐 License

Internal project for MEPM Building Services Consultants.

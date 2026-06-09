# MEPM Website — Project Instructions

## Overview
Building a professional marketing website for **MEPM Building Services Consultants** using Next.js 15 + TypeScript + Tailwind CSS. The design system includes brand colors (navy/green), typography (Archivo/IBM Plex), and reusable components.

**Repository:** https://github.com/Harleywill/mepm-website

---

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (with MEPM design tokens)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Design System:** /Downloads/mepm-design-system/ (reference materials)

---

## Project Structure

```
app/
├── components/
│   ├── layout/          # Navbar, Footer, TopBar
│   ├── sections/        # Hero, Services, Process, StatStrip, Projects, Contact, Marquee
│   ├── ui/              # Button, Card, Icon, Input, etc.
│   └── index.ts         # Component exports
├── globals.css          # Global styles + MEPM design tokens
├── layout.tsx           # Root layout
└── page.tsx             # Homepage

public/assets/           # Logo variants (light & dark)
tailwind.config.ts       # Tailwind config with MEPM palette
```

---

## Design System Rules

### Colors
- **Navy (#004078)** — primary, headings, footer, structure
- **Green (#68B830)** — accent, CTAs, card top-rules, one highlighted word
- **Slate (#54616E)** — body text, borders, secondary elements

### Typography
- **Archivo** (display) — h1-h3, eyebrows, bold geometric
- **IBM Plex Sans** (body) — paragraphs, UI labels, controls
- **IBM Plex Mono** (mono) — specs, metadata, engineering signals

### Component Patterns
- Cards: white bg, hairline border, shadow-sm, green top-rule (5-6px), hover lift
- Buttons: navy (primary) / green (secondary) / ghost, 120ms transition
- Inputs: slate border, navy focus ring (3px), placeholder text subtle
- Shadows: navy-tinted only (rgba(0,40,80,...)), never black

### Motion
- Duration: 120ms (fast), 220ms (default), 360ms (slow)
- Easing: `cubic-bezier(0.2, 0, 0.1, 1)` standard, no bounces
- Respect `prefers-reduced-motion`

---

## Key Features to Implement

### Homepage Sections (in order)
1. **TopBar** — utility bar (phone, contact links)
2. **Header** — sticky nav (logo, nav links, smooth scroll)
3. **Hero** — dark blueprint-grid, title, subtitle, CTA, credential card
4. **Marquee** — scrolling accreditation logos
5. **Services** — tabbed discipline showcase (Electrical / Mechanical / Environmental)
6. **Process** — 4-stage timeline
7. **StatStrip** — navy band with count-up statistics
8. **Projects** — case study cards showcase
9. **Contact** — enquiry form with validation
10. **Footer** — 4-column layout with links, social, copyright

---

## Development Guidelines

### Before Starting
- Read the complete design spec: `/Downloads/mepm-design-system/project/README.md`
- Review `tailwind.config.ts` for all design tokens
- Check `app/globals.css` for semantic type classes and component utilities

### Component Pattern
Each component should:
- Use TypeScript with proper types
- Leverage Tailwind classes (extend with `@apply` in globals.css if needed)
- Include proper accessibility (alt text, ARIA labels, semantic HTML)
- Support responsive design (mobile-first)
- Use Framer Motion for animations (scroll reveal, hover, transitions)

### Example Component Structure
```tsx
'use client';

import { motion } from 'framer-motion';

interface MyComponentProps {
  title: string;
  // ...
}

export default function MyComponent({ title }: MyComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <h2 className="mepm-h2">{title}</h2>
      {/* ... */}
    </motion.div>
  );
}
```

### Styling
- Use semantic Tailwind classes from `globals.css` (`.btn`, `.card`, `.input`, etc.)
- For MEPM type: use `.mepm-h1`, `.mepm-h2`, `.mepm-body`, `.mepm-eyebrow`, etc.
- Never use arbitrary values like `text-[#004078]` — use design tokens: `text-mepm-navy`
- Color scale: `navy-50` through `navy-950`, `green-50` through `green-900`, `slate-*`

### Forms & Validation
- Use React state + simple validation
- Show success state on submit
- No backend required for Phase 1

### Images
- Use `<Image />` from Next.js for optimization
- Provide alt text for all images
- Use placeholder components for now (real photos Phase 2)

---

## Git & Commits
- Single contributor, no co-author lines needed
- Commit message format: "type: brief description" (e.g., "feat: add hero section", "fix: adjust card spacing")
- Keep commits logical and atomic

---

## Testing & QA

Before considering a section "done":
- [ ] Visual design matches the handoff spec (colors, spacing, typography)
- [ ] Responsive on mobile (375px), tablet (768px), desktop (1280px)
- [ ] All links and buttons work
- [ ] Forms have validation
- [ ] Accessibility: heading hierarchy, alt text, ARIA labels, keyboard nav
- [ ] Animations smooth and respect `prefers-reduced-motion`
- [ ] Lighthouse scores: Performance >90, Accessibility >95

---

## References

- **Design System:** /Downloads/mepm-design-system/project/
  - README.md — full brand guidelines
  - ui_kits/website/ — interactive HTML prototype
  - colors_and_type.css — tokens (copied to tailwind.config.ts)
  - assets/ — logo variants
  
- **Docs:**
  - Next.js: https://nextjs.org/docs
  - Tailwind: https://tailwindcss.com/docs
  - Framer Motion: https://www.framer.com/motion/
  - Lucide: https://lucide.dev

---

## Status

- ✅ Project scaffolded (Next.js 15, TypeScript, Tailwind)
- ✅ Design tokens configured (tailwind.config.ts)
- ✅ Global styles & semantic classes (app/globals.css)
- ✅ Component folder structure ready
- ✅ GitHub repo created
- ⏳ **In Progress:** Implementing homepage sections
- ⏳ **To Do:** Build all 10 sections, test responsive design, optimize images, deploy

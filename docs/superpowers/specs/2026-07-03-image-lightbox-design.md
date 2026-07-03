# Image Lightbox Feature Design

**Date:** 2026-07-03  
**Project:** MEPM Website  
**Feature:** Click-to-enlarge image lightbox for project galleries

---

## Overview

Add an interactive image lightbox modal to the project detail page (`/projects/[slug]`) that allows users to click on images (cover image or gallery) and view them enlarged in a modal overlay with full keyboard and mobile support.

**Scope:** Project detail page only (cover image + gallery images together as one navigable sequence)

---

## User Experience

### Desktop (md and above)
- Click any image (cover or gallery) to open modal at that image
- Modal centered on screen with dark semi-transparent overlay (bg-black/50)
- Modal container max-width 800px with padding, image constrained within, maintains aspect ratio
- Left/right arrow buttons flank the image
- Close button in top-right corner
- Image counter displays "2 of 5" (current of total)
- Caption displays below image if present

### Mobile (< md breakpoint)
- Click any image to open fullscreen modal overlay (100vw × 100vh)
- Image maximizes available space with 24px padding, maintains aspect ratio
- Arrow buttons positioned at bottom for thumb-friendly navigation
- Close button top-right
- Image scrollable if it exceeds viewport (rare edge case)
- Same keyboard support as desktop
- Same image counter and caption

### Keyboard Navigation (All Screens)
- **ESC** → Close modal
- **Left Arrow** → Previous image
- **Right Arrow** → Next image
- Navigation wraps (end → start, start → end)

### Animations
- **Open:** Overlay fades in (0 → 1), image scales in (0.95 → 1) + fades, 200ms, easeOut
- **Navigate:** Current image fades out (150ms), next image fades in (150ms), subtle translateX shows direction
- **Close:** Reverse of open animation, 150ms

---

## Technical Design

### Component: `ImageLightbox`

**File:** `app/components/ui/ImageLightbox.tsx`

**Props:**
```typescript
interface LightboxImage {
  id: string;
  src: string;
  caption?: string | null;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}
```

**Responsibilities:**
- Manage modal open/close and current image index state
- Render overlay + image + navigation controls
- Handle keyboard events (ESC, arrow keys)
- Animate in/out and between images
- Responsive layout (desktop modal vs mobile fullscreen)
- Prevent body scroll when open

**Key Logic:**
- Store images array + current index in state
- Handle prev/next with wrapping (nextIndex = (current + 1) % images.length)
- Listen to keydown events; cleanup on unmount
- Use Framer Motion for all animations
- Use Next.js Image component for optimized rendering

---

### Integration: Project Detail Page

**File:** `app/projects/[slug]/page.tsx`

**Changes:**
1. Convert to client component (add `'use client'` at top)
2. Create images array combining cover + gallery
3. Pass click handlers to Image elements that set lightbox state
4. Render `<ImageLightbox>` component when modal should be open

**State to add:**
```typescript
const [lightboxOpen, setLightboxOpen] = useState(false);
const [lightboxIndex, setLightboxIndex] = useState(0);

const allImages = [
  ...(cover ? [{ id: cover.id, src: imageUrl(cover.storedPath), caption: cover.caption }] : []),
  ...gallery.map(img => ({ id: img.id, src: imageUrl(img.storedPath), caption: img.caption }))
];
```

---

## Data Flow

```
User clicks image
  ↓
onClick handler sets lightboxIndex + setLightboxOpen(true)
  ↓
ImageLightbox component renders with animation
  ↓
User presses arrow key / clicks arrow button
  ↓
Handler updates currentIndex state
  ↓
Image fades out, next image fades in
  ↓
User presses ESC / clicks close
  ↓
setLightboxOpen(false), cleanup keyboard listeners
```

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|-----------|----------|
| < 480px | Fullscreen, buttons at bottom, portrait-optimized |
| 480px–768px | Fullscreen, buttons at bottom |
| ≥ 768px (md) | Modal overlay, 800px max-width, centered, desktop controls |

---

## Accessibility

- Modal closes with ESC (standard pattern)
- Keyboard navigation with arrow keys (standard pattern)
- Close button has clear label
- Image counter announces position (semantic HTML, screen readers)
- No focus trap needed (simple modal, background page not interactive while open)
- Image alt text preserved from original Image components

---

## Dependencies

- **React 19:** useState, useEffect, useCallback, useRef
- **Framer Motion 12.40:** AnimatePresence, motion.div, custom animations
- **Next.js 16:** Image component (already used)
- **Tailwind CSS:** Styling, responsive utilities

**No new external dependencies required.**

---

## Testing Strategy

**Manual (in browser):**
- Click cover image → lightbox opens at image 0
- Click gallery image → lightbox opens at correct index
- Arrow keys navigate forward/backward
- ESC closes modal
- Left/right arrow buttons navigate
- Image wraps (last → first, first → last)
- Animations are smooth
- Mobile fullscreen at < 768px, modal at ≥ 768px
- Captions display when present
- Counter displays correctly

**Edge cases:**
- Single image (cover only, no gallery) → counter shows "1 of 1", prev/next disabled visually
- No captions → caption area is hidden
- Very large images → contained to viewport, scrollable if needed
- Touch swipe on mobile (optional future enhancement)

---

## Files to Create/Modify

| File | Type | Change |
|------|------|--------|
| `app/components/ui/ImageLightbox.tsx` | Create | New lightbox component |
| `app/projects/[slug]/page.tsx` | Modify | Convert to client component, add lightbox state + handlers |

---

## Future Enhancements (Out of Scope)

- Swipe/touch navigation on mobile
- Download image button
- Share image link
- Image info panel (filename, dimensions, etc.)
- Thumbnail strip at bottom

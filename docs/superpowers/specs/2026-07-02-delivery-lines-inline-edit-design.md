# Delivery Lines Inline Add/Edit — Design

**Status:** Approved
**Date:** 2026-07-02

## Context

`/admin/services` shows two sections: Disciplines (Services — full add/edit via dedicated pages, built in the Service Content Rewire work) and Delivery Lines (ServiceOfferings — currently delete-only, no way to add or edit one without going through the database directly).

The `ServiceOffering` model and its full CRUD API (`/api/service-offerings`, `/api/service-offerings/[id]`) already exist and were built and reviewed as part of Task 5 of the Service Content Rewire. This feature is a pure admin-UI addition — no backend changes are needed.

## Goal

Let an admin add, edit, and delete delivery lines from `/admin/services`, without leaving the list page.

## Interaction Model

- Each offering card in the Delivery Lines list gets an **Edit** (pencil) button next to the existing **Delete** button.
- Clicking Edit expands that card in place into an editable form. Collapsed state and expanded state are the same DOM element — no navigation, no modal.
- Only one card can be in edit mode at a time. Opening a new one collapses whichever was previously open (no confirmation prompt for unsaved changes — this is deliberately simple; the fields are short enough that losing an in-progress edit is low-cost).
- A **"+ Add delivery line"** button (next to the existing "+ Add service" button) inserts a new blank card, already in edit mode, at the top of the Delivery Lines list.
  - **Cancel** on a new (unsaved) card removes it from the list with no API call — nothing was ever created.
  - **Save** on a new card `POST`s to `/api/service-offerings`; on success the card collapses to its normal display state at whatever position its `order` value places it (list re-fetches after save).
  - **Save** on an existing card `PATCH`es `/api/service-offerings/{id}`.

## Fields in the Expanded Editor

| Field | Shown? | Notes |
|---|---|---|
| Name | Yes | Text input. Required. |
| Short description | Yes | Textarea. Used only as the admin list-card preview text — **not** rendered on the public site. |
| Description | Yes | Textarea. This is the text that **does** render publicly, under "How we deliver it" on every `/services/[slug]` page. |
| Keywords | Yes | Tag-list editor (same `TagListEditor` component already built for `ServiceForm.tsx`). Not currently rendered anywhere on the public site — included for future-proofing, per explicit decision (not YAGNI-violating since the field and its API support already exist from Task 5; only the UI to edit it was missing). |
| Order | Yes | Number input. Determines sequence in both the admin list and the public "How we deliver it" section. |
| Slug | **No** | Not shown in the editor at all. Auto-generated from `name` server-side on create (simple kebab-case slugify), immutable after creation. Offerings have no individual public URL — slug is purely an internal unique key for the API, so surfacing it for manual editing would only invite confusion. |

Confirmed via `app/services/[slug]/page.tsx`: only `offering.name` and `offering.description` are read on the public page (line 155, 158) — this is what makes `shortDescription` and `keywords` non-public-facing, and is why they're marked as such above.

## Slug Auto-Generation

Since the editor never shows `slug`, the create flow needs a slugify step. Scope for *this* feature: a minimal kebab-case function (lowercase, spaces/non-alphanumerics → hyphens, collapse repeats) run against `name` at POST time, with a numeric suffix (`-2`, `-3`, ...) appended if the generated slug collides with an existing one. This lives in `lib/services.ts` as a small helper used only by the offerings create path for now.

This is intentionally narrow — a more general, reusable slugify utility (and whether Services' user-editable slug field should also get auto-suggest behavior) is explicitly out of scope here and is the subject of the separate "Slug auto-generation" feature already queued next in the roadmap. Do not generalize this helper preemptively; the next feature will decide whether to extract/reuse it.

## Component Boundaries

- `app/admin/services/page.tsx` (existing, modified): the Delivery Lines section changes from static delete-only cards to stateful cards that can toggle into an editing view. Add/edit/save/cancel logic and the new-card-insertion behavior live here, since this is the only place offerings are listed.
- A new small presentational piece, `OfferingCardForm` (can be a local component inside `page.tsx` or split to its own file if `page.tsx` grows unwieldy — implementer's call at plan-execution time, matching the "smaller focused files" guidance), renders the expanded editable state: Name/Short description/Description/Keywords/Order fields plus Save/Cancel buttons, reusing `TagListEditor` from `ServiceForm.tsx` (already exported there, or extract to a shared location if importing across files proves awkward).
- No changes to `app/api/service-offerings/*`, `lib/services.ts`'s existing exports, or the `ServiceOffering` Prisma model — all already correct from Task 5.

## Error Handling

Reuses the same pattern as `ServiceForm.tsx`: on a non-2xx response, show the API's error message inline in the expanded card (e.g., "Name is required") rather than a toast or alert. The card stays in edit mode so the admin can fix and retry.

## Out of Scope (explicitly deferred to later roadmap items)

- Drag-and-drop reordering (separate, later feature — for now `order` is a plain number field)
- A general-purpose slugify utility reused across Services and Offerings (separate "Slug auto-generation" feature, next in the roadmap)
- Icon picker (unrelated, separate feature)

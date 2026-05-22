# Design Brief: Postify Academy Admin Dashboard

## Purpose & Context
EdTech SaaS super-admin control center for real-time platform coordination, course management, analytics, and user synchronization across mobile app and API server.

## Aesthetic Direction
Professional, focused, purposeful — geometric confidence without playfulness. Every element serves information hierarchy; color is sparse and intentional, never decorative. Animations are minimal, meaningful, and purposeful.

## Color Palette (OKLCH)

| Token             | Light           | Dark            | Role                          |
|-------------------|-----------------|-----------------|-------------------------------|
| Primary (Blue)    | 0.50 0.24 261   | 0.65 0.20 261   | Authority, trust, navigation  |
| Accent (Orange)   | 0.62 0.26 37    | 0.72 0.22 37    | Action, highlight, emphasis   |
| Background        | 0.98 0 0        | 0.12 0 0        | Page surface                  |
| Card              | 0.99 0 0        | 0.16 0 0        | Content containers            |
| Foreground        | 0.18 0 0        | 0.92 0 0        | Text hierarchy                |
| Muted             | 0.92 0.02 0     | 0.20 0.02 0     | Secondary text, disabled      |
| Destructive       | 0.55 0.25 15    | 0.65 0.22 15    | Errors, warnings, deletes     |
| Border            | 0.90 0.02 0     | 0.24 0.02 0     | Container separators          |

## Typography

| Layer    | Font             | Usage                         | Scale       |
|----------|------------------|-------------------------------|-------------|
| Display  | Space Grotesk    | Page titles, hero sections    | 32px–48px   |
| Body     | Inter            | Content, UI labels, form text | 14px–18px   |
| Mono     | Geist Mono       | Code blocks, data values      | 12px–14px   |

## Structural Zones

| Zone          | Light Background | Dark Background | Treatment                                 | Role                                      |
|---------------|------------------|-----------------|-------------------------------------------|-------------------------------------------|
| Header        | 0.99 0 0         | 0.16 0 0        | Subtle border-bottom, toggle controls     | Mode toggle, user menu, breadcrumbs        |
| Sidebar       | 0.98 0 0         | 0.14 0 0        | Active items highlighted blue, subtle sep | Navigation, collapsible on mobile          |
| Content Area  | 0.98 0 0         | 0.12 0 0        | Card-based sections, alternating bg       | Main information display                   |
| Cards         | 0.99 0 0         | 0.16 0 0        | 0.5rem radius, border, shadow-md on hover | Grouped content, metrics, forms, tables    |
| Footer        | 0.98 0 0         | 0.14 0 0        | Border-top, muted text, secondary nav     | Copyright, links, secondary actions       |

## Shape Language
Border-radius 0.5rem (professional, geometric). Shadows subtle via `shadow-md` and `shadow-elevated`. Spacing balanced for 11–14pt line-height.

## Elevation & Depth
Base: card bg with border. Hover: shadow-md. Elevated: shadow-elevated for modals. Subtle: inset shadow.

## Component Patterns
| Pattern | Style |
|---------|-------|
| Button | bg-primary hover:bg-primary/90, bg-accent for CTA |
| Form Input | focus-ring-2 focus-ring-ring |
| KPI Card | icon-container bg-primary/10, trend arrow green/red |
| Badge | px-3 py-1 rounded-full text-xs |
| Coupon | dashed border-primary/30, ticket theme |
| Payment | card-elevated, payment-icon system, toggles |
| Swatch | w-full h-24, live brand palette |
| Status | dot connected/disconnected green/red |

## Motion & Animation
| Animation | Duration | Usage |
|-----------|----------|-------|
| fade-in | 0.3s | Overlay entrance |
| slide-in-right | 0.3s | Sidebar toggle, modals |
| pulse-glow | 2s | Notifications, metrics |
| transition-smooth | 0.3s | Hover, focus, all props |

## Responsive Breakpoints
| Device | Sidebar | Layout | Font |
|--------|---------|--------|------|
| Mobile | Collapsible sheet | Single column, 1rem | 14px |
| Tablet | Collapsible rail | 1–2 column flexible | 16px |
| Desktop | Always visible | 2–3 column grid | 16px |

## Dark Mode Strategy
Backgrounds `0.12–0.20L`, borders `0.24L`. Primary `0.65L` for eye comfort. AA+ contrast via lightness tuning.

## Signature Detail
Blue sidebar + orange CTAs. Icon-based KPI display with trend indicators (green up/red down).

## Constraints & Anti-Patterns
- ✅ Semantic tokens only; icon cards use primary/accent opacity
- ❌ No Bootstrap defaults, no pastel gradients

## Dashboard Enhancements
- **KPI Cards**: Icon 12px in tinted container, 3xl value, trend % (green/red)
- **Coupons**: Dashed border-primary/30, ticket theme, badge tokens
- **Payment**: Card-icon system (Stripe, UPI, bank, Razorpay), toggles, elevated styling
- **Branding**: Color swatches (blue/orange), OKLCH values, asset management
- **App Sync**: Connected app card with status dot, course count badge, "Open Dashboard" CTA, status indicator (online/syncing/offline)
- **Connected Dashboard**: Banner hero editor, course grid inline edit (add/remove/drag), content tabs (video/PDF/attachment manager), real-time sync feedback
- **Withdrawal System**: Bank account form (once, reuse), withdrawal history, pending payouts, Razorpay + Stripe method selector, auto-transfer config
- **Icons**: Consistent sizing (xs=4, sm=5, md=6, lg=8), semantic color inheritance

## App Sync Connected Card Pattern
Status dot (green=online, yellow=syncing, red=offline). Badge: course count. Last sync timestamp. One-click "Open Editable Dashboard" CTA with accent orange. Hover: shadow-md, border-primary/20.

## Connected Dashboard Layout
Hero section: banner upload, title/description editor. Course grid: add course button, inline edit (title, price, thumbnail), drag-to-reorder. Content tabs: upload videos (MP4/WebM), PDFs, attachments with file preview. Publish/Unpublish toggle per item. Live preview toggle (student view).

## Withdrawal & Payout Section
Bank details form (one-time setup, reuse). Method toggle (Razorpay/Stripe). Pending payout cards (amount, date, status). Withdrawal request button. Transaction history table. Auto-transfer on/off toggle.

## Accessibility
AA+ contrast both modes. Focus ring 2px. Explicit labels. Respect `prefers-reduced-motion`.

# Political Portal UI/UX Guidelines

A modern, trustworthy, and efficient user experience for a multi‑role political management platform.

## Principles

- Clarity first: simple language, clear hierarchy, consistent spacing.
- Trustworthy visual tone: restrained color, strong contrast, calm motion.
- Role-relevance: show only what’s needed for the current user level.
- Accessibility by default: keyboard friendly, WCAG AA contrast, motion‑safe.
- Mobile‑ready: layouts adapt gracefully to small screens.

## Color palette and semantic tokens

Use Tailwind’s default palettes to simplify maintenance and ensure accessibility. Define semantic usage instead of hardcoding colors into components.

- Primary: Indigo (actions, links)
  - light: `indigo-600` hover `indigo-700`
  - dark: `indigo-400` hover `indigo-300`
- Accent (info): Blue `blue-600`
- Success: Emerald `emerald-600`
- Warning: Amber `amber-600`
- Danger: Red `red-600`
- Text: Slate (`slate-900` on light, `slate-100` on dark)
- Surfaces:
  - Base: `white` (light), `gray-900` (dark)
  - Muted: `gray-50/100` (light), `gray-800/850` (dark)
  - Borders: `gray-200` (light), `gray-800` (dark)

Example class usage:

- Primary button: `bg-indigo-600 hover:bg-indigo-700 text-white`
- Secondary button: `bg-white text-slate-700 border border-gray-300 hover:bg-gray-50`
- Card: `bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl`

## Typography

- Body: System UI stack for performance and OS-native feel
  - `font-sans` maps to: `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"`
- Devanagari (Hindi): ensure availability (e.g., Noto Sans Devanagari). If you add a custom font, include it via `<link>` in `index.html` and extend Tailwind if needed.
- Scale: Title (24–28), Section (18–20), Body (14–16), Caption (12–13)
- Line-height: 1.4–1.6 for body; tighten for headings

## Spacing & layout

- Base spacing unit: 4px (Tailwind `1`), prefer steps of 4/8/12/16
- Content container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Cards: `p-4 sm:p-6` with `gap-4` between elements
- Grids:
  - Dashboard: responsive `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6`
  - Detail pages: `grid-cols-1 lg:grid-cols-3` (two narrow + one wide)

## Navigation & information architecture

- Global: Topbar (logo, search, user menu) + Sidebar (role‑based nav)
- Breadcrumbs: show current location; `Home / State / Districts / Detail`
- Role scoping: hide items not applicable to user; don’t show disabled links
- Quick actions: top‑right area per screen; keep consistent placement
- Empty states: concise message + primary action

Suggested sidebar grouping (examples; adapt per role):

- Overview (dashboard)
- People (Karyakartas)
- Locations (State → District → Assembly → Block → Mandal → Polling Center → Booth)
- Assignments (Admin only)
- Reports
- Settings

## User flows

- Login → Role redirect → Role dashboard
- Navigate via sidebar; detail pages provide breadcrumbs and tabs
- Admin assignment flow: Admin → Assignments → Select user/role → Select locations → Review → Confirm
- Errors: Non‑blocking toasts for transient issues, inline errors for form validation

## Role‑based dashboard ideas

Keep above the fold to 4–8 key cards; link to detail screens.

- Admin
  - System health (API latency, error rate)
  - User overview (counts by role; trend)
  - Pending approvals/assignments
  - Activity feed (latest logins/changes)
- State Admin
  - District coverage map + counts
  - Assignment completion (districts assigned vs total)
  - Top performing districts (engagement, updates)
  - Alerts (missing data, deadlines)
- District Admin
  - Assemblies coverage and status
  - Recent assignments/changes
  - Key escalations
- Assembly Admin
  - Blocks and Mandals status
  - Upcoming events/tasks
- Block/Mandal Admin
  - Polling centers readiness
  - Booth distribution and gaps
- Polling Center Admin
  - Booth list with statuses
  - Staff assignment completion
- Booth
  - Assigned tasks today
  - Contact chain and resources
- Karyakarta
  - Personal tasks & events
  - Assigned locations and quick reports

## Components (patterns)

- Buttons
  - Primary: `bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60`
  - Destructive: `bg-red-600 hover:bg-red-700 text-white`
- Inputs
  - `rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500`
  - Inline error: `text-sm text-red-600 mt-1`
- Cards
  - `rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900`
- Tables
  - Sticky header; row hover: `hover:bg-gray-50 dark:hover:bg-gray-800`
  - Pagination below; searchable where relevant
- Tabs
  - Underline style: active `border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-300`

## Motion & micro‑interactions

- Respect reduced motion: `motion-safe:transition-all motion-safe:duration-200`
- Hover/press on interactive elements; keep subtle (opacity, scale 0.98)
- Page transitions: fade/slide 100–200ms; avoid large parallax

## Accessibility

- Contrast: AA compliant (≥4.5:1 for text)
- Focus: visible outline on all interactive elements
- Keyboard: full navigation, logical tab order
- ARIA: label icons, associate labels/inputs, `aria-live` for toasts

## Multilingual (English & Hindi)

- Language switcher in topbar; persist preference (localStorage)
- Date/number formatting via Intl APIs; avoid string concatenation
- Allow UI to grow (Hindi strings can be longer)

## Example snippets

Primary button:

```tsx
<button className="inline-flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
  Save
</button>
```

Card with header:

```tsx
<div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
    <h3 className="text-sm font-semibold">District Coverage</h3>
    <button className="text-xs text-indigo-600 dark:text-indigo-400">
      View all
    </button>
  </div>
  <div className="p-4">{/* content */}</div>
</div>
```

Responsive dashboard grid:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
  {/* cards */}
</div>
```

## Implementation checklist

- [ ] Role‑based sidebar items and protected routes are in place
- [ ] Dashboard cards sized for 1–2 lines of content; link to detail screens
- [ ] Buttons and inputs use consistent variants and focus styles
- [ ] Motion uses `motion-safe` classes only; durations ≤200ms
- [ ] Language switcher available and persisted; content fits both languages
- [ ] Tables have sticky headers, hover states, and pagination
- [ ] Empty/error/loading states present for all data screens

---

Use this document as the reference for UI decisions. Keep components lean, reuse patterns, and iterate with real data to validate hierarchy and clarity.

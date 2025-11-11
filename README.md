# Multi-Role Political Management Portal

A modern, trustworthy platform for hierarchical political/election administration built with React + Vite + TypeScript + Tailwind CSS + Redux Toolkit + Zod.

## ✨ Core Capabilities

- Unified secure login + automatic role redirect
- Roles: Admin, State, District, Assembly, Block, Mandal, Polling Center, Booth, Karyakarta (plus dynamic State Admin / District Admin mapping)
- Protected routing & role-scoped navigation
- Dark / Light theme persistence
- Zod + react-hook-form validation patterns
- HTTP wrapper with credential support & typed errors
- Hierarchical assignment API integration groundwork
- Responsive, accessible Tailwind layouts

## 🛠 Tech Stack

| Layer      | Choice                               |
| ---------- | ------------------------------------ |
| Framework  | React 19 + Vite                      |
| Language   | TypeScript                           |
| Styling    | Tailwind CSS (dark mode via `class`) |
| State      | Redux Toolkit                        |
| Routing    | React Router DOM                     |
| Validation | Zod + React Hook Form                |

## 🚀 Quick Start

```powershell
npm install
npm run dev
# Build & preview
npm run build
npm run preview
```

## 🔐 Environment

Create `.env.local` (or `.env`):

```bash
VITE_API_BASE_URL=https://your.api
VITE_PROXY_TARGET=https://your.api
```

## 🔄 Auth Flow

1. User submits credentials → POST `/api/users/login` via `loginUser`.
2. Backend response mapped to internal `User` + `Role` (including intermediate admin levels when present).
3. Token & user persisted in localStorage.
4. Guards (`ProtectedRoute` + `RoleRedirect`) route to role dashboard.

## 📁 Structure Overview (excerpt)

```
src/
	pages/
		Login.tsx
		NotFound.tsx
		<Role>/Overview.tsx
	components/
		Sidebar.tsx
		Topbar.tsx
		ThemeToggle.tsx
	layouts/
		<Role>Layout.tsx
	services/
		authApi.ts
		assignmentsApi.ts
		http.ts
	store/
		authSlice.ts
		hooks.ts
		index.ts
	types/
	utils/
```

## 🎨 UI/UX Guidelines

Refer to `docs/design-guidelines.md` for:

- Semantic color tokens and palette
- Spacing & responsive grid conventions
- Component variants (buttons, cards, tables)
- Accessibility & multilingual (English/Hindi) considerations
- Dashboard card patterns per role

## 📊 Future Enhancements

- Assignment management UI
- Role-based analytics (charts, maps)
- Report exports (CSV/PDF)
- Multilingual toggle (English/Hindi) persistence
- Toast notifications & audit activity feed
- Fine-grained permission flags (beyond role)

## ✅ Quality

Build and lint must pass; keep components small and typed. Prefer composition over prop drilling.

---

For design decisions and patterns, consult `docs/design-guidelines.md` before introducing new UI.

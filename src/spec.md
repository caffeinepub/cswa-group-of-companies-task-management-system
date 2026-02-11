# Specification

## Summary
**Goal:** Update the app’s UI theme to a more stylish, modern, cohesive design across all pages.

**Planned changes:**
- Revise global theme tokens (CSS variables) in `frontend/src/index.css` for both light and dark mode (colors, backgrounds, borders, muted text) to achieve a more intentional modern palette with readable contrast.
- Apply consistent spacing, typography scale, radius, shadows, and component states (hover/active/focus) across cards, tables, dialogs, buttons, inputs, selects, and tabs by adjusting app/page/component `className` usage (without editing Shadcn UI component source files).
- Refresh the main shell styling in `frontend/src/components/MainLayout.tsx` (sidebar/header/footer) to match the new theme, including improved navigation affordances (active item styling and hover states) and better spacing while keeping responsiveness and sidebar toggle behavior.
- Restyle key page sections—at minimum `frontend/src/pages/DashboardPage.tsx` and `frontend/src/pages/LoginPage.tsx`—to better reflect the premium theme through improved layout, header hierarchy, icon treatments, and subtle visual depth, without changing functionality.

**User-visible outcome:** The app looks consistently modern and premium across Dashboard, Clients, Tasks, To‑Do, Team, and Login, with improved navigation styling and more polished component spacing and interaction states, while all existing behavior remains unchanged.

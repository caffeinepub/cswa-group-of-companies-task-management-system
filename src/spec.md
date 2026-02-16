# Specification

## Summary
**Goal:** Apply a dark blue theme across the UI and make dark mode the default on first load.

**Planned changes:**
- Update the existing CSS variable theme tokens (used by Tailwind) to a dark blue palette for dark mode, including deep blue accents and darker blue-tinted backgrounds for key surfaces (app background, cards, popovers, dialogs, sidebar) while maintaining readable contrast.
- Set the app ThemeProvider to default to dark mode so the dark blue theme is shown by default on initial load across Login, MainLayout, and Public Search.

**User-visible outcome:** The app loads in dark mode by default with a consistent dark blue look (backgrounds and accents) across all pages and components, with readable text/icons and opaque, readable dialogs/popovers.

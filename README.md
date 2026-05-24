# The Adventurer's Atlas — Changelog

---

## v1.2.5 — 24 May 2026

### New

#### Hydaelyn Night Mode
A new dark theme inspired by the world of FFXIV has been added to the tracker. *Hydaelyn Night Mode* draws from the deep midnight skies and aetheric light of Hydaelyn — featuring rich blues and purples, glowing cyan-teal accents, and a starlit atmosphere that brings the world of FFXIV a little closer to your tracking experience.

- Toggle via **Options → Hydaelyn Night Mode**
- Theme persists across sessions
- Fully integrated across all UI elements including the side menu, cards, and content panels

#### Side Menu Search
A search bar has been added to the side menu, sitting between the title header and the Expansions list for quick access.

- Search across all tracked content — quests, dungeons, trials, raids, and more
- Styled consistently with the rest of the UI and fully dark mode compatible

#### Side Menu Width Adjustment
The side menu has been widened by 25px to improve readability and give content a little more room to breathe.

### Bug Fixes
- No bug fixes in this release.

### Under the Hood
- Dark mode state is stored in `localStorage` and restored on page load
- Theme colours are defined using CSS custom properties for maintainability
- Search filtering is handled client-side with no additional network requests

---

## v1.2.0 — 23 May 2026

### New

- **Aether Currents tracker** — A full checklist added under Side Content covering all Aether Currents across every expansion from A Realm Reborn through Dawntrail. Each zone is broken into Exploration currents (numbered) and Quest currents (with quest names listed). Progress is tracked per zone and per expansion, with timestamps on completion. Entries are always visible and never hidden when checked.

- **Company Seals in currency tracker** — Grand Company Seals are now tracked alongside other currencies.

- **Currency caps displayed** — Limited currencies (Tomestones, Seals, etc.) now show their weekly or absolute caps alongside current values, so headroom is visible at a glance.

- **Aether Current badges on MSQ entries** — Main Scenario Quests that reward an Aether Current on completion are now marked with a small inline badge, making it easy to track which story quests contribute to flying unlock requirements without leaving the MSQ view.

### Improved

- **Activity Tracker is now collapsible** — The daily and weekly task list can be collapsed and expanded via a toggle header. Defaults to expanded. State persists in localStorage alongside existing progress data.

- **Branching MSQ paths displayed side by side** — Patches with parallel quest chains (where the player tackles multiple nation or role storylines simultaneously in any order) now display those chains in side-by-side columns rather than sequentially. Each column is clearly labelled. Layout collapses to a single column on narrow viewports. Quest data verified against the FFXIV Wiki.

### Under the Hood

- All new Aether Current checkboxes are fully integrated with the existing localStorage persistence. Save, load, and reset handle the new entries correctly. Save file format remains backward-compatible with version 1 saves.
- The Activity Tracker's collapsed/expanded state is stored as a UI preference separately from quest progress — loading a save file will not reset layout preferences.

---

*Data sourced from the FFXIV Consolegamewiki. Quest names and Aether Current counts verified per zone.*
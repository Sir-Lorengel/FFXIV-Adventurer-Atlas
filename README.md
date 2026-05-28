# The Adventurer's Atlas — Changelog

---

## v1.4.0 — 28 May 2026

### New

#### Achievement Tracking
Achievements are now tracked across all categories. Each achievement entry can be checked off individually, with progress tracked per group and timestamps recorded on completion.

#### Side Quest Tracking Per Location
Side quests are now broken down by location rather than listed as a flat global list. Each area displays its own set of side quests, making it easy to see at a glance what remains in a given zone without having to scan the entire list.

#### Completion Percentage Display in the Side Menu
Each category in the side menu now shows a percentage indicating how much of that category has been completed. The percentage updates live as items are checked and unchecked, giving an at-a-glance sense of overall progress without needing to open each section.

### Under the Hood

- Search function rebuilt from the ground up — faster, more accurate, and better handles edge cases across all content types.
- General optimisations across rendering and state management for improved responsiveness.

---

## v1.3.0 — 24 May 2026

### New

#### Right Side Menu
A new side menu has been added to the right of the screen, consolidating key controls and information into one fixed panel. The panel width matches its widest element, keeping the layout tight and consistent.

- **Title** sits at the top of the panel
- **Date & Time** display sits beneath the title
- **Activity Tracker** has been moved into the right panel
- **Options button** is accessible from the right panel
- **Expand All** button — expands every category in the main view at once
- **Collapse All** button — collapses every category in the main view at once

#### MSQ Tracker Expansion Colours
The overall Main Scenario Quest tracker is now colour-coded by expansion, making it easy to see at a glance which era of the story each quest belongs to.

#### Allagan Tomestones in Currency Tracker
Three Allagan Tomestone currencies have been added under the Currency section, each with their own cap displayed.

- **Poetics** — cap: 2,000
- **Mathematics** — cap: 2,000
- **Mnemonics** — cap: 2,000

#### PvP in Currency Tracker
PvP currencies are now tracked under the Currency section.

- **Wolf Mark** — cap: 20,000
- **Trophy Crystal** — cap: 20,000

### Improved

#### Search Now Filters the Main Body
The search function now works across both the side menu and the main content area. When a search term is active, categories in the main body that contain no matching items are hidden, keeping results focused and uncluttered.

#### Timestamp Behaviour on Uncheck
Unchecking an item now also clears its saved date and timestamp, keeping completion records accurate if progress is reversed.

#### Auto-fill Timestamps on Category Completion
When the final item in a category is checked, the category's date and timestamp are automatically filled with the current date and time — no manual entry needed.

### Under the Hood

- Codebase refactored into a modular structure, removing needless duplications and separating concerns across dedicated files for improved maintainability.

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
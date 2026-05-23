# The Adventurer's Atlas — Changelog

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

### Under the hood

- All new Aether Current checkboxes are fully integrated with the existing localStorage persistence. Save, load, and reset handle the new entries correctly. Save file format remains backward-compatible with version 1 saves.
- The Activity Tracker's collapsed/expanded state is stored as a UI preference separately from quest progress — loading a save file will not reset layout preferences.

---

*Data sourced from the FFXIV Consolegamewiki. Quest names and Aether Current counts verified per zone.*

'use strict';
const fs   = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'FFXIV - Atlas.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Detect line ending style
const NL = html.includes('\r\n') ? '\r\n' : '\n';
console.log('Line ending:', NL === '\r\n' ? 'CRLF' : 'LF');

// ── Utility: remove a block between two unique string anchors ────────────────
function removeBetween(src, startAnchor, endAnchor, label) {
  const si = src.indexOf(startAnchor);
  const ei = src.indexOf(endAnchor, si + startAnchor.length);
  if (si === -1) { console.error(`[${label}] Start anchor not found: ${JSON.stringify(startAnchor.slice(0,80))}`); process.exit(1); }
  if (ei === -1) { console.error(`[${label}] End anchor not found: ${JSON.stringify(endAnchor.slice(0,80))}`); process.exit(1); }
  console.log(`[${label}] Removing ${((ei - si)/1024).toFixed(1)} KB (chars ${si}–${ei})`);
  return src.slice(0, si) + src.slice(ei);
}

// ── Utility: insert text after a unique anchor ───────────────────────────────
function insertAfter(src, anchor, insertion, label) {
  const idx = src.indexOf(anchor);
  if (idx === -1) { console.error(`[${label}] Anchor not found: ${JSON.stringify(anchor.slice(0,80))}`); process.exit(1); }
  const pos = idx + anchor.length;
  console.log(`[${label}] Inserting ${insertion.length} chars after char ${idx}`);
  return src.slice(0, pos) + insertion + src.slice(pos);
}

// ── Utility: replace first occurrence ────────────────────────────────────────
function replaceFirst(src, needle, replacement, label) {
  const idx = src.indexOf(needle);
  if (idx === -1) { console.error(`[${label}] Target not found: ${JSON.stringify(needle.slice(0,80))}`); process.exit(1); }
  console.log(`[${label}] Replacing at char ${idx}`);
  return src.slice(0, idx) + replacement + src.slice(idx + needle.length);
}

// Shorthand for building NL-aware anchors
const nl = NL;

// ═══════════════════════════════════════════════════════════════════════════
// Step 1 — Remove Block 1: ARR_MSQ through WEEKLY_TASKS
// ═══════════════════════════════════════════════════════════════════════════
html = removeBetween(html,
  `${nl}// ─── ARR MSQ ──────────────────────────────────────────────────────────────${nl}`,
  `${nl}const DAILY_STAMP_KEY`,
  'Block1-MainData'
);

// ═══════════════════════════════════════════════════════════════════════════
// Step 2 — Remove Block 2: MSQ_UNLOCK_MARKERS, CLASS_UNLOCK_MARKERS, MSQ_FEATURE_MARKERS
// ═══════════════════════════════════════════════════════════════════════════
html = removeBetween(html,
  `${nl}const MSQ_UNLOCK_MARKERS = {`,
  `${nl}${nl}// Serialise checked`,
  'Block2-Markers'
);

// ═══════════════════════════════════════════════════════════════════════════
// Step 3 — Remove Block 3: AETHER sets, AETHER_CURRENTS_DATA, console.log
// ═══════════════════════════════════════════════════════════════════════════
html = removeBetween(html,
  `${nl}const AETHER_CURRENT_MSQ_QUESTS = new Set([`,
  `${nl}function buildExpansion(`,
  'Block3-AetherData'
);

// ═══════════════════════════════════════════════════════════════════════════
// Step 4 — Remove Block 4: GC_RANKS
// ═══════════════════════════════════════════════════════════════════════════
html = removeBetween(html,
  `${nl}const GC_RANKS = [`,
  `${nl}function formatGil(`,
  'Block4-GcRanks'
);

// ═══════════════════════════════════════════════════════════════════════════
// Step 5 — Insert let declarations + loadData() after the DATA header comment
// ═══════════════════════════════════════════════════════════════════════════
const DATA_HEADER_END =
  `// ═══════════════════════════════════════════════════════════════════════════${nl}` +
  `// DATA${nl}` +
  `// ═══════════════════════════════════════════════════════════════════════════${nl}`;

const LOADER_CODE =
  `${nl}` +
  `// ─── External data — populated from ffxiv-data.json on boot ──────────────${nl}` +
  `let ATLAS,${nl}` +
  `    ARR_DUNGEON_GUIDES, ARR_TRIAL_GUIDES, ARR_RAID_GUIDES,${nl}` +
  `    HW_DUNGEON_GUIDES,  HW_TRIAL_GUIDES,  HW_RAID_GUIDES,${nl}` +
  `    SB_DUNGEON_GUIDES,  SB_TRIAL_GUIDES,  SB_RAID_GUIDES,${nl}` +
  `    SHB_DUNGEON_GUIDES, SHB_TRIAL_GUIDES, SHB_RAID_GUIDES,${nl}` +
  `    EW_DUNGEON_GUIDES,  EW_TRIAL_GUIDES,  EW_RAID_GUIDES,${nl}` +
  `    DT_DUNGEON_GUIDES,  DT_TRIAL_GUIDES,  DT_RAID_GUIDES,${nl}` +
  `    TANK_QUESTS, HEALER_QUESTS, DPS_QUESTS, DOL_QUESTS, DOH_QUESTS,${nl}` +
  `    DEEP_DUNGEON_QUESTS, ROLE_QUESTS, HILDEBRAND_QUESTS, RELIC_WEAPONS,${nl}` +
  `    DAILY_TASKS, WEEKLY_TASKS,${nl}` +
  `    AETHER_CURRENTS_DATA, AETHER_CURRENT_MSQ_QUESTS, AETHER_UNLOCK_MSQ_QUESTS,${nl}` +
  `    GC_RANKS, MSQ_UNLOCK_MARKERS, CLASS_UNLOCK_MARKERS, MSQ_FEATURE_MARKERS;${nl}` +
  `${nl}` +
  `async function loadData() {${nl}` +
  `  const resp = await fetch('ffxiv-data.json');${nl}` +
  `  if (!resp.ok) throw new Error('Failed to load ffxiv-data.json: ' + resp.status);${nl}` +
  `  const d = await resp.json();${nl}` +
  `${nl}` +
  `  ATLAS = d.atlas;${nl}` +
  `${nl}` +
  `  ARR_DUNGEON_GUIDES  = d.guides.arr.dungeons;${nl}` +
  `  ARR_TRIAL_GUIDES    = d.guides.arr.trials;${nl}` +
  `  ARR_RAID_GUIDES     = d.guides.arr.raids;${nl}` +
  `  HW_DUNGEON_GUIDES   = d.guides.hw.dungeons;${nl}` +
  `  HW_TRIAL_GUIDES     = d.guides.hw.trials;${nl}` +
  `  HW_RAID_GUIDES      = d.guides.hw.raids;${nl}` +
  `  SB_DUNGEON_GUIDES   = d.guides.sb.dungeons;${nl}` +
  `  SB_TRIAL_GUIDES     = d.guides.sb.trials;${nl}` +
  `  SB_RAID_GUIDES      = d.guides.sb.raids;${nl}` +
  `  SHB_DUNGEON_GUIDES  = d.guides.shb.dungeons;${nl}` +
  `  SHB_TRIAL_GUIDES    = d.guides.shb.trials;${nl}` +
  `  SHB_RAID_GUIDES     = d.guides.shb.raids;${nl}` +
  `  EW_DUNGEON_GUIDES   = d.guides.ew.dungeons;${nl}` +
  `  EW_TRIAL_GUIDES     = d.guides.ew.trials;${nl}` +
  `  EW_RAID_GUIDES      = d.guides.ew.raids;${nl}` +
  `  DT_DUNGEON_GUIDES   = d.guides.dt.dungeons;${nl}` +
  `  DT_TRIAL_GUIDES     = d.guides.dt.trials;${nl}` +
  `  DT_RAID_GUIDES      = d.guides.dt.raids;${nl}` +
  `${nl}` +
  `  TANK_QUESTS   = d.jobs.tanks;${nl}` +
  `  HEALER_QUESTS = d.jobs.healers;${nl}` +
  `  DPS_QUESTS    = d.jobs.dps;${nl}` +
  `  DOL_QUESTS    = d.jobs.dol;${nl}` +
  `  DOH_QUESTS    = d.jobs.doh;${nl}` +
  `${nl}` +
  `  DEEP_DUNGEON_QUESTS = d.deepDungeons;${nl}` +
  `  ROLE_QUESTS         = d.roleQuests;${nl}` +
  `  HILDEBRAND_QUESTS   = d.hildebrand;${nl}` +
  `  RELIC_WEAPONS       = d.relicWeapons;${nl}` +
  `  DAILY_TASKS         = d.dailyTasks;${nl}` +
  `  WEEKLY_TASKS        = d.weeklyTasks;${nl}` +
  `${nl}` +
  `  AETHER_CURRENTS_DATA      = d.aetherCurrents;${nl}` +
  `  AETHER_CURRENT_MSQ_QUESTS = new Set(d.aetherCurrentMsqQuests);${nl}` +
  `  AETHER_UNLOCK_MSQ_QUESTS  = new Set(d.aetherUnlockMsqQuests);${nl}` +
  `${nl}` +
  `  GC_RANKS             = d.gcRanks;${nl}` +
  `  MSQ_UNLOCK_MARKERS   = d.msqUnlockMarkers;${nl}` +
  `  CLASS_UNLOCK_MARKERS = d.classUnlockMarkers;${nl}` +
  `  MSQ_FEATURE_MARKERS  = d.msqFeatureMarkers;${nl}` +
  `}${nl}` +
  `${nl}`;

html = insertAfter(html, DATA_HEADER_END, LOADER_CODE, 'Insert-LoaderCode');

// ═══════════════════════════════════════════════════════════════════════════
// Step 6 — Modify the boot IIFE to await loadData() first
// ═══════════════════════════════════════════════════════════════════════════
html = replaceFirst(html,
  `  await loadState();${nl}`,
  `  await loadData();${nl}  await loadState();${nl}`,
  'Boot-IIFE'
);

// ── Write output ─────────────────────────────────────────────────────────────
fs.writeFileSync(htmlPath, html, 'utf8');
const stat = fs.statSync(htmlPath);
console.log(`\nWrote ${htmlPath}`);
console.log(`  Final size: ${(stat.size / 1024).toFixed(1)} KB`);

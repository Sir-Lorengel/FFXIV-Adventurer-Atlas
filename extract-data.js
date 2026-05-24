'use strict';
const fs  = require('fs');
const vm  = require('vm');
const path = require('path');

const htmlPath = path.join(__dirname, 'FFXIV - Atlas.html');
const outPath  = path.join(__dirname, 'ffxiv-data.json');

const html = fs.readFileSync(htmlPath, 'utf8');

// Pull out the first (and only) <script> block
const scriptStart = html.indexOf('<script>');
const scriptEnd   = html.indexOf('</script>');
let script = html.slice(scriptStart + 8, scriptEnd);

// We need code up to (but not including) formatGil — that is the first function
// that appears after GC_RANKS (the last data declaration we need).
// Everything between buildExpansion and formatGil is rendering-function bodies
// that are just *defined*, never invoked, so the VM won't call browser APIs.
const renderBoundary = script.indexOf('\nfunction formatGil(');
if (renderBoundary === -1) {
  console.error('Could not find rendering boundary — aborting.');
  process.exit(1);
}
let dataAndInit = script.slice(0, renderBoundary);

// In a vm context, `const` and `let` top-level declarations are block-scoped
// and NOT added to the context/sandbox object.  Replacing them with `var` at
// the start of any line (including inside functions) is safe for extraction
// purposes and makes every declaration visible on `ctx`.
dataAndInit = dataAndInit.replace(/^(\s*)(const|let) /gm, '$1var ');

// Provide lightweight stubs for browser globals that appear in function bodies.
// None of them should be *called* during the data initialisation phase.
const ctx = {
  console: {
    log:  () => {},
    warn: () => {},
    error: console.error.bind(console),
  },
  document:  new Proxy({}, { get: () => () => null }),
  window:    {},
  navigator: {},
  location:  { search: '' },
  localStorage: { getItem: () => null, setItem: () => {} },
  setTimeout:  () => {},
  clearTimeout: () => {},
  Set,
  Map,
  Date,
  JSON,
  Math,
  parseInt,
  parseFloat,
  isNaN,
  Number,
  String,
  Array,
  Object,
  Promise,
};

vm.createContext(ctx);

try {
  vm.runInContext(dataAndInit, ctx);
} catch (err) {
  console.error('VM error:', err.message);
  console.error(err.stack);
  process.exit(1);
}

// ── helper: assert a var was extracted ──────────────────────────────────────
function need(name) {
  if (ctx[name] === undefined) {
    console.error(`Missing variable after VM run: ${name}`);
    process.exit(1);
  }
  return ctx[name];
}

// ── Build the JSON payload ───────────────────────────────────────────────────
const data = {
  atlas: need('ATLAS'),

  guides: {
    arr: {
      dungeons: need('ARR_DUNGEON_GUIDES'),
      trials:   need('ARR_TRIAL_GUIDES'),
      raids:    need('ARR_RAID_GUIDES'),
    },
    hw: {
      dungeons: need('HW_DUNGEON_GUIDES'),
      trials:   need('HW_TRIAL_GUIDES'),
      raids:    need('HW_RAID_GUIDES'),
    },
    sb: {
      dungeons: need('SB_DUNGEON_GUIDES'),
      trials:   need('SB_TRIAL_GUIDES'),
      raids:    need('SB_RAID_GUIDES'),
    },
    shb: {
      dungeons: need('SHB_DUNGEON_GUIDES'),
      trials:   need('SHB_TRIAL_GUIDES'),
      raids:    need('SHB_RAID_GUIDES'),
    },
    ew: {
      dungeons: need('EW_DUNGEON_GUIDES'),
      trials:   need('EW_TRIAL_GUIDES'),
      raids:    need('EW_RAID_GUIDES'),
    },
    dt: {
      dungeons: need('DT_DUNGEON_GUIDES'),
      trials:   need('DT_TRIAL_GUIDES'),
      raids:    need('DT_RAID_GUIDES'),
    },
  },

  jobs: {
    tanks:   need('TANK_QUESTS'),
    healers: need('HEALER_QUESTS'),
    dps:     need('DPS_QUESTS'),
    dol:     need('DOL_QUESTS'),
    doh:     need('DOH_QUESTS'),
  },

  deepDungeons:  need('DEEP_DUNGEON_QUESTS'),
  roleQuests:    need('ROLE_QUESTS'),
  hildebrand:    need('HILDEBRAND_QUESTS'),
  relicWeapons:  need('RELIC_WEAPONS'),
  dailyTasks:    need('DAILY_TASKS'),
  weeklyTasks:   need('WEEKLY_TASKS'),

  aetherCurrents:         need('AETHER_CURRENTS_DATA'),
  aetherCurrentMsqQuests: [...need('AETHER_CURRENT_MSQ_QUESTS')],
  aetherUnlockMsqQuests:  [...need('AETHER_UNLOCK_MSQ_QUESTS')],

  gcRanks:            need('GC_RANKS'),
  msqUnlockMarkers:   need('MSQ_UNLOCK_MARKERS'),
  classUnlockMarkers: need('CLASS_UNLOCK_MARKERS'),
  msqFeatureMarkers:  need('MSQ_FEATURE_MARKERS'),
};

fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');

// ── Summary ──────────────────────────────────────────────────────────────────
const stat = fs.statSync(outPath);
console.log(`Wrote ${outPath}`);
console.log(`  Size              : ${(stat.size / 1024).toFixed(1)} KB`);
console.log(`  atlas expansions  : ${data.atlas.length}`);
console.log(`  guide sets        : ${Object.keys(data.guides).length} expansions`);
console.log(`  job role groups   : ${Object.keys(data.jobs).length}`);
console.log(`  aetherCurrents    : ${data.aetherCurrents.length} expansions`);
console.log(`  msqUnlockMarkers  : ${Object.keys(data.msqUnlockMarkers).length} entries`);
console.log(`  gcRanks           : ${data.gcRanks.length}`);

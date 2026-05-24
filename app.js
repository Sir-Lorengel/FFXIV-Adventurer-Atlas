'use strict';
// ═══════════════════════════════════════════════════════════════════════════
// APP — data loading, boot sequence, sidebar, settings, dark mode, scroll spy
// ═══════════════════════════════════════════════════════════════════════════

// ─── Data globals — populated from ffxiv-data.json on boot ────────────────
let ATLAS,
    ARR_DUNGEON_GUIDES, ARR_TRIAL_GUIDES, ARR_RAID_GUIDES,
    HW_DUNGEON_GUIDES,  HW_TRIAL_GUIDES,  HW_RAID_GUIDES,
    SB_DUNGEON_GUIDES,  SB_TRIAL_GUIDES,  SB_RAID_GUIDES,
    SHB_DUNGEON_GUIDES, SHB_TRIAL_GUIDES, SHB_RAID_GUIDES,
    EW_DUNGEON_GUIDES,  EW_TRIAL_GUIDES,  EW_RAID_GUIDES,
    DT_DUNGEON_GUIDES,  DT_TRIAL_GUIDES,  DT_RAID_GUIDES,
    TANK_QUESTS, HEALER_QUESTS, DPS_QUESTS, DOL_QUESTS, DOH_QUESTS,
    DEEP_DUNGEON_QUESTS, ROLE_QUESTS, HILDEBRAND_QUESTS, RELIC_WEAPONS,
    DAILY_TASKS, WEEKLY_TASKS,
    AETHER_CURRENTS_DATA, AETHER_CURRENT_MSQ_QUESTS, AETHER_UNLOCK_MSQ_QUESTS,
    GC_RANKS, MSQ_UNLOCK_MARKERS, CLASS_UNLOCK_MARKERS, MSQ_FEATURE_MARKERS;

function loadData() {
  const d = FFXIV_DATA; // injected by data.js (generated via: node build.js)

  ATLAS = d.atlas;

  ARR_DUNGEON_GUIDES  = d.guides.arr.dungeons;
  ARR_TRIAL_GUIDES    = d.guides.arr.trials;
  ARR_RAID_GUIDES     = d.guides.arr.raids;
  HW_DUNGEON_GUIDES   = d.guides.hw.dungeons;
  HW_TRIAL_GUIDES     = d.guides.hw.trials;
  HW_RAID_GUIDES      = d.guides.hw.raids;
  SB_DUNGEON_GUIDES   = d.guides.sb.dungeons;
  SB_TRIAL_GUIDES     = d.guides.sb.trials;
  SB_RAID_GUIDES      = d.guides.sb.raids;
  SHB_DUNGEON_GUIDES  = d.guides.shb.dungeons;
  SHB_TRIAL_GUIDES    = d.guides.shb.trials;
  SHB_RAID_GUIDES     = d.guides.shb.raids;
  EW_DUNGEON_GUIDES   = d.guides.ew.dungeons;
  EW_TRIAL_GUIDES     = d.guides.ew.trials;
  EW_RAID_GUIDES      = d.guides.ew.raids;
  DT_DUNGEON_GUIDES   = d.guides.dt.dungeons;
  DT_TRIAL_GUIDES     = d.guides.dt.trials;
  DT_RAID_GUIDES      = d.guides.dt.raids;

  TANK_QUESTS   = d.jobs.tanks;
  HEALER_QUESTS = d.jobs.healers;
  DPS_QUESTS    = d.jobs.dps;
  DOL_QUESTS    = d.jobs.dol;
  DOH_QUESTS    = d.jobs.doh;

  DEEP_DUNGEON_QUESTS = d.deepDungeons;
  ROLE_QUESTS         = d.roleQuests;
  HILDEBRAND_QUESTS   = d.hildebrand;
  RELIC_WEAPONS       = d.relicWeapons;
  DAILY_TASKS         = d.dailyTasks;
  WEEKLY_TASKS        = d.weeklyTasks;

  AETHER_CURRENTS_DATA      = d.aetherCurrents;
  AETHER_CURRENT_MSQ_QUESTS = new Set(d.aetherCurrentMsqQuests);
  AETHER_UNLOCK_MSQ_QUESTS  = new Set(d.aetherUnlockMsqQuests);

  GC_RANKS             = d.gcRanks;
  MSQ_UNLOCK_MARKERS   = d.msqUnlockMarkers;
  CLASS_UNLOCK_MARKERS = d.classUnlockMarkers;
  MSQ_FEATURE_MARKERS  = d.msqFeatureMarkers;
}

const root = document.getElementById('atlas-body');

// ─── Expansion name lookup ─────────────────────────────────────────────────
const EXP_NAMES = {
  arr: 'A Realm Reborn',
  hw:  'Heavensward',
  sb:  'Stormblood',
  shb: 'Shadowbringers',
  ew:  'Endwalker',
  dt:  'Dawntrail',
};

// ─── Dark mode ────────────────────────────────────────────────────────────
const DARK_MODE_KEY = 'ffxiv-atlas-dark-mode';

function applyDarkMode(on) {
  document.body.classList.toggle('hydaelyn-night', on);
  const toggle = document.getElementById('settings-dark-mode');
  if (toggle) toggle.checked = on;
  localStorage.setItem(DARK_MODE_KEY, on ? '1' : '0');
}

(function initDarkMode() {
  if (localStorage.getItem(DARK_MODE_KEY) === '1') applyDarkMode(true);
})();

// ─── Settings panel ───────────────────────────────────────────────────────
function openSettingsPanel() {
  const revealToggle = document.getElementById('settings-show-all-quests');
  if (revealToggle) revealToggle.checked = !!ui.showAllQuests;
  const darkToggle = document.getElementById('settings-dark-mode');
  if (darkToggle) darkToggle.checked = document.body.classList.contains('hydaelyn-night');
  document.getElementById('settings-overlay').classList.add('open');
  document.getElementById('settings-panel').classList.add('open');
  document.getElementById('settings-overlay').setAttribute('aria-hidden', 'false');
  document.getElementById('settings-panel').setAttribute('aria-hidden', 'false');
}

function closeSettingsPanel() {
  document.getElementById('settings-overlay').classList.remove('open');
  document.getElementById('settings-panel').classList.remove('open');
  document.getElementById('settings-overlay').setAttribute('aria-hidden', 'true');
  document.getElementById('settings-panel').setAttribute('aria-hidden', 'true');
}

document.getElementById('options-btn').onclick          = () => openSettingsPanel();
document.getElementById('settings-close').onclick       = () => closeSettingsPanel();
document.getElementById('settings-overlay').onclick     = () => closeSettingsPanel();
document.getElementById('settings-save').onclick        = () => saveToFile();
document.getElementById('settings-load').onclick        = () => loadFromFile();
document.getElementById('settings-dark-mode').addEventListener('change', e => applyDarkMode(e.target.checked));
document.getElementById('settings-show-all-quests').addEventListener('change', async e => {
  ui.showAllQuests = !!e.target.checked;
  await saveUI();
  render();
});
document.getElementById('settings-reset').onclick = async () => {
  if (!confirm('Reset all progress? This cannot be undone — consider saving first.')) return;
  checked = {};
  render();
  await saveState();
  closeSettingsPanel();
  showToast('✦ Progress reset');
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSettingsPanel(); });

document.getElementById('expand-all-btn').onclick = async () => {
  document.querySelectorAll('.section[data-section]').forEach(sec => {
    ui.open[sec.dataset.section] = true;
    sec.classList.add('open');
  });
  document.querySelectorAll('.guide-dungeon[data-guide]').forEach(gd => {
    ui.open[gd.dataset.guide] = true;
    gd.classList.add('open');
  });
  await saveUI();
};

document.getElementById('collapse-all-btn').onclick = async () => {
  document.querySelectorAll('.section[data-section]').forEach(sec => {
    ui.open[sec.dataset.section] = false;
    sec.classList.remove('open');
  });
  document.querySelectorAll('.guide-dungeon[data-guide]').forEach(gd => {
    ui.open[gd.dataset.guide] = false;
    gd.classList.remove('open');
  });
  await saveUI();
};

// ─── Sidebar clock ────────────────────────────────────────────────────────
(function() {
  const dateEl = document.querySelector('#sidebar-datetime .dt-date');
  const timeEl = document.querySelector('#sidebar-datetime .dt-time');
  function tick() {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    timeEl.textContent = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  setInterval(tick, 1000);
})();

// ─── Sidebar nav ──────────────────────────────────────────────────────────
function makeSidebarLink(href, accentVar, label) {
  const link = document.createElement('a');
  link.className = 'sidebar-link';
  link.href = href;
  link.style.cssText = `--link-accent: var(${accentVar})`;
  const dot = document.createElement('span');
  dot.className = 'sidebar-dot';
  link.appendChild(dot);
  link.appendChild(document.createTextNode(label));
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.getElementById(href.slice(1));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  return link;
}

function buildSidebarNav() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  // Expansion links
  ATLAS.forEach(exp => {
    nav.appendChild(makeSidebarLink('#exp-' + exp.id, `--${exp.accent}`, EXP_NAMES[exp.id] || exp.id));
  });

  const sep = document.createElement('div');
  sep.className = 'sidebar-section-label';
  sep.style.marginTop = '10px';
  sep.textContent = 'Side Content';
  nav.appendChild(sep);

  // Role/class groups
  const roleGroups = [
    { label: 'Tank Quests', accent: '--tank', jobs: [
      { href: '#job-pld', text: 'Paladin' },
      { href: '#job-war', text: 'Warrior' },
      { href: '#job-drk', text: 'Dark Knight' },
      { href: '#job-gnb', text: 'Gunbreaker' },
    ]},
    { label: 'Healer Quests', accent: '--healer', jobs: [
      { href: '#job-whm', text: 'White Mage' },
      { href: '#job-acn', text: 'Arcanist' },
      { href: '#job-sch', text: 'Scholar' },
      { href: '#job-ast', text: 'Astrologian' },
      { href: '#job-sge', text: 'Sage' },
    ]},
    { label: 'DPS Quests', accent: '--dps', jobs: [
      { href: '#job-mnk', text: 'Monk' },
      { href: '#job-drg', text: 'Dragoon' },
      { href: '#job-nin', text: 'Ninja' },
      { href: '#job-sam', text: 'Samurai' },
      { href: '#job-rpr', text: 'Reaper' },
      { href: '#job-vpr', text: 'Viper' },
      { href: '#job-brd', text: 'Bard' },
      { href: '#job-mch', text: 'Machinist' },
      { href: '#job-dnc', text: 'Dancer' },
      { href: '#job-blm', text: 'Black Mage' },
      { href: '#job-smn', text: 'Summoner' },
      { href: '#job-rdm', text: 'Red Mage' },
      { href: '#job-blu', text: 'Blue Mage' },
      { href: '#job-pct', text: 'Pictomancer' },
    ]},
  ];

  const makeCollapsibleGroup = (label, accent, children) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'sidebar-guide-group';
    wrapper.style.cssText = `--guide-accent: var(${accent})`;
    const title = document.createElement('div');
    title.className = 'sidebar-guide-title';
    const chev = document.createElement('span');
    chev.className = 'guide-chev';
    chev.textContent = '▶';
    title.appendChild(chev);
    title.appendChild(document.createTextNode(label));
    title.addEventListener('click', () => wrapper.classList.toggle('open'));
    const childWrap = document.createElement('div');
    childWrap.className = 'sidebar-guide-children';
    children.forEach(c => childWrap.appendChild(c));
    wrapper.appendChild(title);
    wrapper.appendChild(childWrap);
    return wrapper;
  };

  roleGroups.forEach(group => {
    nav.appendChild(makeCollapsibleGroup(
      group.label, group.accent,
      group.jobs.map(j => makeSidebarLink(j.href, group.accent, j.text))
    ));
  });

  const discipleGroups = [
    { label: 'Disciple of the Land', accent: '--dol', jobs: [
      { href: '#job-min', text: 'Miner' },
      { href: '#job-btn', text: 'Botanist' },
      { href: '#job-fsh', text: 'Fisher' },
    ]},
    { label: 'Disciple of the Hand', accent: '--doh', jobs: [
      { href: '#job-crp', text: 'Carpenter' },
      { href: '#job-bsm', text: 'Blacksmith' },
      { href: '#job-arm', text: 'Armorer' },
      { href: '#job-gsm', text: 'Goldsmith' },
      { href: '#job-ltw', text: 'Leatherworker' },
      { href: '#job-wvr', text: 'Weaver' },
      { href: '#job-alc', text: 'Alchemist' },
      { href: '#job-cul', text: 'Culinarian' },
    ]},
  ];

  discipleGroups.forEach(group => {
    nav.appendChild(makeCollapsibleGroup(
      group.label, group.accent,
      group.jobs.map(j => makeSidebarLink(j.href, group.accent, j.text))
    ));
  });

  // Role Quests group
  nav.appendChild(makeCollapsibleGroup('Role Quests', '--dps', [
    makeSidebarLink('#exp-role-tank',   '--tank',   'Tank Role Quests'),
    makeSidebarLink('#exp-role-healer', '--healer', 'Healer Role Quests'),
    makeSidebarLink('#exp-role-melee',  '--dps',    'Melee DPS Role Quests'),
    makeSidebarLink('#exp-role-ranged', '--dps',    'Ranged DPS Role Quests'),
  ]));

  // Aether Currents group — built after data is loaded so AETHER_CURRENTS_DATA is available
  nav.appendChild(makeCollapsibleGroup(
    'Aether Currents', '--dt',
    AETHER_CURRENTS_DATA.map(exp => makeSidebarLink(`#exp-aether-${exp.accent}`, `--${exp.accent}`, exp.label))
  ));

  nav.appendChild(makeSidebarLink('#exp-deep',  '--recur', 'Deep Dungeons'));
  nav.appendChild(makeSidebarLink('#exp-hildi', '--recur', 'Hildebrand Quests'));
  nav.appendChild(makeSidebarLink('#exp-relic', '--recur', 'Relic Weapons'));
  nav.appendChild(makeSidebarLink('#exp-recur', '--recur', 'Task Log'));

  const sep2 = document.createElement('div');
  sep2.className = 'sidebar-section-label';
  sep2.style.marginTop = '10px';
  sep2.textContent = 'Guides';
  nav.appendChild(sep2);

  const guideGroups = [
    { label: 'A Realm Reborn', accent: '--arr', entries: [
      { href: '#guide-dungeons',    text: 'Dungeons' },
      { href: '#guide-trials',      text: 'Trials'   },
      { href: '#guide-raids',       text: 'Raids'    },
    ]},
    { label: 'Heavensward', accent: '--hw', entries: [
      { href: '#guide-hw-dungeons', text: 'Dungeons' },
      { href: '#guide-hw-trials',   text: 'Trials'   },
      { href: '#guide-hw-raids',    text: 'Raids'    },
    ]},
    { label: 'Stormblood', accent: '--sb', entries: [
      { href: '#guide-sb-dungeons', text: 'Dungeons' },
      { href: '#guide-sb-trials',   text: 'Trials'   },
      { href: '#guide-sb-raids',    text: 'Raids'    },
    ]},
    { label: 'Shadowbringers', accent: '--shb', entries: [
      { href: '#guide-shb-dungeons', text: 'Dungeons' },
      { href: '#guide-shb-trials',   text: 'Trials'   },
      { href: '#guide-shb-raids',    text: 'Raids'    },
    ]},
    { label: 'Endwalker', accent: '--ew', entries: [
      { href: '#guide-ew-dungeons', text: 'Dungeons' },
      { href: '#guide-ew-trials',   text: 'Trials'   },
      { href: '#guide-ew-raids',    text: 'Raids'    },
    ]},
    { label: 'Dawntrail', accent: '--dt', entries: [
      { href: '#guide-dt-dungeons', text: 'Dungeons' },
      { href: '#guide-dt-trials',   text: 'Trials'   },
      { href: '#guide-dt-raids',    text: 'Raids'    },
    ]},
  ];

  guideGroups.forEach(group => {
    nav.appendChild(makeCollapsibleGroup(
      group.label, group.accent,
      group.entries.map(e => makeSidebarLink(e.href, group.accent, e.text))
    ));
  });

}

function buildRightSidebarCurrency() {
  const wrap = document.getElementById('right-sidebar-currency');
  if (!wrap) return;

  const label = document.createElement('div');
  label.className = 'sidebar-section-label right-sidebar-section-label';
  label.textContent = 'Currency Tracker';
  wrap.appendChild(label);

  const gilLink = makeSidebarLink('#exp-gil', '--ew', 'Gil');
  const gilAmt = document.createElement('span');
  gilAmt.id = 'sidebar-gil-amount';
  gilAmt.className = 'sidebar-link-value';
  gilAmt.textContent = gilData.length ? formatGil(gilData[gilData.length - 1].amount) : '';
  gilLink.appendChild(gilAmt);
  wrap.appendChild(gilLink);

  const ventureLink = makeSidebarLink('#exp-venture', '--dt', 'Ventures');
  const ventureAmt = document.createElement('span');
  ventureAmt.id = 'sidebar-venture-amount';
  ventureAmt.className = 'sidebar-link-value';
  ventureAmt.textContent = ventureData.length ? `${ventureData[ventureData.length - 1].amount.toLocaleString()} / 65,535` : '';
  ventureLink.appendChild(ventureAmt);
  wrap.appendChild(ventureLink);

  const mgpLink = makeSidebarLink('#exp-mgp', '--shb', 'MGP');
  const mgpAmt = document.createElement('span');
  mgpAmt.id = 'sidebar-mgp-amount';
  mgpAmt.className = 'sidebar-link-value';
  mgpAmt.textContent = mgpData.length ? `${formatGil(mgpData[mgpData.length - 1].amount)} / 9.99M` : '';
  mgpLink.appendChild(mgpAmt);
  wrap.appendChild(mgpLink);

  const sealLink = makeSidebarLink('#exp-seals', '--sb', 'Company Seals');
  const sealAmt = document.createElement('span');
  sealAmt.id = 'sidebar-seal-amount';
  sealAmt.className = 'sidebar-link-value';
  const sealCap  = GC_RANKS.find(r => r.name === sealRank)?.cap || 90000;
  const sealLast = sealEntries.length ? sealEntries[sealEntries.length - 1].amount : null;
  sealAmt.textContent = sealLast !== null ? `${sealLast.toLocaleString()} / ${sealCap.toLocaleString()}` : '';
  sealLink.appendChild(sealAmt);
  wrap.appendChild(sealLink);

  const tomesLabel = document.createElement('div');
  tomesLabel.className = 'sidebar-section-label right-sidebar-section-label';
  tomesLabel.style.marginTop = '8px';
  tomesLabel.textContent = 'Allagan Tomestones';
  wrap.appendChild(tomesLabel);

  [
    { id: 'sidebar-poetics-amount',     data: poeticsData,     label: 'Poetics'     },
    { id: 'sidebar-mathematics-amount', data: mathematicsData, label: 'Mathematics' },
    { id: 'sidebar-mnomics-amount',     data: mnomicsData,     label: 'Mnomics'     },
  ].forEach(({ id, data, label }) => {
    const link = makeSidebarLink('#exp-tomestones', '--hw', label);
    const amt = document.createElement('span');
    amt.id = id;
    amt.className = 'sidebar-link-value';
    const last = data.length ? data[data.length - 1].amount : null;
    amt.textContent = last !== null ? `${last.toLocaleString()} / 2,000` : '';
    link.appendChild(amt);
    wrap.appendChild(link);
  });

  const pvpLabel = document.createElement('div');
  pvpLabel.className = 'sidebar-section-label right-sidebar-section-label';
  pvpLabel.style.marginTop = '8px';
  pvpLabel.textContent = 'PvP';
  wrap.appendChild(pvpLabel);

  [
    { id: 'sidebar-wolf-mark-amount',      data: wolfMarkData,      label: 'Wolf Mark'      },
    { id: 'sidebar-trophy-crystal-amount', data: trophyCrystalData, label: 'Trophy Crystal' },
  ].forEach(({ id, data, label }) => {
    const link = makeSidebarLink('#exp-pvp', '--crimson', label);
    const amt = document.createElement('span');
    amt.id = id;
    amt.className = 'sidebar-link-value';
    const last = data.length ? data[data.length - 1].amount : null;
    amt.textContent = last !== null ? `${last.toLocaleString()} / 20,000` : '';
    link.appendChild(amt);
    wrap.appendChild(link);
  });
}

// ─── Activity tracker collapse ─────────────────────────────────────────────
function initActivityTracker() {
  const header = document.getElementById('activity-graph-header');
  const body   = document.getElementById('activity-graph-body');
  const chev   = document.getElementById('activity-chev');
  if (!header || !body || !chev) return;

  const applyState = expanded => {
    body.classList.toggle('collapsed', !expanded);
    chev.classList.toggle('open', expanded);
    ui.activityExpanded = expanded;
  };

  applyState(ui.activityExpanded !== false);
  header.addEventListener('click', () => {
    applyState(body.classList.contains('collapsed'));
    saveUI();
  });
}

// ─── Scroll spy ───────────────────────────────────────────────────────────
function initScrollSpy() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const link = document.querySelector(`.sidebar-link[href="#${entry.target.id}"]`);
      if (link) link.classList.toggle('active', entry.isIntersecting);
    });
  }, { rootMargin: '-8% 0px -80% 0px' });

  const ids = [
    ...ATLAS.map(exp => 'exp-' + exp.id),
    'exp-deep', 'exp-hildi', 'exp-relic', 'exp-recur',
    ...AETHER_CURRENTS_DATA.map(exp => `exp-aether-${exp.accent}`),
    'job-pld', 'job-war', 'job-drk', 'job-gnb',
    'job-whm', 'job-acn', 'job-sch', 'job-ast', 'job-sge',
    'job-mnk', 'job-drg', 'job-nin', 'job-sam', 'job-rpr', 'job-vpr',
    'job-brd', 'job-mch', 'job-dnc', 'job-blm', 'job-smn', 'job-rdm', 'job-blu', 'job-pct',
    'job-min', 'job-btn', 'job-fsh',
    'job-crp', 'job-bsm', 'job-arm', 'job-gsm', 'job-ltw', 'job-wvr', 'job-alc', 'job-cul',
    'guide-dungeons',    'guide-trials',    'guide-raids',
    'guide-hw-dungeons', 'guide-hw-trials', 'guide-hw-raids',
    'guide-sb-dungeons', 'guide-sb-trials', 'guide-sb-raids',
    'guide-shb-dungeons','guide-shb-trials','guide-shb-raids',
    'guide-ew-dungeons', 'guide-ew-trials', 'guide-ew-raids',
    'guide-dt-dungeons', 'guide-dt-trials', 'guide-dt-raids',
    'exp-gil', 'exp-mgp', 'exp-venture', 'exp-seals', 'exp-tomestones', 'exp-pvp',
  ];

  ids.forEach(id => {
    const card = document.getElementById(id);
    if (card) observer.observe(card);
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────
(async () => {
  loadData();
  await loadState();
  loadActivity();
  checkAutoReset();
  scheduleDailyReset();
  scheduleWeeklyReset();
  build();
  buildSidebarNav();
  buildRightSidebarCurrency();
  initSidebarSearch();
  syncDates();
  render();
  renderActivityGraph();
  initActivityTracker();
  initScrollSpy();
})();

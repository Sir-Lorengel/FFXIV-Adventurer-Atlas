'use strict';
// ═══════════════════════════════════════════════════════════════════════════
// SAVE STATE — storage keys, state variables, persistence, activity tracking
// ═══════════════════════════════════════════════════════════════════════════

const DAILY_STAMP_KEY  = 'ffxiv-atlas-daily-stamp';
const WEEKLY_STAMP_KEY = 'ffxiv-atlas-weekly-stamp';
const STATE_KEY        = 'ffxiv-msq-atlas-v6';
const UI_KEY           = 'ffxiv-msq-atlas-ui-v6';
const DATES_KEY        = 'ffxiv-msq-atlas-dates-v1';
const ACTIVITY_KEY     = 'ffxiv-atlas-activity-v1';
const GIL_KEY              = 'ffxiv-atlas-gil-v1';
const MGP_KEY              = 'ffxiv-atlas-mgp-v1';
const VENTURE_KEY          = 'ffxiv-atlas-venture-v1';
const SEAL_KEY             = 'ffxiv-atlas-seals-v1';
const SEAL_RANK_KEY        = 'ffxiv-atlas-seals-rank-v1';
const POETICS_KEY          = 'ffxiv-atlas-poetics-v1';
const MATHEMATICS_KEY      = 'ffxiv-atlas-mathematics-v1';
const MNOMICS_KEY          = 'ffxiv-atlas-mnomics-v1';
const WOLF_MARK_KEY        = 'ffxiv-atlas-wolf-mark-v1';
const TROPHY_CRYSTAL_KEY   = 'ffxiv-atlas-trophy-crystal-v1';

let checked     = {};
let ui          = { open: {} };
let dates       = {};
let activityData = {};
let gilData          = [];
let mgpData          = [];
let ventureData      = [];
let sealEntries      = [];
let sealRank         = 'Captain';
let poeticsData      = [];
let mathematicsData  = [];
let mnomicsData      = [];
let wolfMarkData     = [];
let trophyCrystalData = [];

// ─── Date utilities ───────────────────────────────────────────────────────

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function localDateTimeStr(d = new Date()) {
  return `${localDateStr(d)}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// FFXIV server day/week stamps — daily resets at 15:00 UTC, weekly at Tuesday 08:00 UTC
function ffxivDailyStamp() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (now.getUTCHours() < 15) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function ffxivWeeklyStamp() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let daysSinceTue = (now.getUTCDay() - 2 + 7) % 7;
  if (daysSinceTue === 0 && now.getUTCHours() < 8) daysSinceTue = 7;
  d.setUTCDate(d.getUTCDate() - daysSinceTue);
  return d.toISOString().slice(0, 10);
}

// ─── Storage abstraction (localStorage or Neutralino) ─────────────────────

const store = {
  async get(key) {
    if (window.Neutralino && window.Neutralino.storage) {
      try { const r = await window.Neutralino.storage.getData(key); return r; }
      catch { return null; }
    }
    return localStorage.getItem(key) ?? null;
  },
  async set(key, value) {
    if (window.Neutralino && window.Neutralino.storage) {
      try { await window.Neutralino.storage.setData(key, value); return; } catch {}
    }
    localStorage.setItem(key, value);
  }
};

// ─── Load / save ─────────────────────────────────────────────────────────

async function loadState() {
  const raw = await store.get(STATE_KEY);
  if (raw) { try { checked = JSON.parse(raw); } catch { checked = {}; } }
  const uiRaw = await store.get(UI_KEY);
  if (uiRaw) { try { ui = JSON.parse(uiRaw); } catch {} }
  if (!ui.open) ui.open = {};
  const dRaw = await store.get(DATES_KEY);
  if (dRaw) { try { dates = JSON.parse(dRaw); } catch { dates = {}; } }
  const gilRaw = await store.get(GIL_KEY);
  if (gilRaw) { try { gilData = JSON.parse(gilRaw); } catch { gilData = []; } }
  const mgpRaw = await store.get(MGP_KEY);
  if (mgpRaw) { try { mgpData = JSON.parse(mgpRaw); } catch { mgpData = []; } }
  const ventureRaw = await store.get(VENTURE_KEY);
  if (ventureRaw) { try { ventureData = JSON.parse(ventureRaw); } catch { ventureData = []; } }
  const sealRaw = await store.get(SEAL_KEY);
  if (sealRaw) { try { sealEntries = JSON.parse(sealRaw); } catch { sealEntries = []; } }
  const sealRankRaw = await store.get(SEAL_RANK_KEY);
  if (sealRankRaw) sealRank = sealRankRaw;
  const poeticsRaw = await store.get(POETICS_KEY);
  if (poeticsRaw) { try { poeticsData = JSON.parse(poeticsRaw); } catch { poeticsData = []; } }
  const mathRaw = await store.get(MATHEMATICS_KEY);
  if (mathRaw) { try { mathematicsData = JSON.parse(mathRaw); } catch { mathematicsData = []; } }
  const mnomicsRaw = await store.get(MNOMICS_KEY);
  if (mnomicsRaw) { try { mnomicsData = JSON.parse(mnomicsRaw); } catch { mnomicsData = []; } }
  const wolfMarkRaw = await store.get(WOLF_MARK_KEY);
  if (wolfMarkRaw) { try { wolfMarkData = JSON.parse(wolfMarkRaw); } catch { wolfMarkData = []; } }
  const trophyRaw = await store.get(TROPHY_CRYSTAL_KEY);
  if (trophyRaw) { try { trophyCrystalData = JSON.parse(trophyRaw); } catch { trophyCrystalData = []; } }
}

let autosaveTimer = null;
function flashAutosave() {
  const el = document.getElementById('autosave-status');
  if (!el) return;
  el.classList.add('show');
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

async function saveState() { await store.set(STATE_KEY, JSON.stringify(checked)); flashAutosave(); }
async function saveUI()    { await store.set(UI_KEY,    JSON.stringify(ui)); }
async function saveDates() { await store.set(DATES_KEY, JSON.stringify(dates)); }

// ─── File-based save / load ───────────────────────────────────────────────

function buildSavePayload() {
  return JSON.stringify({ version: 1, checked, ui, dates, activityData, gilData, mgpData, ventureData, sealEntries, sealRank, poeticsData, mathematicsData, mnomicsData, wolfMarkData, trophyCrystalData }, null, 2);
}

function saveFileNameWithIsoPrefix() {
  const iso = new Date().toISOString().replace(/:/g, '-');
  return `${iso}_ffxiv-atlas-save.json`;
}

function currentHtmlDirectoryFallback() {
  if (location.protocol !== 'file:') return null;
  const path = decodeURIComponent(location.pathname || '');
  const winPath = path.replace(/^\/([A-Za-z]:)/, '$1');
  const idx = Math.max(winPath.lastIndexOf('/'), winPath.lastIndexOf('\\'));
  return idx >= 0 ? winPath.slice(0, idx) : null;
}

async function saveToFile() {
  const payload = buildSavePayload();
  const fileName = saveFileNameWithIsoPrefix();

  try {
    if (window.Neutralino && window.Neutralino.filesystem && window.Neutralino.os) {
      let baseDir = '';
      try { baseDir = await window.Neutralino.os.getPath('current'); } catch {}
      if (!baseDir) baseDir = currentHtmlDirectoryFallback() || '';
      if (baseDir) {
        const sep = (baseDir.includes('\\') || /^[A-Za-z]:/.test(baseDir)) ? '\\' : '/';
        const filePath = `${baseDir}${baseDir.endsWith('/') || baseDir.endsWith('\\') ? '' : sep}${fileName}`;
        await window.Neutralino.filesystem.writeFile(filePath, payload);
        showToast(`Progress saved: ${fileName}`);
        return;
      }
    }
  } catch {}

  const blob = new Blob([payload], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast(`Progress saved: ${fileName}`);
}

function loadFromFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.version === 1 && data.checked) {
          checked = data.checked;
          if (data.ui) ui = data.ui;
          if (!ui.open) ui.open = {};
          if (data.dates) dates = data.dates;
          if (data.activityData) {
            activityData = data.activityData;
            localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activityData));
          }
          if (data.gilData) { gilData = data.gilData; store.set(GIL_KEY, JSON.stringify(gilData)); }
          if (data.mgpData) { mgpData = data.mgpData; store.set(MGP_KEY, JSON.stringify(mgpData)); }
          if (data.ventureData) { ventureData = data.ventureData; store.set(VENTURE_KEY, JSON.stringify(ventureData)); }
          if (data.sealEntries) { sealEntries = data.sealEntries; store.set(SEAL_KEY, JSON.stringify(sealEntries)); }
          if (data.poeticsData)     { poeticsData      = data.poeticsData;      store.set(POETICS_KEY,        JSON.stringify(poeticsData)); }
          if (data.mathematicsData) { mathematicsData  = data.mathematicsData;  store.set(MATHEMATICS_KEY,    JSON.stringify(mathematicsData)); }
          if (data.mnomicsData)     { mnomicsData      = data.mnomicsData;      store.set(MNOMICS_KEY,        JSON.stringify(mnomicsData)); }
          if (data.wolfMarkData)    { wolfMarkData     = data.wolfMarkData;     store.set(WOLF_MARK_KEY,      JSON.stringify(wolfMarkData)); }
          if (data.trophyCrystalData) { trophyCrystalData = data.trophyCrystalData; store.set(TROPHY_CRYSTAL_KEY, JSON.stringify(trophyCrystalData)); }
          if (data.sealRank) {
            sealRank = data.sealRank;
            store.set(SEAL_RANK_KEY, sealRank);
            const sel = document.getElementById('seal-rank-select');
            if (sel) sel.value = sealRank;
            const badge = document.getElementById('seal-cap-badge');
            if (badge) { const cap = GC_RANKS.find(r => r.name === sealRank)?.cap || 90000; badge.textContent = `Cap: ${cap.toLocaleString()}`; }
          }
        } else {
          checked = data;
        }
        document.querySelectorAll('.section').forEach(s => {
          s.classList.toggle('open', !!ui.open[s.dataset.section]);
        });
        syncDates();
        render();
        renderActivityGraph();
        const activeGilBtn = document.querySelector('#exp-gil .gil-range-btn.active');
        renderGilGraph(activeGilBtn ? activeGilBtn.dataset.range : '30d');
        const activeMgpBtn = document.querySelector('#exp-mgp .gil-range-btn.active');
        renderMgpGraph(activeMgpBtn ? activeMgpBtn.dataset.range : '30d');
        const activeVentureBtn = document.querySelector('#exp-venture .gil-range-btn.active');
        renderVentureGraph(activeVentureBtn ? activeVentureBtn.dataset.range : '30d');
        const activeSealsBtn = document.querySelector('#exp-seals .gil-range-btn.active');
        renderSealGraph(activeSealsBtn ? activeSealsBtn.dataset.range : '30d');
        const activePoeticBtn = document.querySelector('#exp-tomestones .poetics-range-row .gil-range-btn.active');
        renderPoeticsGraph(activePoeticBtn ? activePoeticBtn.dataset.range : '30d');
        const activeMathBtn = document.querySelector('#exp-tomestones .mathematics-range-row .gil-range-btn.active');
        renderMathematicsGraph(activeMathBtn ? activeMathBtn.dataset.range : '30d');
        const activeMnomicsBtn = document.querySelector('#exp-tomestones .mnomics-range-row .gil-range-btn.active');
        renderMnomicsGraph(activeMnomicsBtn ? activeMnomicsBtn.dataset.range : '30d');
        const activeWolfBtn = document.querySelector('#exp-pvp .wolf-mark-range-row .gil-range-btn.active');
        renderWolfMarkGraph(activeWolfBtn ? activeWolfBtn.dataset.range : '30d');
        const activeTrophyBtn = document.querySelector('#exp-pvp .trophy-crystal-range-row .gil-range-btn.active');
        renderTrophyCrystalGraph(activeTrophyBtn ? activeTrophyBtn.dataset.range : '30d');
        const gilSidebar = document.getElementById('sidebar-gil-amount');
        if (gilSidebar && gilData.length) gilSidebar.textContent = formatGil(gilData[gilData.length - 1].amount);
        const mgpSidebar = document.getElementById('sidebar-mgp-amount');
        if (mgpSidebar && mgpData.length) mgpSidebar.textContent = `${formatGil(mgpData[mgpData.length - 1].amount)} / 9.99M`;
        const ventureSidebar = document.getElementById('sidebar-venture-amount');
        if (ventureSidebar && ventureData.length) ventureSidebar.textContent = `${ventureData[ventureData.length - 1].amount.toLocaleString()} / 65,535`;
        const sealSidebar = document.getElementById('sidebar-seal-amount');
        if (sealSidebar) {
          const loadedCap = GC_RANKS.find(r => r.name === sealRank)?.cap || 90000;
          const loadedLast = sealEntries.length ? sealEntries[sealEntries.length - 1].amount : null;
          sealSidebar.textContent = loadedLast !== null ? `${loadedLast.toLocaleString()} / ${loadedCap.toLocaleString()}` : `— / ${loadedCap.toLocaleString()}`;
        }
        const poeticsSidebar = document.getElementById('sidebar-poetics-amount');
        if (poeticsSidebar) poeticsSidebar.textContent = poeticsData.length ? `${poeticsData[poeticsData.length-1].amount.toLocaleString()} / 2,000` : '';
        const mathSidebar = document.getElementById('sidebar-mathematics-amount');
        if (mathSidebar) mathSidebar.textContent = mathematicsData.length ? `${mathematicsData[mathematicsData.length-1].amount.toLocaleString()} / 2,000` : '';
        const mnomicsSidebar = document.getElementById('sidebar-mnomics-amount');
        if (mnomicsSidebar) mnomicsSidebar.textContent = mnomicsData.length ? `${mnomicsData[mnomicsData.length-1].amount.toLocaleString()} / 2,000` : '';
        const wolfSidebar = document.getElementById('sidebar-wolf-mark-amount');
        if (wolfSidebar) wolfSidebar.textContent = wolfMarkData.length ? `${wolfMarkData[wolfMarkData.length-1].amount.toLocaleString()} / 20,000` : '';
        const trophySidebar = document.getElementById('sidebar-trophy-crystal-amount');
        if (trophySidebar) trophySidebar.textContent = trophyCrystalData.length ? `${trophyCrystalData[trophyCrystalData.length-1].amount.toLocaleString()} / 20,000` : '';
        showToast('✦ Progress loaded successfully');
      } catch {
        showToast('✦ Could not read save file — is it the correct format?');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ─── Activity tracking ────────────────────────────────────────────────────

function loadActivity() {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (raw) activityData = JSON.parse(raw);
  } catch { activityData = {}; }
}

function logActivity(n = 1) {
  const today = localDateStr();
  activityData[today] = (activityData[today] || 0) + n;
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activityData));
  renderActivityGraph();
}

function calcStreak() {
  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (activityData[localDateStr(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function renderActivityGraph() {
  const svg = document.getElementById('activity-svg');
  if (!svg) return;

  const CELL = 9, GAP = 2, STEP = CELL + GAP;
  const WEEKS = 17, DAYS = 7;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = localDateStr(today);

  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - 16 * 7);

  const ACTIVITY_SCALE_FLOOR = 20;
  const ACTIVITY_SCALE_CEIL  = 200;
  const ACTIVITY_COLORS = [
    '#f1e4c8', '#ead19f', '#e2bb78', '#d8a255', '#cc8840',
    '#be7032', '#ad5a2a', '#9a4724', '#86351e', '#7a2418'
  ];

  const recentCounts = [];
  for (let i = 0; i < 56; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const c = activityData[localDateStr(d)] || 0;
    if (c > 0) recentCounts.push(c);
  }

  const quantile = (vals, q) => {
    if (!vals.length) return 0;
    const sorted = [...vals].sort((a, b) => a - b);
    return sorted[Math.floor((sorted.length - 1) * q)];
  };
  const avg = recentCounts.length ? (recentCounts.reduce((s, v) => s + v, 0) / recentCounts.length) : 0;
  const p85 = quantile(recentCounts, 0.85);
  const adaptiveRaw = Math.max(avg * 3, p85 * 1.25, ACTIVITY_SCALE_FLOOR);
  const ACTIVITY_SCALE_MAX = Math.max(
    ACTIVITY_SCALE_FLOOR,
    Math.min(ACTIVITY_SCALE_CEIL, Math.ceil(adaptiveRaw / 5) * 5)
  );

  const colorForCount = count => {
    if (count <= 0) return 'rgba(42,29,16,0.10)';
    const c = Math.min(count, ACTIVITY_SCALE_MAX);
    const bucket = Math.max(1, Math.min(10, Math.ceil((c / ACTIVITY_SCALE_MAX) * 10)));
    return ACTIVITY_COLORS[bucket - 1];
  };

  let html = '';
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < DAYS; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const dateStr = localDateStr(date);
      const isFuture = date > today;
      const isToday  = dateStr === todayStr;
      const count    = isFuture ? 0 : (activityData[dateStr] || 0);
      const x = w * STEP, y = d * STEP;
      const fill = isFuture ? 'rgba(42,29,16,0.04)' : colorForCount(count);
      const ring  = isToday ? ` stroke="#a87930" stroke-width="1.5"` : '';
      const scaleCount = Math.min(count, ACTIVITY_SCALE_MAX);
      const plus = count > ACTIVITY_SCALE_MAX ? '+' : '';
      const label = isFuture ? '' : `<title>${dateStr} · ${count} check${count !== 1 ? 's' : ''} · scale ${scaleCount}${plus}/${ACTIVITY_SCALE_MAX}</title>`;
      html += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="1.5" fill="${fill}"${ring}>${label}</rect>`;
    }
  }
  svg.innerHTML = html;

  const streakEl = document.getElementById('activity-streak');
  if (streakEl) {
    const s = calcStreak();
    streakEl.textContent = s > 0 ? `${s}d streak` : '';
    const scaleNote = `adaptive scale max ${ACTIVITY_SCALE_MAX}`;
    streakEl.title = s > 0 ? `${s}-day streak · ${scaleNote}` : scaleNote;
  }
}

// ─── Auto-reset / scheduling ──────────────────────────────────────────────

function checkAutoReset() {
  const curDaily = ffxivDailyStamp();
  if (localStorage.getItem(DAILY_STAMP_KEY) !== curDaily) {
    DAILY_TASKS.forEach(t => delete checked[t.id]);
    localStorage.setItem(DAILY_STAMP_KEY, curDaily);
  }
  const curWeekly = ffxivWeeklyStamp();
  if (localStorage.getItem(WEEKLY_STAMP_KEY) !== curWeekly) {
    WEEKLY_TASKS.forEach(t => delete checked[t.id]);
    localStorage.setItem(WEEKLY_STAMP_KEY, curWeekly);
  }
}

async function resetDailyTasks() {
  DAILY_TASKS.forEach(t => delete checked[t.id]);
  localStorage.setItem(DAILY_STAMP_KEY, ffxivDailyStamp());
  render(); await saveState();
  showToast('✦ Daily tasks reset');
}

async function resetWeeklyTasks() {
  WEEKLY_TASKS.forEach(t => delete checked[t.id]);
  localStorage.setItem(WEEKLY_STAMP_KEY, ffxivWeeklyStamp());
  render(); await saveState();
  showToast('✦ Weekly tasks reset');
}

function scheduleDailyReset() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 15, 0, 0, 0));
  if (now >= next) next.setUTCDate(next.getUTCDate() + 1);
  setTimeout(async () => { await resetDailyTasks(); scheduleDailyReset(); }, next - now);
}

function scheduleWeeklyReset() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 8, 0, 0, 0));
  const daysUntilTue = (2 - next.getUTCDay() + 7) % 7;
  next.setUTCDate(next.getUTCDate() + daysUntilTue);
  if (now >= next) next.setUTCDate(next.getUTCDate() + 7);
  setTimeout(async () => { await resetWeeklyTasks(); scheduleWeeklyReset(); }, next - now);
}

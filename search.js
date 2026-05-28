'use strict';
// ═══════════════════════════════════════════════════════════════════════════
// SEARCH  —  multi-word index search, all-occurrence highlights, result count
// ═══════════════════════════════════════════════════════════════════════════

// ─── Duty-type index (used by ui.js for unlock markers) ───────────────────
let dutyTypeByName = null;

function ensureDutyTypeIndex() {
  if (dutyTypeByName) return;
  dutyTypeByName = {};

  const typeForSection = sec => {
    const sid   = String(sec.id    || '').toLowerCase();
    const title = String(sec.title || '').toLowerCase();
    if (sid.includes('-tri-') || title.includes('trial')) return 'trial';
    if (sid.includes('-rai-') || title.includes('raid'))  return 'raid';
    return 'dungeon';
  };

  ATLAS.forEach(exp => {
    if (exp.patchOnly) return;
    exp.categories.forEach(cat => {
      if (cat.isMsq) return;
      cat.sections.forEach(sec => {
        const t = typeForSection(sec);
        sec.quests.forEach(q => {
          const name = normalizeQuestKey(q.name || q);
          if (name && !dutyTypeByName[name]) dutyTypeByName[name] = t;
        });
      });
    });
  });
}

function dutyTypeForName(name) {
  ensureDutyTypeIndex();
  return dutyTypeByName[normalizeQuestKey(name)] || 'unknown';
}

// ─── Unlock lookups (used by ui.js) ───────────────────────────────────────
function classUnlocks(name) {
  const all = CLASS_UNLOCK_MARKERS[normalizeQuestKey(name)] || [];
  return all.length ? all : null;
}

function questUnlocks(name) {
  const key = normalizeQuestKey(name);
  const all = [
    ...(MSQ_UNLOCK_MARKERS[key]  || []),
    ...(MSQ_FEATURE_MARKERS[key] || []),
  ];
  return all.length ? all : null;
}

// ─── Unlock marker DOM builder (used by ui.js) ────────────────────────────
function buildUnlockMarker(unlocks) {
  if (!unlocks || !unlocks.length) return null;
  const wrap = el('span', { class: 'quest-unlock' }, '↳ unlocks:');
  unlocks.forEach(entry => {
    const name = typeof entry === 'string' ? entry : entry.name;
    const t    = typeof entry === 'string' ? dutyTypeForName(name) : entry.type;
    wrap.appendChild(el('span', { class: `unlock-pill unlock-${t}` }, name));
  });
  return wrap;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH ENGINE
// ═══════════════════════════════════════════════════════════════════════════

// ─── Index ────────────────────────────────────────────────────────────────
// Map<Element, { type, text, titleEl }>
// Built once after build() populates the DOM; invalidated on demand.
let _searchIndex = null;

function buildSearchIndex() {
  _searchIndex = new Map();
  const body = document.getElementById('atlas-body');
  if (!body) return;

  body.querySelectorAll('li.quest').forEach(li => {
    const titleEl = li.querySelector('.quest-title');
    if (titleEl) _searchIndex.set(li, { type: 'quest', text: titleEl.textContent.toLowerCase(), titleEl });
  });

  body.querySelectorAll('.section[data-section]').forEach(sec => {
    const titleEl = sec.querySelector('.section-title');
    if (titleEl) _searchIndex.set(sec, { type: 'section', text: titleEl.textContent.toLowerCase(), titleEl });
  });

}

function invalidateSearchIndex() {
  _searchIndex = null;
}

// ─── Scoring ──────────────────────────────────────────────────────────────
// Returns 0 if not all words match; higher = better match.
function scoreEntry(text, words) {
  if (!words.every(w => text.includes(w))) return 0;
  const joined = words.join(' ');
  if (text === joined)          return 100;   // exact
  if (text.startsWith(joined))  return 50;    // prefix
  return 1;                                   // partial
}

// ─── Highlight all occurrences ────────────────────────────────────────────
// Walks text nodes recursively and wraps every occurrence of `word` in <mark>.
function highlightWord(el, word) {
  const walk = node => {
    if (node.nodeType === 3) {
      const val = node.nodeValue;
      const lo  = val.toLowerCase();
      if (!lo.includes(word)) return;
      const frag = document.createDocumentFragment();
      let pos = 0, cur = lo.indexOf(word, 0);
      while (cur !== -1) {
        if (cur > pos) frag.appendChild(document.createTextNode(val.slice(pos, cur)));
        const m = document.createElement('mark');
        m.textContent = val.slice(cur, cur + word.length);
        frag.appendChild(m);
        pos = cur + word.length;
        cur = lo.indexOf(word, pos);
      }
      if (pos < val.length) frag.appendChild(document.createTextNode(val.slice(pos)));
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === 1 && node.tagName !== 'MARK') {
      [...node.childNodes].forEach(walk);
    }
  };
  [...el.childNodes].forEach(walk);
}

function clearHighlights(root) {
  root.querySelectorAll('mark').forEach(m => m.replaceWith(document.createTextNode(m.textContent)));
  root.normalize();
}

// ─── Apply search to main body ─────────────────────────────────────────────
// Returns number of matched quests (for the result counter).
function filterMainBody(words) {
  const body = document.getElementById('atlas-body');
  if (!body) return 0;

  clearHighlights(body);

  if (!words.length) {
    body.querySelectorAll('.search-hidden').forEach(e => e.classList.remove('search-hidden'));
    body.querySelectorAll('.section[data-section]').forEach(sec =>
      sec.classList.toggle('open', !!ui.open[sec.dataset.section])
    );
    body.querySelectorAll('.guide-dungeon[data-guide]').forEach(gd =>
      gd.classList.toggle('open', !!ui.open[gd.dataset.guide])
    );
    return 0;
  }

  if (!_searchIndex) buildSearchIndex();

  // 1. Quests
  body.querySelectorAll('li.quest').forEach(li => {
    const entry = _searchIndex.get(li);
    const s = entry ? scoreEntry(entry.text, words) : 0;
    li.classList.toggle('search-hidden', s === 0);
    if (s > 0 && entry.titleEl) words.forEach(w => highlightWord(entry.titleEl, w));
  });

  // 2. Sections — if the section title matches, reveal all its quests
  body.querySelectorAll('.section[data-section]').forEach(sec => {
    const entry = _searchIndex.get(sec);
    const s = entry ? scoreEntry(entry.text, words) : 0;
    if (s > 0) {
      sec.querySelectorAll('li.quest').forEach(li => {
        li.classList.remove('search-hidden');
        const qEntry = _searchIndex.get(li);
        if (qEntry) words.forEach(w => highlightWord(qEntry.titleEl, w));
      });
      sec.classList.remove('search-hidden');
      sec.classList.add('open');
      if (entry.titleEl) words.forEach(w => highlightWord(entry.titleEl, w));
    } else {
      const hasVisible = [...sec.querySelectorAll('li.quest')].some(li => !li.classList.contains('search-hidden'));
      sec.classList.toggle('search-hidden', !hasVisible);
      if (hasVisible) sec.classList.add('open');
    }
  });

  // 3. Hide all guide sections — guides are excluded from search
  body.querySelectorAll('.guide-dungeon').forEach(gd => gd.classList.add('search-hidden'));

  // 4. Categories — visible if any quest section child is visible
  body.querySelectorAll('.category').forEach(cat => {
    const vis = (
      [...cat.querySelectorAll('.section')].some(s => !s.classList.contains('search-hidden')) ||
      [...cat.querySelectorAll('li.quest')].some(li => !li.classList.contains('search-hidden'))
    );
    cat.classList.toggle('search-hidden', !vis);
  });

  // 5. Expansions — visible if any category is visible

  body.querySelectorAll('.expansion').forEach(exp => {
    const vis = [...exp.querySelectorAll('.category')].some(c => !c.classList.contains('search-hidden'));
    exp.classList.toggle('search-hidden', !vis);
  });

  return body.querySelectorAll('li.quest:not(.search-hidden)').length;
}

// ─── Sidebar nav filter ────────────────────────────────────────────────────
function isBodyVisible(href) {
  if (!href || !href.startsWith('#')) return false;
  const target = document.getElementById(href.slice(1));
  return !!target && !target.classList.contains('search-hidden');
}

function filterSidebarNav(active, nav, empty) {
  nav.querySelectorAll('.sidebar-section-label').forEach(el => el.classList.toggle('search-hidden', active));
  nav.querySelectorAll('.sidebar-link-stub').forEach(stub => stub.classList.toggle('search-hidden', active));

  nav.querySelectorAll('.sidebar-link').forEach(link => {
    if (link.closest('.sidebar-guide-group')) return;
    if (!active) { link.classList.remove('search-hidden'); return; }
    link.classList.toggle('search-hidden', !isBodyVisible(link.getAttribute('href')));
  });

  nav.querySelectorAll('.sidebar-guide-group').forEach(group => {
    const isGuideGroup = group.querySelector('.sidebar-link[href^="#guide-"]');
    if (isGuideGroup) {
      group.classList.toggle('search-hidden', active);
      return;
    }
    if (!active) { group.classList.remove('search-hidden'); return; }
    let anyMatch = false;
    group.querySelectorAll('.sidebar-link').forEach(link => {
      const vis = isBodyVisible(link.getAttribute('href'));
      link.classList.toggle('search-hidden', !vis);
      if (vis) anyMatch = true;
    });
    group.classList.toggle('search-hidden', !anyMatch);
    if (anyMatch) group.classList.add('open');
  });

  const anyVisible = active && [...nav.querySelectorAll('.sidebar-link')].some(l => !l.classList.contains('search-hidden'));
  if (empty) empty.classList.toggle('visible', active && !anyVisible);
}

// ─── Result count badge ────────────────────────────────────────────────────
function setResultCount(count, active) {
  const badge = document.getElementById('search-result-count');
  if (!badge) return;
  if (!active) {
    badge.textContent = '';
    badge.hidden = true;
    return;
  }
  badge.textContent = count === 0 ? 'No matches' : `${count.toLocaleString()} result${count === 1 ? '' : 's'}`;
  badge.hidden = false;
}

// ─── Wire-up ──────────────────────────────────────────────────────────────
function initSidebarSearch() {
  const input = document.getElementById('sidebar-search');
  const nav   = document.getElementById('sidebar-nav');
  const empty = document.getElementById('sidebar-search-empty');
  if (!input || !nav) return;

  let debounceTimer = null;

  const clear = () => {
    clearTimeout(debounceTimer);
    filterMainBody([]);
    filterSidebarNav(false, nav, empty);
    setResultCount(0, false);
  };

  const runSearch = () => {
    const raw   = input.value;
    const q     = raw.trim().toLowerCase();
    const words = q.length >= 2 ? q.split(/\s+/).filter(Boolean) : [];

    if (!words.length) { clear(); return; }

    const count = filterMainBody(words);
    filterSidebarNav(true, nav, empty);
    setResultCount(count, true);
  };

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runSearch, 150);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      clearTimeout(debounceTimer);
      input.value = '';
      clear();
      input.blur();
    }
  });

  // Native clear button on type="search"
  input.addEventListener('search', () => {
    if (!input.value) {
      clearTimeout(debounceTimer);
      clear();
    }
  });
}

'use strict';
// ═══════════════════════════════════════════════════════════════════════════
// SEARCH — sidebar nav filtering, main body search + highlight, unlock markers
// ═══════════════════════════════════════════════════════════════════════════

// ─── Duty-type index ───────────────────────────────────────────────────────
// Lazily built on first call; maps normalised quest name → 'dungeon'|'trial'|'raid'
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

// ─── Unlock lookups ────────────────────────────────────────────────────────

function classUnlocks(name) {
  const all = CLASS_UNLOCK_MARKERS[normalizeQuestKey(name)] || [];
  return all.length ? all : null;
}

function questUnlocks(name) {
  const key = normalizeQuestKey(name);
  const all = [
    ...(MSQ_UNLOCK_MARKERS[key]   || []),
    ...(MSQ_FEATURE_MARKERS[key]  || []),
  ];
  return all.length ? all : null;
}

// ─── Unlock marker DOM builder ─────────────────────────────────────────────

function buildUnlockMarker(unlocks) {
  if (!unlocks || !unlocks.length) return null;
  const wrap = el('span', { class: 'quest-unlock' }, '↳ unlocks:');
  unlocks.forEach(entry => {
    const name = typeof entry === 'string' ? entry      : entry.name;
    const t    = typeof entry === 'string' ? dutyTypeForName(name) : entry.type;
    wrap.appendChild(el('span', { class: `unlock-pill unlock-${t}` }, name));
  });
  return wrap;
}

// ─── Sidebar nav filter ────────────────────────────────────────────────────
// Mirrors what filterMainBody already decided: a nav link is shown only when
// its target element in the main body is not search-hidden.

function isBodyVisible(href) {
  if (!href || !href.startsWith('#')) return false;
  const target = document.getElementById(href.slice(1));
  return !!target && !target.classList.contains('search-hidden');
}

function filterSidebarNav(q, nav, empty) {
  nav.querySelectorAll('.sidebar-section-label').forEach(el => {
    el.classList.toggle('search-hidden', !!q);
  });

  nav.querySelectorAll('.sidebar-link-stub').forEach(stub => {
    stub.classList.toggle('search-hidden', !!q);
  });

  // Flat links outside guide groups
  nav.querySelectorAll('.sidebar-link').forEach(link => {
    if (link.closest('.sidebar-guide-group')) return; // handled below
    if (!q) { link.classList.remove('search-hidden'); return; }
    link.classList.toggle('search-hidden', !isBodyVisible(link.getAttribute('href')));
  });

  // Collapsible guide groups — show group if any child target is visible
  nav.querySelectorAll('.sidebar-guide-group').forEach(group => {
    if (!q) { group.classList.remove('search-hidden'); return; }
    let groupHasMatch = false;
    group.querySelectorAll('.sidebar-link').forEach(link => {
      const visible = isBodyVisible(link.getAttribute('href'));
      link.classList.toggle('search-hidden', !visible);
      if (visible) groupHasMatch = true;
    });
    group.classList.toggle('search-hidden', !groupHasMatch);
    if (groupHasMatch) group.classList.add('open');
  });

  const anyVisible = !!q && [...nav.querySelectorAll('.sidebar-link')].some(l => !l.classList.contains('search-hidden'));
  if (empty) empty.classList.toggle('visible', !!q && !anyVisible);
}

// ─── Main body search + highlight ─────────────────────────────────────────

function filterMainBody(q) {
  const body = document.getElementById('atlas-body');
  if (!body) return;

  if (!q) {
    body.querySelectorAll('mark').forEach(m => {
      m.parentNode.replaceChild(document.createTextNode(m.textContent), m);
    });
    body.normalize();
    body.querySelectorAll('.search-hidden').forEach(e => e.classList.remove('search-hidden'));
    body.querySelectorAll('.section[data-section]').forEach(sec => {
      sec.classList.toggle('open', !!ui.open[sec.dataset.section]);
    });
    body.querySelectorAll('.guide-dungeon[data-guide]').forEach(gd => {
      gd.classList.toggle('open', !!ui.open[gd.dataset.guide]);
    });
    return;
  }

  // 1. Filter individual quests by title
  body.querySelectorAll('li.quest').forEach(quest => {
    const titleEl = quest.querySelector('.quest-title');
    if (!titleEl) { quest.classList.add('search-hidden'); return; }
    applyHighlight(titleEl, '');
    const match = titleEl.textContent.toLowerCase().includes(q);
    quest.classList.toggle('search-hidden', !match);
    if (match) applyHighlight(titleEl, q);
  });

  // 2. Filter sections: show (expanded) if title matches or has visible quests
  body.querySelectorAll('.section[data-section]').forEach(sec => {
    const titleEl = sec.querySelector('.section-title');
    if (titleEl) applyHighlight(titleEl, '');
    const titleMatch = titleEl && titleEl.textContent.toLowerCase().includes(q);
    if (titleMatch) {
      sec.querySelectorAll('li.quest').forEach(quest => {
        quest.classList.remove('search-hidden');
        const tEl = quest.querySelector('.quest-title');
        if (tEl) applyHighlight(tEl, q);
      });
      sec.classList.remove('search-hidden');
      sec.classList.add('open');
      applyHighlight(titleEl, q);
    } else {
      const hasVisible = [...sec.querySelectorAll('li.quest')].some(item => !item.classList.contains('search-hidden'));
      sec.classList.toggle('search-hidden', !hasVisible);
      if (hasVisible) sec.classList.add('open');
    }
  });

  // 3. Filter boss rows in guide dungeons
  body.querySelectorAll('.boss-row').forEach(row => {
    const nameEl = row.querySelector('.boss-name');
    if (!nameEl) { row.classList.add('search-hidden'); return; }
    applyHighlight(nameEl, '');
    const match = nameEl.textContent.toLowerCase().includes(q);
    row.classList.toggle('search-hidden', !match);
    if (match) applyHighlight(nameEl, q);
  });

  // 4. Filter guide dungeons: show (expanded) if name or any boss matches
  body.querySelectorAll('.guide-dungeon').forEach(gd => {
    const nameEl = gd.querySelector('.guide-dungeon-name');
    if (nameEl) applyHighlight(nameEl, '');
    const nameMatch = nameEl && nameEl.textContent.toLowerCase().includes(q);
    if (nameMatch) {
      gd.querySelectorAll('.boss-row').forEach(r => r.classList.remove('search-hidden'));
      gd.classList.remove('search-hidden');
      gd.classList.add('open');
      applyHighlight(nameEl, q);
    } else {
      const hasVisible = [...gd.querySelectorAll('.boss-row')].some(r => !r.classList.contains('search-hidden'));
      gd.classList.toggle('search-hidden', !hasVisible);
      if (hasVisible) gd.classList.add('open');
    }
  });

  // 5. Filter categories: show if any child section, guide-dungeon, or quest is visible
  body.querySelectorAll('.category').forEach(cat => {
    const visibleSection = [...cat.querySelectorAll('.section')].some(s => !s.classList.contains('search-hidden'));
    const visibleGuide   = [...cat.querySelectorAll('.guide-dungeon')].some(g => !g.classList.contains('search-hidden'));
    const visibleQuest   = [...cat.querySelectorAll('li.quest')].some(item => !item.classList.contains('search-hidden'));
    cat.classList.toggle('search-hidden', !visibleSection && !visibleGuide && !visibleQuest);
  });

  // 6. Filter expansion cards: show if any category is visible
  body.querySelectorAll('.expansion').forEach(exp => {
    const hasVisible = [...exp.querySelectorAll('.category')].some(c => !c.classList.contains('search-hidden'));
    exp.classList.toggle('search-hidden', !hasVisible);
  });
}

function applyHighlight(el, q) {
  el.querySelectorAll('mark').forEach(m => {
    m.parentNode.replaceChild(document.createTextNode(m.textContent), m);
  });
  el.normalize();
  if (!q) return;
  for (let i = 0; i < el.childNodes.length; i++) {
    const n = el.childNodes[i];
    if (n.nodeType !== 3) continue;
    const idx = n.nodeValue.toLowerCase().indexOf(q);
    if (idx === -1) continue;
    const val  = n.nodeValue;
    const mark = document.createElement('mark');
    mark.textContent = val.slice(idx, idx + q.length);
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createTextNode(val.slice(0, idx)));
    frag.appendChild(mark);
    frag.appendChild(document.createTextNode(val.slice(idx + q.length)));
    el.replaceChild(frag, n);
    break;
  }
}

// ─── Wire up sidebar search input ─────────────────────────────────────────

function initSidebarSearch() {
  const input = document.getElementById('sidebar-search');
  const nav   = document.getElementById('sidebar-nav');
  const empty = document.getElementById('sidebar-search-empty');
  if (!input || !nav) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    filterMainBody(q);
    filterSidebarNav(q, nav, empty);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      input.value = '';
      filterMainBody('');
      filterSidebarNav('', nav, empty);
    }
  });
}

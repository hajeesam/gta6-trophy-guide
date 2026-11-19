// Leonida Ledger — GTA 6 trophy guide & tracker.
// Plain ES module, no libraries, no network at run time except the local
// data file data/trophies.json. Progress lives in localStorage and can be
// exported to a file and imported back. Shareable views come from the URL
// hash: #filter=missable, #spoiler=on, #select=28, #tab=roadmap.

const EARNED_KEY = 'leonida-ledger-earned-v1';
const COUNTS_KEY = 'leonida-ledger-counts-v1';
const SPOILER_KEY = 'leonida-ledger-spoilers-v1';

// Numbered sources, in the order the guides cite them. Names and dates are
// shown beside every guide; links only where the address was verified.
const SOURCES = [
  { name: 'PowerPyx', title: 'GTA 6 Trophy Guide & Roadmap', url: 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/', date: 'read 19 Nov 2026' },
  { name: 'OutputLag', title: 'GTA 6 Trophy List: All 55 Trophies and Achievements', url: 'https://outputlag.com/guides/gta-6-trophy-list/', date: 'read 19 Nov 2026' },
  { name: 'KeenGamer', title: 'GTA 6 Trophy Guide & Platinum Roadmap — All 55 Trophies', url: 'https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/', date: '18 Nov 2026' },
  { name: 'Exophase', title: 'GTA VI trophy list (official list as published)', url: '', date: 'read 19 Nov 2026' },
  { name: 'PSNProfiles', title: 'GTA VI trophies (official list as published)', url: '', date: 'read 19 Nov 2026' },
  { name: 'GTABase', title: 'GTA 6 Trophies & Achievements Guide', url: 'https://www.gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series', date: '18 Nov 2026' },
  { name: 'Push Square', title: 'GTA 6 Trophy Guide & Roadmap', url: 'https://www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap', date: 'read 19 Nov 2026' },
  { name: 'PlanetGTA6', title: 'GTA 6 Trophies', url: 'https://planetgta6.com/en/gta-6-trophies/', date: '18 Nov 2026' },
  { name: 'GTA-Zone', title: 'GTA 6 Trophies & Achievements', url: 'https://gta-zone.com/news/gta-6-trophies-achievements/', date: '18 Nov 2026' },
  { name: 'Sixshore', title: 'GTA 6 Trophy and Achievement List', url: 'https://sixshore.com/gta-6/guides/trophies-and-achievements/', date: 'read 19 Nov 2026' },
  { name: 'GTA Vibes', title: 'GTA 6 Trophy List & Achievements', url: 'https://gtavibes.com/guides/gta-6-trophy-list-achievements', date: '18 Nov 2026' },
  { name: 'all.gg', title: 'Every GTA 6 PSN Trophy', url: 'https://all.gg/news/every-gta-6-psn-trophy/', date: '19 Nov 2026' },
];

// The roadmap, in earn order. Each stage lists trophy ids from trophies.json.
const ROADMAP = [
  { title: 'Stage 1 — Chapter 1: first steps', ids: [2, 3, 20, 21, 28], text: 'Play the opening mission Gone Fishing, then finish Chapter 1. Do the two easy activities while you are here — beat Cal at fishing and finish an arcade game — and above all do Lucia’s balcony meditation before the chapter ends. It is the only thing in the game that may not come back.' },
  { title: 'Stage 2 — Chapter 2: both leads playable', ids: [4, 8], text: 'Finish Chapter 2. From here both Jason and Lucia are playable, which most partner and free-roam trophies need — the last meditation spot only counts once both leads can reach it.' },
  { title: 'Stage 3 — Chapter 3: Vice City opens up', ids: [5, 9, 10], text: 'Finish Chapter 3 and its story missions. Start sampling activities and side strands as they appear; nothing here can be missed.' },
  { title: 'Stage 4 — Chapter 4: the road to the finale', ids: [6, 11, 12, 13], text: 'Finish Chapter 4 and its story missions. Before the final mission, make a separate manual save — your safety net for the ending.' },
  { title: 'Stage 5 — The final mission', ids: [7], text: 'Complete the final mission for the Gold. After the credits, free roam stays open for all cleanup.' },
  { title: 'Stage 6 — Side strands', ids: [22, 23, 24, 25, 26, 27, 29, 47], text: 'Finish the stranger strands: Andy, Kenton, Billy, Randy, Tyrone and Bret, each to its final mission. Eight finished strands earn the Strangers & Freaks Silver.' },
  { title: 'Stage 7 — Free-roam cleanup', ids: [15, 16, 17, 18, 19, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 48, 49, 50, 51, 52, 53, 54, 55], text: 'Everything that can be done after the story: stunts, shooting range, races, cards, WAiNK spots, challenges, robberies, exploration, money and the one-off moments. Work them in any order you like.' },
  { title: 'Stage 8 — 100% completion, then Platinum', ids: [14, 1], text: 'Finish the 35-task 100% checklist (A Long Road, Gold) and the Platinum pops with it. The checklist appears under Progress > Stats > 100% Completion after the story.' },
];

const FILTERS = {
  all: (t) => true,
  story: (t) => t.tags.includes('story'),
  missable: (t) => t.missable === true,
  collectible: (t) => t.tags.includes('collectible'),
  activity: (t) => t.tags.includes('activity'),
  side: (t) => t.tags.includes('side'),
  crime: (t) => t.tags.includes('crime'),
  money: (t) => t.tags.includes('money'),
  online: (t) => false, // GTA 6 has no online trophies: this filter is honestly empty.
};

let trophies = [];
let earned = new Set();
let counts = {};
let spoilersOn = false;
let revealed = new Set(); // story trophies the reader chose to reveal, this visit only
let selectedId = 28; // Positive Mental Attitude opens first: the missable one matters most.
let currentFilter = 'all';
let currentTab = 'checklist';

const $ = (id) => document.getElementById(id);

function loadState() {
  try { earned = new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]')); } catch { earned = new Set(); }
  try { counts = JSON.parse(localStorage.getItem(COUNTS_KEY) ?? '{}'); } catch { counts = {}; }
  spoilersOn = localStorage.getItem(SPOILER_KEY) === 'on';
}

function saveEarned() { localStorage.setItem(EARNED_KEY, JSON.stringify([...earned])); }
function saveCounts() { localStorage.setItem(COUNTS_KEY, JSON.stringify(counts)); }
function saveSpoilers() { localStorage.setItem(SPOILER_KEY, spoilersOn ? 'on' : 'off'); }

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function isHiddenFromReader(t) {
  return spoilersOn && t.tags.includes('story') && !earned.has(t.name) && !revealed.has(t.id);
}

function sourceLine(nums) {
  return nums.map((n) => {
    const s = SOURCES[n - 1];
    const link = s.url ? ` <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a>` : ` ${escapeHtml(s.name)}`;
    return `[${n}]${link} — ${escapeHtml(s.title)}, ${escapeHtml(s.date)}`;
  }).join('<br>');
}

function gradeBadge(t) {
  return `<span class="grade-badge grade-${t.grade}">${t.grade}</span>`;
}

function renderProgress() {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.name)).length;
  $('earnedCount').textContent = String(done);
  $('progressBar').style.width = total ? `${Math.round((done / total) * 100)}%` : '0%';
  const byGrade = (g) => trophies.filter((t) => t.grade === g && earned.has(t.name)).length;
  const totalGrade = (g) => trophies.filter((t) => t.grade === g).length;
  $('gradeCounts').textContent =
    `P ${byGrade('platinum')}/${totalGrade('platinum')} · G ${byGrade('gold')}/${totalGrade('gold')} · S ${byGrade('silver')}/${totalGrade('silver')} · B ${byGrade('bronze')}/${totalGrade('bronze')}`;
  const next = nextUpTrophy();
  $('nextUp').innerHTML = next
    ? `<b>NEXT UP —</b> ${escapeHtml(next.name)}: ${escapeHtml(next.description)} <button type="button" data-show="${next.id}">Open guide</button>`
    : '<b>ALL DONE —</b> every trophy earned. Vice Got a Price! should have popped.';
  $('nextUp').querySelector('button')?.addEventListener('click', (e) => selectTrophy(Number(e.target.dataset.show)));
}

function nextUpTrophy() {
  const missable = trophies.find((t) => t.missable && !earned.has(t.name));
  if (missable) return missable;
  const ordered = [...trophies].sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  return ordered.find((t) => !earned.has(t.name)) ?? null;
}

function visibleTrophies() {
  const q = $('searchBox').value.trim().toLowerCase();
  const grade = $('gradeSelect').value;
  const status = $('statusSelect').value;
  return trophies.filter((t) => {
    if (!FILTERS[currentFilter](t)) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (status === 'earned' && !earned.has(t.name)) return false;
    if (status === 'todo' && earned.has(t.name)) return false;
    if (q) {
      if (isHiddenFromReader(t)) return false;
      if (!`${t.name} ${t.description} ${t.guide}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function renderList() {
  const list = $('trophyList');
  list.replaceChildren();
  const shown = visibleTrophies();
  $('shownCount').textContent = `${shown.length} shown`;
  for (const t of shown) {
    const li = document.createElement('li');
    if (earned.has(t.name)) li.classList.add('earned');
    if (t.id === selectedId) li.classList.add('selected');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name); else earned.delete(t.name);
      saveEarned(); renderAll();
    });
    const body = document.createElement('div');
    const hidden = isHiddenFromReader(t);
    if (hidden) {
      body.innerHTML = `<div class="t-name spoiler-hidden">Story trophy — hidden until earned</div>
        <div class="t-desc">Spoiler setting is on. Earn it or tap Reveal. <button type="button" data-reveal="${t.id}">Reveal</button></div>`;
      body.querySelector('[data-reveal]').addEventListener('click', (e) => {
        e.stopPropagation(); revealed.add(t.id); renderAll();
      });
    } else {
      body.innerHTML = `<div class="t-name">${escapeHtml(t.name)}</div>
        <div class="t-desc">${escapeHtml(t.description)}</div>
        ${t.missable ? '<span class="flag">⚠ POSSIBLY MISSABLE</span>' : ''}
        ${t.hidden ? '<span class="hidden-tag">Hidden on PSN</span>' : ''}
        ${t.count ? `<span class="hidden-tag">Count: ${counts[t.id] ?? 0} / ${t.count}</span>` : ''}`;
    }
    const meta = document.createElement('div');
    meta.className = 't-meta';
    meta.innerHTML = gradeBadge(t);
    li.append(box, body, meta);
    li.addEventListener('click', (e) => { if (e.target !== box) selectTrophy(t.id); });
    list.append(li);
  }
}

function renderDetail() {
  const panel = $('detailPanel');
  const t = trophies.find((x) => x.id === selectedId) ?? trophies[0];
  if (!t) { panel.textContent = 'Loading…'; return; }
  const hidden = isHiddenFromReader(t);
  const done = earned.has(t.name);
  const count = t.count ?? null;
  const have = counts[t.id] ?? 0;
  panel.innerHTML = `
    <p class="label">TROPHY #${t.id} OF 55 &middot; ${t.hidden ? 'HIDDEN ON PSN' : 'VISIBLE ON PSN'}</p>
    <h2>${hidden ? 'Story trophy — hidden until earned' : escapeHtml(t.name)}</h2>
    <p>${gradeBadge(t)} ${t.missable ? '<span class="flag">⚠ POSSIBLY MISSABLE</span>' : ''}</p>
    ${hidden
      ? `<p class="spoiler-hidden">Spoiler setting is on. This story trophy's name and description stay hidden until you earn it.</p>
         <button type="button" class="mark-btn" data-reveal-detail="${t.id}">Reveal this trophy</button>`
      : `<div class="official"><p class="label">OFFICIAL DESCRIPTION — PLAYSTATION</p><p>${escapeHtml(t.description)}</p></div>
    <p class="label">GUIDE — IN OUR OWN WORDS</p>
    <p>${escapeHtml(t.guide)}</p>
    <p class="label">HOW TO GET IT — STEP BY STEP</p>
    <ol class="steps">${t.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>`}
    ${t.missable && !hidden ? `<div class="missable-box"><b>MISSABLE?</b> Possibly. The balcony meditation in Chapter 1 is gone after that chapter, and it is unconfirmed whether “every spot” includes it. Do it, and keep a Chapter 1 save until this pops. <span class="cite">[1][2][3][6]</span></div>` : ''}
    ${count && !hidden ? `<div class="counter"><button type="button" data-count="-1" aria-label="Count down">−</button><span><b>${have} / ${count}</b> ${countLabel(t)}</span><button type="button" data-count="1" aria-label="Count up">+</button>${have >= count ? '<span>Target reached — mark it earned.</span>' : ''}</div>` : ''}
    <button type="button" class="mark-btn ${done ? 'earned' : ''}" id="markEarned">${done ? '✓ Earned — tap to unmark' : 'Mark earned'}</button>
    <p class="src-line"><span class="label">SOURCES</span><br>${sourceLine(t.sources)}</p>
    <p class="src-line">Guide text is our own wording, written for this ledger. Sources read 18–19 Nov 2026. Trophy #${t.id} of 55 — unofficial fan guide.</p>`;
  panel.querySelector('#markEarned').addEventListener('click', () => {
    if (earned.has(t.name)) earned.delete(t.name); else earned.add(t.name);
    saveEarned(); renderAll();
  });
  panel.querySelector('[data-reveal-detail]')?.addEventListener('click', () => { revealed.add(t.id); renderAll(); });
  panel.querySelectorAll('[data-count]').forEach((b) => b.addEventListener('click', () => {
    counts[t.id] = Math.max(0, (counts[t.id] ?? 0) + Number(b.dataset.count));
    saveCounts(); renderAll();
  }));
}

function countLabel(t) {
  if (t.id === 15) return 'stunts';
  if (t.id === 17) return 'gold medals';
  if (t.id === 28) return 'meditations';
  if (t.id === 31) return 'locations';
  if (t.id === 35) return 'vehicles';
  if (t.id === 42) return 'areas';
  if (t.id === 52) return '$ laundered';
  if (t.id === 53) return '$ spent';
  return 'done';
}

function renderRoadmap() {
  const ol = $('roadmapStages');
  ol.replaceChildren();
  for (const stage of ROADMAP) {
    const li = document.createElement('li');
    const earnedIn = stage.ids.filter((id) => earned.has(trophies.find((t) => t.id === id)?.name)).length;
    li.innerHTML = `<h3>${escapeHtml(stage.title)} — ${earnedIn}/${stage.ids.length} earned</h3><p>${escapeHtml(stage.text)}</p>`;
    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const id of stage.ids) {
      const t = trophies.find((x) => x.id === id);
      if (!t) continue;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `chip${t.missable ? ' miss' : ''}`;
      chip.textContent = `${earned.has(t.name) ? '✓ ' : ''}${t.name} · ${t.grade}`;
      chip.addEventListener('click', () => { selectTrophy(id); setTab('checklist'); });
      chips.append(chip);
    }
    li.append(chips);
    ol.append(li);
  }
}

function renderSources() {
  const ol = $('sourceList');
  ol.replaceChildren();
  SOURCES.forEach((s, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<b>[${i + 1}] ${escapeHtml(s.name)}</b> — ${escapeHtml(s.title)} (${escapeHtml(s.date)})${s.url ? ` — <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.url)}</a>` : ''}`;
    ol.append(li);
  });
}

function renderSpoilerButton() {
  const b = $('spoilerToggle');
  b.textContent = spoilersOn ? 'Spoilers: hidden until earned' : 'Spoilers: shown';
  b.setAttribute('aria-pressed', String(spoilersOn));
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderSpoilerButton();
}

function selectTrophy(id) {
  selectedId = id;
  renderList();
  renderDetail();
  writeHash();
}

function setFilter(f) {
  currentFilter = FILTERS[f] ? f : 'all';
  document.querySelectorAll('#filterBar button').forEach((b) => b.classList.toggle('active', b.dataset.filter === currentFilter));
  renderList();
  writeHash();
}

function setTab(tab) {
  currentTab = tab;
  syncTabDom();
  writeHash();
}

function syncTabDom() {
  document.querySelectorAll('.tabs button[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === currentTab));
  $('tab-checklist').hidden = currentTab !== 'checklist';
  $('tab-roadmap').hidden = currentTab !== 'roadmap';
  $('tab-sources').hidden = currentTab !== 'sources';
}

function writeHash() {
  const parts = [`filter=${currentFilter}`, `spoiler=${spoilersOn ? 'on' : 'off'}`, `select=${selectedId}`, `tab=${currentTab}`];
  history.replaceState(null, '', `#${parts.join('&')}`);
}

function applyHash() {
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.get('filter') && FILTERS[hash.get('filter')]) currentFilter = hash.get('filter');
  if (hash.get('spoiler') === 'on') spoilersOn = true;
  if (hash.get('spoiler') === 'off') spoilersOn = false;
  const sel = Number(hash.get('select'));
  if (sel >= 1 && sel <= 55) selectedId = sel;
  if (['checklist', 'roadmap', 'sources'].includes(hash.get('tab'))) currentTab = hash.get('tab');
  document.querySelectorAll('#filterBar button').forEach((b) => b.classList.toggle('active', b.dataset.filter === currentFilter));
  syncTabDom();
}

function exportProgress() {
  const data = { app: 'leonida-ledger', version: 1, exported: new Date().toISOString(), earned: [...earned], counts };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-ledger-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  if (!file) return;
  let data;
  try { data = JSON.parse(await file.text()); } catch { alert('That file is not valid JSON.'); return; }
  const names = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(names)) { alert('That file has no earned list.'); return; }
  const known = new Set(trophies.map((t) => t.name));
  earned = new Set(names.filter((n) => known.has(n)));
  if (data.counts && typeof data.counts === 'object') {
    counts = {};
    for (const [k, v] of Object.entries(data.counts)) {
      const id = Number(k);
      if (id >= 1 && id <= 55 && Number.isFinite(v)) counts[id] = Math.max(0, Math.floor(v));
    }
  }
  saveEarned(); saveCounts(); renderAll();
  alert(`Imported ${earned.size} earned trophies.`);
}

async function loadTrophies() {
  const doc = await (await fetch('data/trophies.json')).json();
  trophies = doc.trophies;
}

function bindControls() {
  document.querySelectorAll('#filterBar button').forEach((b) => b.addEventListener('click', () => setFilter(b.dataset.filter)));
  document.querySelectorAll('.tabs button[data-tab]').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
  $('spoilerToggle').addEventListener('click', () => { spoilersOn = !spoilersOn; saveSpoilers(); renderAll(); writeHash(); });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importFile').addEventListener('change', (e) => importProgress(e.target.files[0]));
  $('searchBox').addEventListener('input', renderList);
  $('gradeSelect').addEventListener('change', renderList);
  $('statusSelect').addEventListener('change', renderList);
  $('watchShow').addEventListener('click', () => selectTrophy(28));
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== $('searchBox')) { e.preventDefault(); $('searchBox').focus(); }
  });
  window.addEventListener('hashchange', () => { applyHash(); renderAll(); });
}

loadState();
await loadTrophies();
applyHash();
bindControls();
renderSources();
renderAll();

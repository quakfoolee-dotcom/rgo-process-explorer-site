// Inspector readability.
// Phase 1: fold a long description behind "Show more".
// Phase 3 (V269): at the equipment overview, the area, status, duty, envelope and component count are shown as one key-facts grid
// under the title (built from the same elements the app fills in; the originals stay in the page, hidden by CSS).
// Phase 2: for the equipment listed in equipment-notes.js, show a one-paragraph summary and keep the rest as labelled
// "Model notes" in a collapsible block. The app writes the record's full geometry status into #part-description; this
// script reads the shown tag and text, and only restructures when they match a registered entry exactly (so an edited or
// route-prefixed status falls back to the plain, folded description). Nothing here changes the data.
import {structuredFor} from './equipment-notes.js';

const LIMIT = 260;

function init() {
  const p = document.getElementById('part-description');
  if (!p || document.getElementById('part-description-toggle')) return;
  const toggle = document.createElement('button');
  toggle.type = 'button'; toggle.id = 'part-description-toggle'; toggle.className = 'fold-toggle'; toggle.hidden = true;
  toggle.setAttribute('aria-controls', 'part-description');
  const notesHost = document.createElement('div');
  notesHost.id = 'model-notes'; notesHost.className = 'model-notes-host'; notesHost.hidden = true;
  p.after(toggle, notesHost);

  const label = () => {
    const open = p.classList.contains('is-open');
    toggle.textContent = open ? 'Show less' : 'Show more';
    toggle.setAttribute('aria-expanded', String(open));
  };
  const clearNotes = () => { notesHost.replaceChildren(); notesHost.hidden = true; };

  function renderNotes(entry) {
    const details = document.createElement('details');
    details.className = 'model-notes';
    const summary = document.createElement('summary');
    const title = document.createElement('span'); title.className = 'model-notes-title'; title.textContent = 'Model notes';
    const count = document.createElement('span'); count.className = 'model-notes-count'; count.textContent = String(entry.notes.length);
    const labels = document.createElement('span'); labels.className = 'model-notes-labels'; labels.textContent = entry.notes.map(n => n.label).join(' · ');
    summary.append(title, count, labels);
    const list = document.createElement('dl');
    for (const n of entry.notes) {
      const dt = document.createElement('dt'); dt.textContent = n.label;
      const dd = document.createElement('dd'); dd.textContent = n.text;
      list.append(dt, dd);
    }
    details.append(summary, list);
    notesHost.replaceChildren(details);
    notesHost.hidden = false;
  }

  let busy = false;
  function sync() {
    if (busy) return;
    busy = true;
    try {
      // Equipment overview only: its facts block is visible; a selected component hides it.
      const facts = document.getElementById('equipment-facts');
      const tag = (document.getElementById('part-id')?.textContent || '').trim();
      const entry = facts && !facts.hidden ? structuredFor(tag, p.textContent) : null;
      if (entry) {
        p.textContent = entry.summary;
        p.classList.remove('is-folded', 'is-open');
        toggle.hidden = true;
        renderNotes(entry);
        return;
      }
      clearNotes();
      const long = p.textContent.length > LIMIT;
      p.classList.toggle('is-folded', long);
      if (!long) { p.classList.remove('is-open'); toggle.hidden = true; return; }
      toggle.hidden = false; label();
    } finally {
      // Our own text change fires a mutation record; ignore it.
      setTimeout(() => { busy = false; }, 0);
    }
  }

  let timer = 0;
  const schedule = () => { if (busy) return; clearTimeout(timer); timer = setTimeout(() => { p.classList.remove('is-open'); sync(); }, 0); };
  toggle.onclick = () => { p.classList.toggle('is-open'); label(); };
  const observer = new MutationObserver(schedule);
  observer.observe(p, {childList: true, characterData: true, subtree: true});
  const id = document.getElementById('part-id');
  if (id) observer.observe(id, {childList: true, characterData: true, subtree: true});
  sync();
}

const COUNT = /^([\d,]+) modeled components · ([\d,]+) assemblies$/;
function initKeyFacts() {
  const title = document.getElementById('part-name');
  if (!title || document.getElementById('key-facts')) return;
  const grid = document.createElement('dl');
  grid.id = 'key-facts'; grid.className = 'key-facts'; grid.hidden = true;
  title.after(grid);
  const text = id => (document.getElementById(id)?.textContent || '').trim();
  function cell(label, value, wide) {
    const box = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
    if (wide) box.className = 'key-wide';
    dt.textContent = label;
    if (typeof value === 'string') dd.textContent = value; else dd.append(value);
    box.append(dt, dd);
    return box;
  }
  let busy = false;
  function build() {
    if (busy) return;
    busy = true;
    try {
      const facts = document.getElementById('equipment-facts');
      if (!facts || facts.hidden) { grid.hidden = true; grid.replaceChildren(); return; }
      const status = document.createElement('div');
      status.className = 'status-badges';
      for (const node of document.getElementById('part-status')?.childNodes || []) status.append(node.cloneNode(true));
      const count = text('equipment-count'), m = COUNT.exec(count), duty = text('equipment-duty');
      const cells = [cell('Area', text('part-context')), cell('Status', status.childNodes.length ? status : '—'),
        ...(duty && duty !== text('part-name') ? [cell('Duty / service', duty, true)] : []),
        cell('Envelope · X × Z × H', text('equipment-envelope') || '—'),
        cell('Components', m ? m[1] + ' components · ' + m[2] + ' assemblies' : (count || '—'))];
      grid.replaceChildren(...cells);
      grid.hidden = false;
    } finally { setTimeout(() => { busy = false; }, 0); }
  }
  let timer = 0;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(build, 0); };
  const observer = new MutationObserver(schedule);
  for (const id of ['part-id', 'part-context', 'part-status', 'equipment-duty', 'equipment-envelope', 'equipment-count'])
    { const node = document.getElementById(id); if (node) observer.observe(node, {childList: true, characterData: true, subtree: true}); }
  const facts = document.getElementById('equipment-facts');
  if (facts) observer.observe(facts, {attributes: true, attributeFilter: ['hidden']});
  const inspector = document.getElementById('inspector');
  if (inspector) observer.observe(inspector, {attributes: true, attributeFilter: ['data-level', 'hidden']});
  build();
}

// Phase 3, part 2 (V272): in the part (component) view, name the equipment the part belongs to and keep that equipment's data
// folded away, so the part's own details come first. The page keeps the original back button (hidden by CSS at part level).
function initParent() {
  const inspector = document.getElementById('inspector'), title = document.getElementById('part-name'), back = document.getElementById('back-equipment');
  if (!inspector || !title || !back || document.getElementById('part-of')) return;
  const block = document.createElement('div');
  block.id = 'part-of'; block.className = 'part-of'; block.hidden = true;
  const label = document.createElement('span'); label.className = 'part-of-label'; label.textContent = 'Part of';
  const owner = document.createElement('strong'); owner.id = 'part-of-name';
  const open = document.createElement('button'); open.type = 'button'; open.id = 'part-of-open'; open.textContent = 'View overview';
  open.onclick = () => back.click();
  block.append(label, owner, open);
  title.after(block);

  let lastPart = '', toggle = null;
  function equipmentName(tag) {
    for (const o of document.getElementById('explore-equipment')?.options || [])
      if (o.textContent.startsWith(tag + ' · ')) return o.textContent.slice(tag.length + 3).trim();
    return '';
  }
  function sync() {
    const part = inspector.dataset.level === 'component', m = /^← (.+) overview$/.exec((back.textContent || '').trim());
    const host = document.getElementById('semantic-inspector');
    if (!part || !m) {
      block.hidden = true; lastPart = '';
      if (host) { delete host.dataset.parent; delete host.dataset.collapsed; const h = host.querySelector('.semantic-heading h3'); if (h) h.textContent = 'Semantic Plant Core'; }
      return;
    }
    const tag = m[1], name = equipmentName(tag);
    owner.textContent = name ? tag + ' · ' + name : tag;
    open.textContent = 'View ' + tag + ' overview';
    block.hidden = false;
    if (!host) return;
    const heading = host.querySelector('.semantic-heading');
    if (heading && !toggle) {
      toggle = document.createElement('button'); toggle.type = 'button'; toggle.id = 'semantic-collapse'; toggle.className = 'semantic-collapse';
      toggle.onclick = () => { host.dataset.collapsed = host.dataset.collapsed === 'true' ? 'false' : 'true'; label2(); };
      heading.append(toggle);
    }
    const h3 = host.querySelector('.semantic-heading h3'); if (h3) h3.textContent = tag + ' equipment data';
    host.dataset.parent = 'true';
    const id = (document.getElementById('part-id')?.textContent || '').trim();
    if (id !== lastPart) { lastPart = id; host.dataset.collapsed = 'true'; }
    label2();
    function label2() { if (toggle) { const c = host.dataset.collapsed === 'true'; toggle.textContent = c ? 'Show' : 'Hide'; toggle.setAttribute('aria-expanded', String(!c)); } }
  }
  let timer = 0;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(sync, 0); };
  const observer = new MutationObserver(schedule);
  observer.observe(inspector, {attributes: true, attributeFilter: ['data-level', 'hidden']});
  observer.observe(back, {childList: true, characterData: true, subtree: true});
  const id = document.getElementById('part-id'); if (id) observer.observe(id, {childList: true, characterData: true, subtree: true});
  const body = inspector.querySelector('.inspector-body'); if (body) observer.observe(body, {childList: true});
  sync();
}

function start() { init(); initKeyFacts(); initParent(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

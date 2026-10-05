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

function start() { init(); initKeyFacts(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

// Inspector readability.
// Phase 1: fold a long description behind "Show more".
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

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

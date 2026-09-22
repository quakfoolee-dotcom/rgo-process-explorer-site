// A-5000 data-layer record (V186, additive).
//
// Renders dist/a5000-data-layer.json into the section added at the top of the A-5000 review page: the
// findings register with its verified evidence, approved values, recorded decisions, open value
// conflicts, open source gaps by asset, the asset register with its model binding, and the documents
// cited. The engineer's sections below — thermal projections, PFD temperature register, fluid
// separation, consumers and heat balance — are untouched and keep their own revisions.
const $ = id => document.getElementById(id);
const el = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined && text !== null) n.textContent = String(text); if (cls) n.className = cls; return n; };
const link = (href, text) => { const a = el('a', text); a.href = href; if (/^https?:|^\.\//.test(href)) { a.target = '_blank'; a.rel = 'noopener'; } return a; };
const table = (host, headings, rows) => {
 const wrap = el('div', null, 'review-register'), t = el('table'), thead = el('thead'), tr = el('tr');
 for (const h of headings) tr.append(el('th', h));
 thead.append(tr); t.append(thead);
 const tbody = el('tbody');
 for (const row of rows) { const r = el('tr'); for (const cell of row) { const td = el('td'); if (cell && typeof cell === 'object' && 'nodeType' in cell) td.append(cell); else td.textContent = cell ?? ''; r.append(td); } tbody.append(r); }
 t.append(tbody); wrap.append(t); host.append(wrap);
 return t;
};
const details = (host, summary, build) => { const d = el('details'); d.append(el('summary', summary)); build(d); host.append(d); return d; };

try {
 const response = await fetch('./a5000-data-layer.json');
 if (!response.ok) throw Error('data-layer record unavailable');
 const d = await response.json();
 const root = $('a5000-data-layer'); root.hidden = false;

 const signed = d.reviewer && d.reviewer.initials;
 $('a5000-dl-basis').textContent = `Data layer data/semantic/A-5000/ · Semantic Core ${d.semanticCoreVersion} · main @ ${d.version || ''} ${d.date} · record ${d.revision}`
  + ` · ${d.counts.approved} approved values, ${d.counts.decisions} decision rows, ${d.counts.conflictsOpen} open conflicts, ${d.counts.gapsOpen} open source gaps, ${d.binding.bound}/${d.binding.assets} records model-bound.`;
 const banner = $('a5000-dl-signoff');
 banner.textContent = signed
  ? `Data-layer findings reviewed by ${d.reviewer.initials} · ${d.reviewer.date} (record ${d.revision}). Values shown as approved carry a reviewer initial and a registered source.`
  : `Data-layer findings drafted from the recorded decisions, conflicts and gaps — reviewer sign-off pending (record ${d.revision}).`;
 banner.className = signed ? 'notice' : 'notice pending';
 $('a5000-dl-lead').textContent = d.lead || '';

 // ---- findings register
 for (const f of d.findings) {
  const card = el('article', null, 'dl-finding'); card.id = f.id;
  card.append(el('h3', `${f.id} · ${f.topic}`));
  const meta = el('p', null, 'dl-meta');
  meta.append(el('span', f.status, 'dl-pill status'), el('span', `priority ${f.priority}`, `dl-pill priority-${f.priority}`), el('span', f.discipline, 'dl-pill'));
  card.append(meta);
  for (const [label, text] of [['Observation', f.observation], ['Required action', f.action]]) {
   const p = el('p'); p.append(el('strong', label + ': '), document.createTextNode(text)); card.append(p);
  }
  const box = el('div', null, 'dl-evidence'); box.append(el('p', 'Evidence:'));
  const ul = el('ul');
  for (const e of f.evidence) { const li = el('li'); li.append(link(e.href, e.label)); ul.append(li); }
  box.append(ul); card.append(box);
  $('a5000-dl-findings').append(card);
 }

 // ---- approved values, decisions, conflicts, gaps, assets, documents
 const approved = $('a5000-approved');
 approved.append(el('p', `${d.counts.approved} applied values. Every row carries a reviewer initial and a registered source document; nothing else in this area is approved.`));
 table(approved, ['Asset', 'Property', 'Approved value', 'Source', 'Reviewer'],
  d.approved.map(v => [v.assetId, v.property, (v.value.length > 160 ? v.value.slice(0, 158) + '…' : v.value) + (v.unit ? ' ' + v.unit : ''), `${v.source} · ${v.location}`, `${v.reviewer} ${v.reviewDate}`]));

 const dec = $('a5000-decisions');
 dec.append(el('p', `${d.counts.decisions} decision rows on record. Decisions are reported here, not taken on this page.`));
 table(dec, ['Decision', 'Assets', 'Property', 'Approved source', 'Rationale', 'Reviewer'],
  d.decisions.map(r => [r.decisionId, r.assetPattern.replace(/\|/g, ' · '), r.property, r.approvedSourceDocId, r.rationale, `${r.reviewer} ${r.reviewDate}`]));

 const conf = $('a5000-conflicts');
 conf.append(el('p', `${d.counts.conflictsOpen} open value conflicts and ${d.counts.conflictsClosed} closed by decision. A conflict is two or more registered sources recording different values for the same property.`));
 table(conf, ['Group', 'Asset', 'Property', 'Rows on record'],
  d.conflicts.open.map(c => [c.group, c.assetId, c.property, c.rows.map(r => `${r.status}: ${r.value} (${r.source})`).join(' · ')]));
 if (d.conflicts.closed.length) details(conf, `${d.conflicts.closed.length} conflicts closed by an approved value`, host =>
  table(host, ['Group', 'Asset', 'Property', 'Approved'], d.conflicts.closed.map(c => [c.group, c.assetId, c.property, (c.rows.find(r => r.status === 'approved') || {}).value || ''])));

 const gaps = $('a5000-gaps');
 gaps.append(el('p', `${d.counts.gapsOpen} open source gaps (${d.counts.gapsClosed} recorded closed). Gap IDs are stable across harvests, so a review can cite them.`));
 table(gaps, ['Asset', 'Open gaps', 'Missing'], d.gapsByAsset.map(a => [a.assetId, a.gaps, a.subjects.join(', ')]));
 details(gaps, `All ${d.counts.gapsOpen} open gaps with their required source`, host =>
  table(host, ['Gap', 'Asset', 'Kind', 'Subject', 'Required source'], d.gaps.open.map(g => [g.gapId, g.assetId, g.kind, g.subject, g.requiredSource])));

 const assets = $('a5000-assets');
 assets.append(el('p', `${d.binding.assets} records: ${d.binding.bound} bound to model equipment, ${d.binding.unbound} unbound (${d.binding.interfaces} of them IF-* boundary records), ${d.binding.withValues} carrying data-layer rows.`));
 table(assets, ['Asset', 'Name', 'Class', 'Model', 'Rows', 'Approved', 'Open gaps'],
  d.assets.map(a => [a.assetId, a.name, a.assetClassId, a.bound ? 'bound' : (/^IF-/.test(a.assetId) ? 'interface' : 'not bound'), a.values, a.approved, a.gaps]));

 const docs = $('a5000-documents');
 table(docs, ['Document', 'Revision', 'Control', 'Value rows', 'Title'],
  d.documents.map(doc => [doc.documentId, doc.revision, doc.control, doc.valueRows, doc.title]));

 const nav = $('a5000-dl-links');
 nav.append(link('./semantic-core.html#area-A-5000', 'Semantic Plant Core · A-5000 records ↗'));
 nav.append(link('./layout-review.html', 'Transport, racks and layout review ↗'));
 if (d.layout) nav.append(el('span', `A-5000 in the layout review (${d.layout.revision}${d.layout.reviewer ? ' · ' + d.layout.reviewer : ''}): ${d.layout.supports} bearings, ${d.layout.holds} placement holds, ${d.layout.reserved} reserved-space intrusion${d.layout.reserved === 1 ? '' : 's'}.`, 'small-note'));
} catch (error) {
 // The record is hidden rather than half-drawn; the reason is reported for anyone debugging the page.
 console.error('A-5000 data-layer record unavailable:', error);
 const root = $('a5000-data-layer'); if (root) root.hidden = true;
}

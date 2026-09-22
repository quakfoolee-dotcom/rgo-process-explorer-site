// Area plan — CAD-style plan and elevations on the area review pages (V185).
//
// Reads ./<slug>-plan.json (scripts/build-area-plan.mjs): convex outlines of projected model meshes,
// pipe centrelines, equipment tags and located review records, in integer millimetres. Draws a true
// section at a selectable cut plane — parts the plane cuts are heavy, parts below it are thin, parts
// above it are dashed overhead — with layer toggles, tag gutter, grid, scale bar, and SVG and DXF
// downloads of exactly what is on screen. Projected concept geometry, not a general-arrangement drawing.
const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const VIEWS = {plan: {label: 'Plan (X / Z)', key: 'p', h: 'X', v: 'Z'}, front: {label: 'Front elevation (X / Y)', key: 'f', h: 'X', v: 'EL'}, side: {label: 'Side elevation (Z / Y)', key: 's', h: 'Z', v: 'EL'}};
const LAYERS = [['equipment', 'Equipment'], ['structure', 'Supports and steel'], ['containment', 'Containment'], ['access', 'Access and safety'], ['pipe', 'Pipe runs'], ['context', 'Other areas (context)'], ['records', 'Review records'], ['grid', 'Grid and tags']];
const KIND = {finding: ['Review finding', '#e0a33a'], hold: ['Support placement hold', '#e2714f'], reserved: ['Reserved-space intrusion', '#d95c7c'], service: ['Service position', '#4f9de2'], reach: ['Reach failure', '#a07ae0']};
const INK = {cut: '#101b25', below: '#7b8b99', above: '#9fb0be', context: '#c3ced8', pipe: '#2f6fae', pipeContext: '#a9c3da', grid: '#dbe3ea', gridMajor: '#b9c6d2', sheet: '#ffffff'};

export async function mountAreaPlan(slug) {
 const root = $('area-plan'); if (!root) return;
 let data;
 try { const r = await fetch(`./${slug}-plan.json`); if (!r.ok) throw Error('plan data unavailable'); data = await r.json(); }
 catch { root.hidden = true; return; }

 let view = 'plan', cut = data.cutM, zoom = 1, centre = null, selected = null, tagsInGutter = true;
 const on = Object.fromEntries(LAYERS.map(([k]) => [k, true]));
 // Areas whose runs cross the plant (A-3000, A-1000) open with the context layer off, or the first
 // paint is mostly other people's equipment; the toggle turns it back on.
 const contextHeavy = data.counts.outlines - data.counts.own > data.counts.own * 2;
 if (contextHeavy) on.context = false;
 const node = (tag, attrs, text) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs || {})) n.setAttribute(k, String(v)); if (text !== undefined) n.textContent = text; return n; };
 const m2 = v => v / 1000;
 const pts = (flat, k) => { const out = []; for (let i = 0; i < flat.length; i += 2) out.push([m2(flat[i]), m2(flat[i + 1])]); return out; };
 const boxIn = (box, v) => { const [a, b] = v === 'plan' ? [[box.min[0], box.min[2]], [box.max[0], box.max[2]]] : v === 'front' ? [[box.min[0], -box.max[1]], [box.max[0], -box.min[1]]] : [[box.min[2], -box.max[1]], [box.max[2], -box.min[1]]];
  return {min: [m2(Math.min(a[0], b[0])), m2(Math.min(a[1], b[1]))], max: [m2(Math.max(a[0], b[0])), m2(Math.max(a[1], b[1]))]}; };
 const extents = v => boxIn({min: [data.crop.x[0], data.extents.min[1] - 500, data.crop.z[0]], max: [data.crop.x[1], data.extents.max[1] + 500, data.crop.z[1]]}, v);

 // The sheet keeps the drawing's own proportions (the SVG letterboxes it), so a tall area is not
// stretched across an empty landscape frame; stroke widths follow the rendered scale either way.
 function frame() {
  const e = selected ? boxIn(selected.box, view) : extents(view);
  const pad = selected ? 2 : 0.4;
  const w = Math.max(e.max[0] - e.min[0] + pad * 2, 4) / zoom, h = Math.max(e.max[1] - e.min[1] + pad * 2, 3) / zoom;
  const c = centre || [(e.min[0] + e.max[0]) / 2, (e.min[1] + e.max[1]) / 2];
  return {x: c[0] - w / 2, y: c[1] - h / 2, w, h};
 }
 const visible = o => {
  if (!o.a && !on.context) return false;
  if (o.a && !on[o.l === 'containment' ? 'containment' : o.l === 'access' ? 'access' : o.l === 'structure' ? 'structure' : 'equipment']) return false;
  return true;
 };
 const state = o => { const c = cut * 1000; return o.b <= c && o.t >= c ? 'cut' : o.t < c ? 'below' : 'above'; };

 function draw() {
  const box = frame(), svg = $('plan-drawing'), scale = 1600 / Math.max(box.w, box.h * 1.6);
  svg.replaceChildren();
  svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.w} ${box.h}`);
  svg.setAttribute('aria-label', `${data.area} ${VIEWS[view].label}${selected ? ' · ' + selected.label : ''}`);
  const layer = id => { const g = node('g', {id}); svg.append(g); return g; };
  const gGrid = layer('l-grid'), gContext = layer('l-context'), gBelow = layer('l-below'), gAbove = layer('l-above'), gPipe = layer('l-pipe'), gCut = layer('l-cut'), gRecords = layer('l-records'), gTags = layer('l-tags');

  if (on.grid) {
   const step = box.w > 60 ? 10 : box.w > 24 ? 5 : box.w > 8 ? 1 : 0.5;
   for (let x = Math.ceil(box.x / step) * step; x <= box.x + box.w; x += step)
    gGrid.append(node('line', {x1: x, x2: x, y1: box.y, y2: box.y + box.h, stroke: x % (step * 5) === 0 ? INK.gridMajor : INK.grid, 'stroke-width': (x % (step * 5) === 0 ? 1 : .6) / scale}));
   for (let y = Math.ceil(box.y / step) * step; y <= box.y + box.h; y += step)
    gGrid.append(node('line', {x1: box.x, x2: box.x + box.w, y1: y, y2: y, stroke: y % (step * 5) === 0 ? INK.gridMajor : INK.grid, 'stroke-width': (y % (step * 5) === 0 ? 1 : .6) / scale}));
   for (let x = Math.ceil(box.x / (step * 5)) * step * 5; x <= box.x + box.w; x += step * 5)
    gGrid.append(node('text', {x, y: box.y + box.h - 4 / scale, 'font-size': 11 / scale, fill: '#8797a5', 'text-anchor': 'middle'}, `${VIEWS[view].h}${x.toFixed(0)}`));
   for (let y = Math.ceil(box.y / (step * 5)) * step * 5; y <= box.y + box.h; y += step * 5)
    gGrid.append(node('text', {x: box.x + 4 / scale, y: y - 3 / scale, 'font-size': 11 / scale, fill: '#8797a5'}, `${VIEWS[view].v}${(view === 'plan' ? y : -y).toFixed(0)}`));
   if (view !== 'plan') gGrid.append(node('line', {x1: box.x, x2: box.x + box.w, y1: 0, y2: 0, stroke: '#6d8091', 'stroke-width': 1.6 / scale}));
  }
  const highlight = new Set(selected?.parts || []);
  const shape = (o, g, stroke, width, dash, fill) => {
   const p = pts(o[VIEWS[view].key]); if (p.length < 2) return;
   const el = node('polygon', {points: p.map(q => q.join(',')).join(' '), fill: fill || 'none', stroke, 'stroke-width': width / scale, 'stroke-linejoin': 'round'});
   if (dash) el.setAttribute('stroke-dasharray', `${5 / scale} ${3.5 / scale}`);
   if (o.n) el.append(node('title', {}, o.n));
   g.append(el);
  };
  for (const o of data.outlines) {
   if (!visible(o)) continue;
   const hot = highlight.has(o.i);
   const s = view === 'plan' ? state(o) : 'cut';
   if (!o.a) { if (on.context) shape(o, gContext, hot ? '#e0a33a' : INK.context, hot ? 2 : .7); continue; }
   if (s === 'cut') shape(o, gCut, hot ? '#e0a33a' : INK.cut, hot ? 2.4 : 1.5, false, '#f4f7fa');
   else if (s === 'below') shape(o, gBelow, hot ? '#e0a33a' : INK.below, hot ? 2 : .8);
   else shape(o, gAbove, hot ? '#e0a33a' : INK.above, hot ? 2 : .8, true);
  }
  if (on.pipe) for (const r of data.runs) {
   const p = pts(r[VIEWS[view].key]); if (p.length < 2) continue;
   const hot = highlight.has(r.i);
   const el = node('polyline', {points: p.map(q => q.join(',')).join(' '), fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    stroke: hot ? '#e0a33a' : r.a ? INK.pipe : INK.pipeContext, 'stroke-width': Math.max(.7, Math.min(box.w > 30 ? 2.6 : 6, m2(r.r) * 2 * scale * .5)) / scale});
   if (r.o === 'return') el.setAttribute('stroke-dasharray', `${6 / scale} ${4 / scale}`);
   if (r.n) el.append(node('title', {}, `${r.n} · Ø${(m2(r.r) * 2000).toFixed(0)} mm`));
   gPipe.append(el);
  }
  if (on.records) for (const rec of data.records) {
   const b = boxIn(rec.box, view), cx = (b.min[0] + b.max[0]) / 2, cy = (b.min[1] + b.max[1]) / 2;
   const colour = (KIND[rec.kind] || ['', '#888'])[1], is = selected?.id === rec.id;
   const g = node('g', {class: 'record', 'data-id': rec.id, style: 'cursor:pointer'});
   // Only the selected record shows its extent box; the rest are markers, so the drawing stays readable.
   if (is) g.append(node('rect', {x: b.min[0], y: b.min[1], width: b.max[0] - b.min[0], height: b.max[1] - b.min[1], fill: 'none', stroke: colour,
    'stroke-width': 2 / scale, 'stroke-dasharray': `${4 / scale} ${3 / scale}`}));
   g.append(node('circle', {cx, cy, r: (is ? 6 : 2.6) / scale, fill: colour, opacity: is ? 1 : .7, stroke: '#fff', 'stroke-width': .7 / scale}));
   g.append(node('title', {}, `${rec.label} — ${rec.status}`));
   g.addEventListener('click', () => select(rec.id));
   gRecords.append(g);
  }
  if (on.grid) {
   const placed = [];
   for (const e of data.equipment) {
    const b = boxIn(e.box, view), cx = (b.min[0] + b.max[0]) / 2, cy = (b.min[1] + b.max[1]) / 2;
    if (cx < box.x || cx > box.x + box.w || cy < box.y || cy > box.y + box.h) continue;
    const w = (e.tag.length * 7 + 10) / scale, h = 15 / scale;
    // Try a short ring of offsets around the item; a label that still collides is dropped rather than
    // dragged across the drawing on a long leader (the outline keeps its hover name either way).
    const offsets = [[0, -1], [0, -2], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1], [0, -3]];
    let tx = cx, ty = cy - 14 / scale, clear = false;
    for (const [dx, dy] of offsets) {
     tx = cx + dx * (w * .62); ty = cy + dy * (h * 1.25) - 4 / scale;
     const r = [tx - w / 2, ty - h, tx + w / 2, ty];
     if (!placed.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) { clear = true; break; }
    }
    if (!clear) { gTags.append(node('circle', {cx, cy, r: 2.2 / scale, fill: '#fff', stroke: '#3d4d5c', 'stroke-width': 1 / scale})); continue; }
    placed.push([tx - w / 2, ty - h, tx + w / 2, ty]);
    gTags.append(node('line', {x1: cx, y1: cy, x2: tx, y2: ty + 2 / scale, stroke: '#9aa9b6', 'stroke-width': .7 / scale}));
    gTags.append(node('circle', {cx, cy, r: 2.2 / scale, fill: '#fff', stroke: '#3d4d5c', 'stroke-width': 1 / scale}));
    const t = node('text', {x: tx, y: ty, 'font-size': 12.5 / scale, 'text-anchor': 'middle', fill: '#16202a', stroke: '#fff', 'stroke-width': 3 / scale, 'paint-order': 'stroke'}, e.tag);
    gTags.append(t);
   }
  }
  // title block — carried into the SVG and PNG exports as well as the screen
  const tb = node('g', {}), tx = box.x + box.w * .02, ty0 = box.y + box.h * .035, line = 15 / scale;
  const rows = [[`${data.area} — ${VIEWS[view].label.toUpperCase()}`, 15.5], [view === 'plan' ? `Section at EL +${cut.toFixed(2)} m` : 'Projected elevation', 12],
   [`Model ${data.version || ''} · ${data.date}${data.review ? ` · review ${data.review.revision}${data.review.reviewer ? ' · ' + data.review.reviewer : ''}` : ''}`, 12],
   ['Projected concept geometry — NOT FOR CONSTRUCTION', 12]];
  rows.forEach(([t, size], i) => tb.append(node('text', {x: tx, y: ty0 + i * line, 'font-size': size / scale, fill: '#16202a',
   'font-weight': i ? 'normal' : 'bold', stroke: '#fff', 'stroke-width': 3 / scale, 'paint-order': 'stroke'}, t)));
  svg.append(tb);
  // scale bar
  const bar = box.w > 40 ? 10 : box.w > 15 ? 5 : 1, bx = box.x + box.w * .04, by = box.y + box.h * .955;
  const g = node('g', {});
  g.append(node('line', {x1: bx, x2: bx + bar, y1: by, y2: by, stroke: '#16202a', 'stroke-width': 2 / scale}));
  for (let i = 0; i <= 5; i++) g.append(node('line', {x1: bx + bar * i / 5, x2: bx + bar * i / 5, y1: by - 4 / scale, y2: by + 4 / scale, stroke: '#16202a', 'stroke-width': 1.4 / scale}));
  g.append(node('text', {x: bx + bar, y: by + 16 / scale, 'font-size': 12 / scale, fill: '#16202a'}, ` ${bar} m`));
  svg.append(g);
  $('plan-scale').textContent = `${VIEWS[view].label} · ${box.w.toFixed(1)} × ${box.h.toFixed(1)} m on screen · grid ${box.w > 60 ? 10 : box.w > 24 ? 5 : box.w > 8 ? 1 : 0.5} m`;
 }

 function select(id) {
  selected = data.records.find(r => r.id === id) || null;
  centre = null; zoom = 1;
  $('plan-record').value = selected?.id || '';
  const card = $('plan-record-card'); card.replaceChildren();
  if (!selected) { card.hidden = true; draw(); return; }
  card.hidden = false;
  const [label, colour] = KIND[selected.kind] || ['Record', '#888'];
  const head = document.createElement('p'); const pill = document.createElement('span');
  pill.className = 'plan-pill'; pill.style.borderColor = colour; pill.textContent = label;
  head.append(pill, document.createTextNode(' ' + selected.label));
  card.append(head);
  for (const [k, t] of [['Status', selected.status], ['Observation', selected.detail], ['Action', selected.action]]) {
   if (!t) continue; const p = document.createElement('p'); p.append(Object.assign(document.createElement('strong'), {textContent: k + ': '}), document.createTextNode(t)); card.append(p);
  }
  if (selected.owners?.length) { const p = document.createElement('p'); p.textContent = 'Equipment: ' + selected.owners.join(', '); card.append(p); }
  if (selected.source) { const a = document.createElement('a'); a.href = selected.source.href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = selected.source.label + ' ↗'; card.append(a); }
  draw();
 }

 // ---- exports: SVG of exactly what is drawn, and DXF with one layer per drawing layer
 const stamp = () => `${data.area}_${view}_EL${cut.toFixed(2)}_${data.version || ''}_${data.date}`.replace(/[^\w.-]/g, '');
 function downloadSvg() {
  const svg = $('plan-drawing').cloneNode(true);
  svg.setAttribute('xmlns', NS); svg.setAttribute('width', '1600'); svg.setAttribute('height', '1000');
  svg.insertBefore(node('rect', {x: '-100000', y: '-100000', width: '200000', height: '200000', fill: INK.sheet}), svg.firstChild);
  save(new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(svg)], {type: 'image/svg+xml'}), stamp() + '.svg');
 }
 function downloadDxf() {
  const key = VIEWS[view].key, out = [];
  const L = (name, colour) => ['0', 'LAYER', '2', name, '70', '0', '62', String(colour), '6', 'CONTINUOUS'];
  out.push('0', 'SECTION', '2', 'HEADER', '9', '$INSUNITS', '70', '6', '0', 'ENDSEC');   // 6 = metres
  out.push('0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LAYER', '70', '8',
   ...L('EQUIPMENT_CUT', 7), ...L('EQUIPMENT_BELOW', 8), ...L('EQUIPMENT_ABOVE', 9), ...L('STRUCTURE', 8), ...L('CONTEXT', 9), ...L('PIPE', 5), ...L('RECORDS', 2), ...L('TAGS', 3),
   '0', 'ENDTAB', '0', 'ENDSEC');
  out.push('0', 'SECTION', '2', 'ENTITIES');
  const poly = (layer, points, closed) => {
   out.push('0', 'LWPOLYLINE', '8', layer, '90', String(points.length), '70', closed ? '1' : '0');
   for (const [x, y] of points) out.push('10', x.toFixed(4), '20', (-y).toFixed(4));   // DXF Y is up
  };
  for (const o of data.outlines) {
   if (!visible(o)) continue;
   const p = pts(o[key]); if (p.length < 2) continue;
   const s = view === 'plan' ? state(o) : 'cut';
   poly(!o.a ? 'CONTEXT' : o.l === 'structure' ? 'STRUCTURE' : s === 'cut' ? 'EQUIPMENT_CUT' : s === 'below' ? 'EQUIPMENT_BELOW' : 'EQUIPMENT_ABOVE', p, true);
  }
  if (on.pipe) for (const r of data.runs) { const p = pts(r[key]); if (p.length >= 2) poly('PIPE', p, false); }
  if (on.records) for (const rec of data.records) { const b = boxIn(rec.box, view); poly('RECORDS', [[b.min[0], b.min[1]], [b.max[0], b.min[1]], [b.max[0], b.max[1]], [b.min[0], b.max[1]]], true); }
  if (on.grid) for (const e of data.equipment) {
   const b = boxIn(e.box, view), cx = (b.min[0] + b.max[0]) / 2, cy = (b.min[1] + b.max[1]) / 2;
   out.push('0', 'TEXT', '8', 'TAGS', '10', cx.toFixed(4), '20', (-cy).toFixed(4), '40', '0.35', '1', e.tag, '72', '1', '11', cx.toFixed(4), '21', (-cy).toFixed(4));
  }
  out.push('0', 'ENDSEC', '0', 'EOF');
  save(new Blob([out.join('\r\n') + '\r\n'], {type: 'image/vnd.dxf'}), stamp() + '.dxf');
 }
 function save(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }

 // ---- controls
 $('plan-basis').textContent = `${data.area} · ${data.counts.outlines.toLocaleString()} outlines (${data.counts.own.toLocaleString()} in area), ${data.counts.runs.toLocaleString()} pipe runs, ${data.counts.records} located review records · model ${data.version || ''} ${data.date} · ${data.basis}`;
 for (const [k, v] of Object.entries(VIEWS)) $('plan-view').append(new Option(v.label, k));
 $('plan-view').value = view;
 $('plan-view').onchange = () => { view = $('plan-view').value; centre = null; zoom = 1; $('plan-cut').disabled = view !== 'plan'; draw(); };
 $('plan-cut').value = String(cut);
 $('plan-cut').oninput = () => { cut = Number($('plan-cut').value) || 0; $('plan-cut-label').textContent = `EL +${cut.toFixed(2)} m`; draw(); };
 $('plan-cut-label').textContent = `EL +${cut.toFixed(2)} m`;
 const kinds = [...new Set(data.records.map(r => r.kind))];
 $('plan-kind').append(new Option(`All records (${data.records.length})`, 'all'), ...kinds.map(k => new Option(`${(KIND[k] || [k])[0]} (${data.records.filter(r => r.kind === k).length})`, k)));
 const fillRecords = () => { const k = $('plan-kind').value; const rows = data.records.filter(r => k === 'all' || r.kind === k);
  $('plan-record').replaceChildren(new Option(`${data.area} overview`, ''), ...rows.map(r => new Option(r.label.length > 74 ? r.label.slice(0, 72) + '…' : r.label, r.id))); };
 fillRecords(); $('plan-kind').onchange = () => { fillRecords(); select(''); };
 $('plan-record').onchange = () => select($('plan-record').value);
 $('plan-zoom-in').onclick = () => { zoom = Math.min(zoom * 1.4, 40); draw(); };
 $('plan-zoom-out').onclick = () => { zoom = Math.max(zoom / 1.4, 1); draw(); };
 $('plan-fit').onclick = () => { zoom = 1; centre = null; draw(); };
 $('plan-svg').onclick = downloadSvg;
 $('plan-dxf').onclick = downloadDxf;
 const layerBox = $('plan-layers');
 for (const [k, label] of LAYERS) {
  const id = 'plan-layer-' + k, wrap = document.createElement('label'), input = document.createElement('input');
  input.type = 'checkbox'; input.checked = on[k]; input.id = id; input.onchange = () => { on[k] = input.checked; draw(); };
  wrap.append(input, document.createTextNode(' ' + label)); layerBox.append(wrap);
 }
 const svg = $('plan-drawing');
 svg.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(1, Math.min(40, zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); draw(); }, {passive: false});
 let drag = null;
 svg.addEventListener('pointerdown', e => { drag = {x: e.clientX, y: e.clientY, box: frame()}; svg.setPointerCapture(e.pointerId); });
 svg.addEventListener('pointermove', e => { if (!drag) return; const r = svg.getBoundingClientRect(), k = drag.box.w / r.width;
  const b = drag.box; centre = [b.x + b.w / 2 - (e.clientX - drag.x) * k, b.y + b.h / 2 - (e.clientY - drag.y) * k]; draw(); });
 for (const t of ['pointerup', 'pointercancel', 'pointerleave']) svg.addEventListener(t, () => { drag = null; });
 draw();
}

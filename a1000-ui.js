import {A1000_BASIS} from './a1000-basis.js';
export function mountA1000Basis(model){
 if(model.scope==='future')return;
 const parent=document.getElementById('process-overview');if(!parent)return;
 const card=document.createElement('details');card.id='a1000-basis';card.className='method-note a400-basis-card';
 const summary=document.createElement('summary');summary.textContent='A-1000 wastewater layout basis';card.append(summary);
 const c=A1000_BASIS.calculated,table=document.createElement('table');table.innerHTML='<thead><tr><th>Screening input / inventory</th><th>Value</th></tr></thead>';
 for(const [label,value]of [['Layout flow — unverified total',c.designFlowM3H+' m³/h'],['A-400 permeate duty',c.a400PermeateM3H+' m³/h'],['T-1006 nominal envelope',c.equalizationNominalM3+' m³'],...Object.entries(c.reactors).map(([tag,v])=>[tag.replace('R','R-')+' nominal envelope',v.nominalM3+' m³']),['A-2000','Connected reclaimed-water treatment; see A-2000 basis']]){const row=document.createElement('tr');for(const value2 of [label,value]){const cell=document.createElement('td');cell.textContent=value2;row.append(cell);}table.append(row);}card.append(table);
 const note=document.createElement('p');note.className='small-note';note.textContent='Tank envelopes use flow × residence time with freeboard. Equalization adds normal inventory, interrupted outflow and drainback. PFD-listed duties and proposed auxiliaries are distinguished in Design status mode. Values describe this layout; they are not approved operating capacities.';card.append(note);
 const holds=document.createElement('details'),title=document.createElement('summary');title.textContent='Assumptions requiring confirmation';holds.append(title);for(const text of A1000_BASIS.holds){const p=document.createElement('p');p.className='small-note';p.textContent=text;holds.append(p);}card.append(holds);parent.append(card);
}

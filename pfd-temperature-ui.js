import {temperatureCapability,renderThermalCapability} from './thermal-capability.js';
import {equipmentTemperatures,formatTemperature,temperatureBands,temperatureSourceHref} from './pfd-temperatures.js';
export function renderTemperatureRecord(root,record,phase){
 root.replaceChildren();
 const title=document.createElement('strong');title.textContent=record.tag+' · '+record.label;
 const value=document.createElement('p');value.className='pfd-temperature-value';value.textContent=formatTemperature(phase);
 const band=document.createElement('span');band.className='pfd-temperature-bands';
 for(const b of temperatureBands(phase)){const chip=document.createElement('span');chip.textContent=b.label;chip.style.borderColor=b.colour;band.append(chip);}
 const basis=document.createElement('p');basis.textContent=phase.label+' · '+phase.status;
 const note=document.createElement('p');note.textContent=record.note;
 const source=document.createElement('a');source.href=temperatureSourceHref(record.page);source.target='_blank';source.rel='noopener';source.textContent='PFD V5.1 · original PDF page '+record.page+' ↗';
 root.append(title,value,band,basis,note,source);
 for(const text of record.limits||[]){const p=document.createElement('p');p.className='review-note';p.textContent=text;root.append(p);}
}
export function renderEquipmentTemperatures(root,tag,model){
 const rows=equipmentTemperatures(tag);root.replaceChildren();root.hidden=!rows.length;
 if(!rows.length)return;
 const title=document.createElement('h3');title.textContent='PFD temperature basis';root.append(title);
 for(const row of rows){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=row.label+' · '+row.phases.map(formatTemperature).join(' / ');details.append(summary);
  for(const phase of row.phases){const section=document.createElement('div');section.className='pfd-temperature-record';renderTemperatureRecord(section,row,phase);if(model)renderThermalCapability(section,temperatureCapability(model,row,phase));details.append(section);}root.append(details);
 }
 const note=document.createElement('p');note.textContent='Draft process targets and limits. These do not establish component, jacket-fluid or external-surface temperature.';root.append(note);
}

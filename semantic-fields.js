// Pure presentation helpers: never promote harvested evidence to current values.
export const formatValue=v=>v==null||v===''?'Not recorded':Array.isArray(v)?v.map(formatValue).join(' – '):typeof v==='object'?JSON.stringify(v):String(v);
export function fieldLabel(path){
 const key=path.split('.').at(-1), known={workingVolumeM3:'Working volume (m³)',totalVolumeM3:'Total volume (m³)',capacityM3:'Capacity (m³)',designPressure:'Design pressure',designTemperature:'Design temperature',materialOfConstruction:'Material of construction'};
 return known[key]||key.replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/^./,s=>s.toUpperCase());
}
export function propertyFields(asset,rows=[],section='design'){
 const block=asset[section]||{}, paths=new Set(Object.keys(block).filter(k=>k!=='status').map(k=>section+'.'+k));
 for(const r of rows)if(r.property.startsWith(section+'.'))paths.add(r.property);
 // An unspecified generic capacity must not obscure explicit working / total volumes.
 if(block.capacityM3==null&&[...paths].some(p=>/\.(workingVolumeM3|totalVolumeM3)$/.test(p)))paths.delete(section+'.capacityM3');
 return [...paths].map(path=>{
  const evidence=rows.filter(r=>r.property===path),current=path.split('.').reduce((v,k)=>v?.[k],asset);
  const present=current!==null&&current!==undefined&&current!=='';
  const hold=asset.dataLayer?.identityHold?.reason||evidence.find(r=>r.identityHold)?.identityHold;
  const approved=evidence.some(r=>r.status==='approved'&&!r.identityHold)&&!hold;
  const status=hold?'Identity reconciliation pending':present?(approved?'Approved source applied':'Model basis — see provenance'):evidence.length?(evidence.every(r=>r.status==='superseded')?'Superseded — revised value pending':evidence.some(r=>r.status==='conflict')?'Source conflict — decision pending':'Source values available — not approved'):'No source value recorded';
  return {path,label:fieldLabel(path),current:present?formatValue(current):null,status,evidence,hold};
 });
}

export function presentField(field){
 const key=field.path.split('.').at(-1);
 const suffixes=[['M3','m³'],['Kgh','kg/h'],['Kw','kW'],['Kwh','kWh'],['Hours','h'],['WtPct','wt%'],['Mm','mm'],['M2','m²'],['M','m'],['Kg','kg'],['C','°C']];
 const suffix=suffixes.find(([s])=>key.endsWith(s));
 const approved=field.evidence.find(r=>r.status==='approved'&&!r.identityHold);
 const units=[...new Set(field.evidence.map(r=>r.unit).filter(Boolean))];
 let unit=approved?.unit||(units.length===1?units[0]:suffix?.[1]||'');
 let label=field.label.replace(/ \(m³\)$/,'');
 if(suffix&&!/volume|capacity/i.test(key))label=fieldLabel(key.slice(0,-suffix[0].length));
 label=label.replace(/alternativematerial/i,'Alternative material').replace(/\bKw\b/g,'kW').replace(/\bPfd\b/g,'PFD');
 const status=field.hold?'Hold':field.current!==null?(/Approved/.test(field.status)?'Approved':'Model basis'):/Superseded/.test(field.status)?'Superseded':/conflict/.test(field.status)?'Conflict':field.evidence.length?'Pending review':'Missing';
 const group=/Volume|capacity|Diameter|Height|Length|Width|fillRatio/i.test(key)?'Capacity & dimensions':/material|lining|substrate|corrosion|seal/i.test(key)?'Materials':/cooling|heating|jacket|utility|duty|power|gas|vent/i.test(key)?'Utilities & duties':field.path.startsWith('operatingEnvelope.')?'Operating conditions':'Mechanical design';
 const alternatives=[...new Map(field.evidence.filter(r=>String(r.approvedValue||r.value).trim()!=='').map(r=>[JSON.stringify([r.approvedValue||r.value,r.unit||'']),{value:r.approvedValue||r.value,unit:r.unit||''}])).values()];
 let display=field.current;
 if(field.hold){display='—';unit='';}
 else if(display===null){
  if(!alternatives.length){display='—';unit='';}
  else if(alternatives.length>3)display='Multiple values ('+alternatives.length+')';
  else {const mixed=new Set(alternatives.map(r=>r.unit)).size>1;display=alternatives.map(r=>formatValue(r.value)+(mixed&&r.unit?' '+r.unit:'')).join(' / ');if(mixed)unit='';else unit=alternatives[0].unit||unit;}
 }
 return {...field,label,unit,status,group,display,alternatives};
}
export function overviewFields(fields){
 const priority=['workingVolumeM3','totalVolumeM3','capacityM3','ratedFlowM3h','flowM3h','dutyKw','motorPowerKw','reactionTemperatureTargetC','operatingTemperatureC','designPressure','designTemperature','materialOfConstruction','operatingMode'];
 const rank=f=>{const n=priority.indexOf(f.path.split('.').at(-1));return n<0?100:n;};
 return fields.filter(f=>rank(f)<100).sort((a,b)=>rank(a)-rank(b)).slice(0,8);
}

import {THERMAL_SERVICES} from './a5000-basis.js';

// Necessary temperature condition only. Never a duty, UA, LMTD, time or safety test.
export function temperatureWindow({direction,targetMinC,targetMaxC,supplyRangeC}){
 if(!['heat','cool'].includes(direction)||![targetMinC,targetMaxC,...(supplyRangeC||[])].every(Number.isFinite)||supplyRangeC?.length!==2||targetMinC>targetMaxC||supplyRangeC[0]>supplyRangeC[1])return {status:'unknown',marginK:null,qualified:false};
 const targetC=direction==='heat'?targetMaxC:targetMinC;
 const marginK=direction==='heat'?supplyRangeC.map(t=>t-targetC):[targetC-supplyRangeC[1],targetC-supplyRangeC[0]];
 return {status:marginK[1]<=0?'incompatible':marginK[0]<=0?'boundary':'temperature-window-only',targetC,marginK,qualified:false};
}
export function temperatureCapability(model,record,phase){
 const consumers=model.thermalUtilities?.consumers||[],id=/^DR-601-in$|^HX-601-medium$/.test(record.id)?'HX-601':record.tag;
 const consumer=consumers.find(c=>c.id===id),secondary=model.thermalUtilities?.secondaries[consumer?.circuit];
 const isPreG=/^R-141[ABCD]$/.test(record.tag),primaryId=isPreG?(phase.id==='cooldown'?'TCU-141-COOL':'TCU-141'):secondary?.primaryConsumer;
 const primary=secondary?consumers.find(c=>c.id===primaryId):consumer,service=primary?.service,cfg=THERMAL_SERVICES[service];
 const direction=isPreG?(phase.id==='cooldown'?'cool':'heat'):['D-164','FD-166','HX-601'].includes(id)?'heat':consumer?'cool':null;
 const sourceTag=cfg?model.equipment[cfg.generation]?.tag:null;
 const chain=consumer?(secondary?[sourceTag,primary?.tag,secondary.circuit,record.tag]:[sourceTag,consumer.tag]).filter(Boolean):[];
 const result=temperatureWindow({direction,targetMinC:phase.minC,targetMaxC:phase.maxC,supplyRangeC:cfg?.supplyRangeC});
 const base={...result,id:record.id,tag:record.tag,area:record.area,phase:phase.id,phaseLabel:phase.label,page:record.page,direction,service:service||null,sourceTag,chain,supplyRangeC:cfg?.supplyRangeC||null,secondary:secondary?.circuit||null,secondarySupplyC:null,secondaryReturnC:null,qualified:false,liveData:false};
 const conflicts=(record.limits||[]).filter(t=>/conflict/i.test(t));
 if(id==='HX-601'){
  const comparison=temperatureWindow({direction:'heat',targetMinC:140,targetMaxC:145,supplyRangeC:THERMAL_SERVICES.hw.supplyRangeC});
  return {...base,status:'unselected-source',headline:'Heating source is unselected',reason:'HX-601 remains blinded. Draft air inlet: 140–145 °C. Even the 95 °C upper hot-water supply is below the 140 °C lower air target; ordinary hot-water heat exchange cannot provide it.',comparison:{...comparison,service:'hw',connected:false},required:'Select steam, gas or electric heating and qualify evaporation duty, air flow, inlet/outlet temperatures and safeguards.'};
 }
 if(!cfg||consumer?.status==='unresolved'||result.status==='unknown')return {...base,status:'unknown',headline:'Thermal capability is not established',reason:!consumer?'No process-specific thermal allocation is mapped for this location.':!cfg?'No selected primary service is mapped.':'The process target is unspecified; the connection alone cannot establish performance.',required:'Confirm the process target, selected service, duty, flow and exchanger performance.'};
 const gap=result.marginK.map(n=>Number(n.toFixed(2))).join('–');
 const labels={'incompatible':'Source temperature cannot reach this target','boundary':'Temperature range includes a zero or adverse difference','temperature-window-only':'Temperature direction is possible; performance is unqualified'};
 const reason=`${chain.join(' → ')}. Primary supply ${cfg.supplyRangeC.join('–')} °C; ${direction==='cool'?'lowest':'highest'} process target ${result.targetC} °C. Limiting source-to-process difference: ${gap} K.`+(secondary?' This difference must accommodate both the primary exchanger and process jacket/coil; secondary temperatures are unknown.':' This comparison excludes exchanger approach and fouling.');
 return {...base,headline:labels[result.status],reason,conflicts,required:'Confirm peak/normal duty, UA, flows, fouling, both terminal temperature differences and batch duration. A positive difference does not qualify capacity or cooling-failure protection.'};
}
export function renderThermalCapability(root,result){
 const el=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;return node;};
 const section=el('section','');section.className='thermal-capability';
 section.append(el('strong',result.headline),el('p',result.reason),el('p',result.required));
 for(const note of result.conflicts||[])section.append(el('p',note));root.append(section);
}

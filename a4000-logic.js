import {A4000_SCENARIOS} from './a4000-basis.js';
// These are illustrative inspection responses, not PLC or safety-system logic.
export function airScenario(key='normal'){
 if(!A4000_SCENARIOS.some(([id])=>id===key))throw Error('Unknown air inspection state');
 const loss=['powerLoss','dryerFault','highDewPoint','maintenance','reserveEmpty'].includes(key),reserve=loss&&key!=='reserveEmpty';
 const a=!['aFault','powerLoss','maintenance','condensateHigh','reserveEmpty'].includes(key),b=['aFault'].includes(key);
 const feed=!loss&&key!=='condensateHigh',priority=feed&&!['lowPressure','serviceDemand','filterDP'].includes(key);
 return {key,label:A4000_SCENARIOS.find(([id])=>id===key)[1],compressorA:a,compressorB:b,qualityRelease:feed,serviceAir:priority,processContact:false,instrumentAir:key!=='reserveEmpty',reserveOnly:reserve||key==='condensateHigh',capacityVerified:false,
 states:{'XV-4001A':a,'XV-4001B':b,'XV-AD4001-IN':key!=='maintenance','XV-AD4001-OUT':key!=='maintenance','XV-QA4001':feed,'XV-IA4001':key!=='reserveEmpty','XV-PA4001':priority,'XV-PC4001':false},
 reason:key==='normal'?'Illustrative lead A, standby B. Delivered capacity and air quality still require qualification.':key==='aFault'?'Start B in this scenario. Essential-duty capacity and restart time are not verified.':key==='bFault'?'A continues; standby availability is lost.':key==='filterDP'?'Shed service demand and alarm; prove minimum consumer pressure. Filter replacement requires isolation.':key==='lowPressure'?'Shed noncritical use; initiate process-specific protective response before minimum actuator pressure is lost.':key==='serviceDemand'?'Close service-air branch to protect instrument-air reserve.':key==='reserveEmpty'?'No instrument-air supply credited. Execute the qualified process safe-state sequence; fail actions remain open.':key==='condensateHigh'?'Stop compression to avoid liquid carryover; retain only qualified stored dry air while collection is serviced.':'Stop accepting unqualified air and shed service demand. Previously qualified dry reserve has finite, unverified endurance. No wet-air bypass is credited.',
 qualification:'Conceptual response only. Reserve requires proven previous quality, pressure and valve behavior; no duration is guaranteed.'};
}
export function calculateAir(i){
 const names=['normalNm3H','peakNm3H','purgeNm3H','leakNm3H','growthNm3H','oneCompressorNm3H','receiverM3','highBarg','lowBarg','temperatureC','criticalNm3H','requiredMinutes'];
 if(names.some(k=>i[k]===''||i[k]===null||i[k]===undefined||!Number.isFinite(Number(i[k]))))return {status:'HOLD',reason:'Enter all documented inputs; blanks are unknown, not zero.'};
 const v=Object.fromEntries(names.map(k=>[k,Number(i[k])]));
 if(names.filter(k=>k!=='temperatureC').some(k=>v[k]<0)||v.temperatureC<=-273.15||v.highBarg<=v.lowBarg||v.lowBarg<=0||v.receiverM3<=0||v.criticalNm3H<=0||v.oneCompressorNm3H<=0||v.peakNm3H<v.normalNm3H||v.requiredMinutes<=0)return {status:'INVALID',reason:'Use nonnegative flows, peak ≥ normal, positive reserve/duty, high pressure > positive minimum, and physical temperature.'};
 const total=v.normalNm3H+v.purgeNm3H+v.leakNm3H+v.growthNm3H,peak=v.peakNm3H+v.purgeNm3H+v.leakNm3H+v.growthNm3H;
 const pHigh=v.highBarg*100+101.325,pLow=v.lowBarg*100+101.325,normalStored=v.receiverM3*(pHigh-pLow)/101.325*273.15/(v.temperatureC+273.15),minutes=normalStored/v.criticalNm3H*60;
 return {status:'SCREEN ONLY',totalNm3H:total,peakNm3H:peak,usableNormalM3:normalStored,reserveMinutes:minutes,oneUnitNormalFits:v.oneCompressorNm3H>=total,oneUnitPeakFits:v.oneCompressorNm3H>=peak,reserveFits:minutes>=v.requiredMinutes,reason:'Isothermal ideal-gas screen at 0°C / 101.325 kPa. No pressure-drop, rapid-withdrawal or vendor performance qualification; geometry unchanged.'};
}
export function applyAirScenario(model,key){const state=airScenario(key),byId=new Map(model.parts.map(p=>[p.id,p]));for(const valve of model.valves.filter(v=>v.airSystem)){const open=state.states[valve.tag]??valve.normalState==='open',p=byId.get(valve.discId);if(p)p.quaternion.copy(open?p.openQuaternion:p.closedQuaternion);valve.inspectionOpen=open;}model.compressedAir.inspectionState=state;return state;}

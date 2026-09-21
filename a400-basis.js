// One metre per model unit. Supplier envelopes and provisional process inputs are separate.
export const A400_INPUTS = {
 revision:'A400-30',source:'A400_TLGO_Washing_Stream_Table_V17.xlsx',
 drySolidsKgH:106,slurryDensityKgM3:1020,permeateKgH:71355,permeateDensityKgM3:1005,
 washInventoryM3:20,washSolidsFraction:.02,drainbackM3:1,transferAllowanceM3:2,maxFillFraction:.8,
 permeateNormalInventoryM3:5,outletInterruptionMinutes:30,peakFlowFactor:1.2,permeateDrainbackM3:1,
 membraneAreaM2PerModule:120,sustainedFluxLMH:72,availability:.9,
 sources:{drySolidsKgH:'Design Basis & Inputs C13',slurryDensityKgM3:'Design Basis & Inputs C53',permeateKgH:'Design Basis & Inputs C38',permeateDensityKgM3:'Design Basis & Inputs C54',washInventoryM3:'VSEP 84 Model C25 — screening input, not selected vessel capacity',membrane:'VSEP 84 Model C31:C35 — screening only'},
 assumptions:'2 wt% washing from draft PFD 1–2 wt% range; 1 m³ drainback, 2 m³ transfer allowance, 80% maximum fill; 5 m³ normal permeate inventory, 30-minute outlet interruption and 1.2 peak factor are proposed layout inputs. Confirm against batch schedule, piping hold-up, control response and downstream acceptance.',
 conflicts:['Eight modules do not meet the V17 71 m³/h duty at the selected area, flux and availability.','Draft PFD 1–2 wt% wash concentration differs from V17 5.5 wt% maximum / 5 wt% product assumptions. Tank inventory is not throughput approval.','V17 includes downstream filter / RO recycle equipment; this revision retains the reviewed PFD wastewater interface. Reconcile before extending A-400 scope.','Vendor drawing shows four feed pumps; utility sheet lists six including two hot spares. Four connected pump positions plus a reserved spare bay are shown; vendor confirmation required.','Actual GO pH, metallurgy, membrane retention, TMP, vibration loads, cleaning and lifting details remain unqualified.']
};
// User-entered layout scenarios are URL-local and do not overwrite the reference workbook.
if(typeof location!=='undefined'||globalThis.rgoModelQuery!==undefined){
 try{const values=JSON.parse(new URLSearchParams(globalThis.rgoModelQuery??location.search).get('a400')||'{}'),limits={washInventoryM3:[.1,100],washSolidsFraction:[.001,.1],drainbackM3:[0,20],transferAllowanceM3:[0,20],maxFillFraction:[.5,.95],permeateNormalInventoryM3:[0,50],outletInterruptionMinutes:[1,120],peakFlowFactor:[1,2],permeateDrainbackM3:[0,20]};
 for(const[key,[min,max]]of Object.entries(limits))if(typeof values[key]==='number'&&Number.isFinite(values[key])&&values[key]>=min&&values[key]<=max)A400_INPUTS[key]=values[key];
 }catch{} }
export const VSEP_LAYOUT={source:'New Logic Research 84 Multiple Module System — 8 Modules, pages 2–5, 2020',sourceFile:'vsep-eight-module-reference.pdf',moduleCount:8,length:11.315,depth:5.464,height:4.929,frameWidth:1.194,frameGap:.229,frameHeight:2.525,packHeight:2.134,packRadius:.49,origin:[14.5,0,20],feedSkid:{x:18.1,z:24.24,width:3.962,depth:2.184},cipSkid:{x:22.25,z:24.24,width:1.219,depth:1.753},chemicalSkid:{x:24.72,z:24.24,width:1.6,depth:1.7}};
export function calculateA400(i=A400_INPUTS){
 for(const key of ['drySolidsKgH','slurryDensityKgM3','permeateDensityKgM3','washInventoryM3','membraneAreaM2PerModule','sustainedFluxLMH'])if(!(i[key]>0))throw Error('Positive A-400 input required: '+key);
 if(!(i.maxFillFraction>0&&i.maxFillFraction<1)||!(i.washSolidsFraction>0&&i.washSolidsFraction<1)||!(i.availability>0&&i.availability<=1))throw Error('Invalid A-400 fraction');
 for(const key of ['permeateKgH','drainbackM3','transferAllowanceM3','permeateNormalInventoryM3','outletInterruptionMinutes','peakFlowFactor','permeateDrainbackM3'])if(!Number.isFinite(i[key])||i[key]<0)throw Error('Invalid A-400 allowance: '+key);
 const permeateM3H=i.permeateKgH/i.permeateDensityKgM3,peakM3H=permeateM3H*i.peakFlowFactor,
 t402RequiredM3=(i.washInventoryM3+i.drainbackM3+i.transferAllowanceM3)/i.maxFillFraction,
 t403SurgeM3=peakM3H*i.outletInterruptionMinutes/60,
 t403RequiredM3=(i.permeateNormalInventoryM3+t403SurgeM3+i.permeateDrainbackM3)/i.maxFillFraction,
 moduleRate=i.membraneAreaM2PerModule*i.sustainedFluxLMH*i.availability/1000;
 return {permeateM3H,peakM3H,t402RequiredM3,t402NominalM3:Math.ceil(t402RequiredM3/5)*5,t403SurgeM3,t403RequiredM3,t403NominalM3:Math.ceil(t403RequiredM3/5)*5,drySolidsInventoryKg:i.washInventoryM3*i.slurryDensityKgM3*i.washSolidsFraction,feedEquivalentHours:i.washInventoryM3*i.slurryDensityKgM3*i.washSolidsFraction/i.drySolidsKgH,moduleRate,eightModuleRate:moduleRate*8,sevenModuleRate:moduleRate*7,requiredOperatingModules:Math.ceil(permeateM3H/moduleRate),capacityMargin:8*moduleRate/permeateM3H-1};
}
// Exact integral of the illustrative tank's inner meridian, excluding nozzle bores.
export function tankInteriorVolume(radius,bottom,top){const r=radius-.025,p=[[0,bottom-.275],[.045,bottom-.275],[r,bottom+.015],[r,top-.015],[.04,top+.2],[0,top+.2]];return p.slice(1).reduce((n,[b,y],j)=>{const [a,x]=p[j];return n+Math.PI*(y-x)*(a*a+a*b+b*b)/3;},0);}
function vessel(tag,label,x,z,radius,volume){const bottom=1.15,base=tankInteriorVolume(radius,bottom,bottom),top=bottom+(volume-base)/(Math.PI*(radius-.025)**2);return {tag,label:label.replace(/\d+ m³ nominal/,volume+' m³ nominal'),x,z,radius,bottom,top,labelY:top+1.7,areaId:'A-400',capacityM3:volume,geometryStatus:'Calculated conceptual inventory; vessel dimensions and head shape are proposed',geometryBasis:'A400-30 inventory calculation; nominal internal volume excludes nozzle bores'};}
const c=calculateA400();
export const A400_EQUIPMENT={32:vessel('T-402','Diafiltration tank · 30 m³ nominal',10.5,20,1.7,c.t402NominalM3),33:{tag:'TFF-401',label:'VSEP · eight 84-inch filter packs',x:20,z:21,labelY:5.8,areaId:'A-400',designStatus:'proposed',geometryStatus:'Supplier-scaled package envelope; detailed internals and pipework proposed'},34:vessel('T-403','Permeate buffer · 65 m³ nominal',29.3,21.3,2.25,c.t403NominalM3),35:{tag:'BL-A400',label:'Washing utilities / wastewater interface',x:26,z:28,labelY:5.5,areaId:'A-400'},124:{tag:'CIP-401',label:'VSEP cleaning package',x:22.25,z:24.24,labelY:3.4,areaId:'A-400',designStatus:'proposed'}};
export const A400_BASIS={inputs:A400_INPUTS,calculated:c,supplier:VSEP_LAYOUT,tanks:{T402:A400_EQUIPMENT[32],T403:A400_EQUIPMENT[34]},status:'Proposed layout — eight-module capacity shortfall; tank allowances require confirmation'};

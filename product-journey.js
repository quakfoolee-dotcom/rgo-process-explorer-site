import {createPathIndex,pointSegmentDistanceSquared} from './path-index.js';

// This directed presentation follows product-bearing streams. Inventory steps
// are declared batch transformations, never added pipes or hydraulic shortcuts.
export const JOURNEY_STAGES=[
 ['graphite','A-100','Graphite premixing','#ffd166','Graphite / premix'],
 ['preg','A-140','Pre-G synthesis','#f4a261','Pre-G synthesis slurry'],
 ['recovery','A-160','Fixing, filtration and drying','#e9b5ff','Recovered Pre-G'],
 ['oxidation','A-200','GO oxidation','#c8a3ff','GO reaction slurry'],
 ['washing','A-300','Quench, separation and washing','#73c9ff','Washed GO slurry'],
 ['membranes','A-400','Diafiltration and concentration','#53d9c4','Retained GO suspension'],
 ['sonication','A-500','Sonication and conditioning','#a9e77e','Conditioned suspension'],
 ['drying','A-600','Spray drying and powder recovery','#ffb871','Dry powder'],
 ['thermal','A-700','Thermal treatment and cooling','#ff8c99','Cooled rGO'],
 ['doping','A-800','Mixing, pyrolysis and product release','#f2d77c','Qualified product handoff'],
 ['pelletizing','A-900','Contained pellet formation and finishing','#64d7c6','Packaged pellets']
].map(([id,area,title,color,material])=>({id,area,title,color,material}));
export const JOURNEY_NOTE='Illustrative material progression. Timing, particle counts and colours do not represent measured flow, yield, temperature or residence time. A-900 pellet formation and finishing remain conceptual; no technology, package performance or acceptance criteria are approved.';
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const pointKey=p=>p.map(v=>Math.round(v*1e5)).join(',');
const routeEnd=(label,end=0,owner)=>({route:label,end,owner});
const port=(label,owner)=>({port:label,owner});
const edgeEnd=(name,end=0,owner)=>({edge:name,end,owner});
const allowedService=s=>!s||!(/acid|sulfur|phosphor|peroxide|KMnO|K2S2O8|P2O5|waste|filtrate|permeate|centrate|cool|thermal|heating|vent|relief|argon|nitrogen|oxygen|instrument|sensing|CIP|clean|drain|air|water|vacuum|vapor|condensate|equalization|KBH4$/i.test(s))||['Concentrate','Powder / argon','rGO / KBH4 mixture','Moist gas / fines'].includes(s);

export const JOURNEY_BRANCHES={pregBranch:[...'ABCD'],reactorBranch:[...'ABCD'],pump:[...'AB'],membrane:[...'ABCDEFGH']};
export function journeyDefinition(model,{pregBranch='A',reactorBranch='A',pump='A',membrane='A'}={}){
 const choices={pregBranch,reactorBranch,pump,membrane},included={};
 for(const [key,letters] of Object.entries(JOURNEY_BRANCHES)){const value=choices[key];if(value!=='All'&&!letters.includes(value))throw Error('Invalid product journey branch');included[key]=value==='All'?letters:[value];}
 const mark=(start,bank,branch,operationPrefix)=>{const letters=included[bank];for(let i=start;i<steps.length;i++)Object.assign(steps[i],{bank,branch,branchIndex:letters.indexOf(branch)+1,branchCount:letters.length,operation:operationPrefix+'-'+(i-start)});};
 const steps=[];let at=null;
 const move=(stage,label,to,via=[],note='',owners=[])=>{steps.push({kind:'transfer',stage,label,from:at,to,via,note,owners});at=to;};
 const process=(stage,label,owner,to,note='Batch inventory; internal movement is illustrative.',duration=4)=>{steps.push({kind:'inventory',stage,label,owner,owners:[owner],from:at,to,note,duration});at=to;};
 at=routeEnd('H101 gravity hopper passage');
 move('graphite','Charge graphite into R-101',port('R-101 graphite feed'),[],'Contained graphite charging.',[38,36]);
 process('graphite','Mix the graphite premix',36,port('R-101 bottom outlet'));
 // Each alternative starts from the same premix source and ends at T-161.
 // Replaying a bank is explicitly an alternative, never serial reactor flow.
 const premix=at;
 for(const branch of included.pregBranch){const r141=39+'ABCD'.indexOf(branch),start=steps.length;at=premix;
  move('preg','Fill R-141'+branch,port('R-141'+branch+' premix inlet'),[], 'One synthesis branch is demonstrated at a time; other branch isolation valves remain closed.',[36,r141]);
  process('preg','Synthesize Pre-G in R-141'+branch,r141,port('R-141'+branch+' bottom outlet'),'Illustrative reaction / hold. Reagent addition and thermal qualification remain separate.');
  move('preg','Transfer R-141'+branch+' synthesis slurry to T-161',port('T-161 synthesis slurry inlet'),[], '',[r141,44]);
  mark(start,'pregBranch',branch,'preg');steps[start].alternativeStart=branch!==included.pregBranch[0];
 }
 process('recovery','Fix and retain slurry in T-161',44,port('T-161 bottom outlet'),'Dilution, mixing and settling are separate operations; decanted waste is outside the product trace.');
 move('recovery','Circulate through P-162',port('T-161 recycle return'),[routeEnd('P-162 recycle to T-161')],'Illustrative circulation before transfer.',[44]);
 process('recovery','Retain the fixing inventory',44,port('T-161 bottom outlet'));
 move('recovery','Fill holding tank T-162',port('T-162 holding slurry inlet'),[], '',[44,45]);
 process('recovery','Hold slurry for filtration',45,port('T-162 bottom outlet'));
 const design=model.designScenario||'baseline';
 if(design==='baseline'||design==='dryer'){
  move('recovery','Feed F-161 through P-164',routeEnd('F-161 cake release'),[], 'Product remains as retained cake; filtrate leaves by a separate route.',[45,46]);
  process('recovery','Filter and wash retained cake',46,routeEnd('F-161 cake release'),'Cake release follows filtration and washing; no product animation through the filtrate outlet.');
  if(design==='baseline'){
   move('recovery','Load cake using TR-164',routeEnd('D-164 tray loading and unloading'),[], 'Powered tray carriage, not liquid piping.',[46,48,47]);
   process('recovery','Dry, cool and equalize D-164',47,routeEnd('D-164 tray loading and unloading'),'Illustrative isolated batch. Loading and unloading are separate from drying.',6);
  }else{
   move('recovery','Transfer cake to D-164',port('D-164 material inlet'),[], 'Selected conical dryer alternative.',[46,97,47]);
   process('recovery','Dry, cool and equalize D-164',47,port('D-164 dry product outlet'),'Illustrative isolated batch.',6);
  }
 }else if(design==='elevated'){
  move('recovery','Feed F-161 on the PL-161 deck through P-164',routeEnd('F-161 cake release'),[], 'Product remains as retained cake; filtrate returns to T-163 by a separate route.',[45,98,46]);
  process('recovery','Filter and wash retained cake',46,routeEnd('F-161 cake release'),'The drip trays open only after washing; no product animation through the filtrate outlet.');
  move('recovery','Drop washed cake by chute into D-164',port('D-164 material inlet'),[], 'Gravity chute through SDV-164-IN; TR-164 deleted.',[46,99,47]);
  process('recovery','Dry, cool and equalize D-164',47,port('D-164 dry product outlet'),'Illustrative isolated batch in the paddle dryer.',6);
 }else{
  const integrated=design==='integrated',tag=integrated?'FD-166':'F-161',owner=integrated?92:46;
  move('recovery','Feed '+tag,port(tag+' material inlet'),[], 'Selected A-160 design configuration.',[45,98,owner]);
  process('recovery','Filter and wash '+tag,owner,port(tag+' cake outlet above filter'),'Product is retained while filtrate is removed.');
  if(!integrated){move('recovery','Transfer retained cake to D-164',port('D-164 material inlet'),[],'Contained receiver and screw transfer.',[46,100,97,47]);process('recovery','Dry, cool and equalize D-164',47,port('D-164 dry product outlet'),'Illustrative isolated batch.',6);}
  else process('recovery','Dry, cool and equalize FD-166',92,port('FD-166 cake outlet above filter'),'Filtration and drying occur sequentially in the same inventory.',6);
 }
 const recovered=at;
 for(const branch of included.reactorBranch){const r201={A:1,B:2,C:54,D:55}[branch],hopper={A:20,B:21,C:56,D:57}[branch],start=steps.length;at=recovered;
  move('oxidation','Distribute dry Pre-G to H-201'+branch,routeEnd('H-201'+branch+' gravity solids passage'),[],'Powered handling follows this branch only.',[49,50,hopper]);
  move('oxidation','Meter Pre-G into R-201'+branch,port('R-201'+branch+' Pre-G inlet'),[], 'SF-201 feeder and contained charging passage.',[hopper,r201]);
  process('oxidation','Oxidize in R-201'+branch,r201,edgeEnd('Product transfer outlet neck',0,r201),'Reaction and hold are illustrative; acid, oxidizer and utility streams remain separate.',6);
  const outlet=at;
  for(const pumpBranch of included.pump){at=outlet;
   move('oxidation','Collect R-201'+branch+' through P-206'+pumpBranch+' into T-303',routeEnd('T-303 inlet reducer'),[routeEnd('P-206'+pumpBranch+' discharge start',1)],pump==='All'?'Alternative duty path demonstration; only this pump operates. No additional batch or combined pump duty is implied.':'One selected transfer pump. The other pump and reactor outlets remain isolated.',[r201,62,4]);
   Object.assign(steps.at(-1),{pumpBranch,pumpIndex:included.pump.indexOf(pumpBranch)+1,pumpCount:included.pump.length,alternativeStart:pumpBranch!==included.pump[0]});
  }
  mark(start,'reactorBranch',branch,'oxidation');steps[start].alternativeStart=branch!==included.reactorBranch[0];
  // Both alternative pumps represent the same collection operation.
  for(const step of steps.slice(start))if(step.pumpBranch)step.operation='oxidation-collect';
 }
 process('washing','Quench and hold in T-303',4,routeEnd('Receiver drain and discharge'),'Advance represents accepted quench completion, not an operating instruction.',5);
 move('washing','Feed and separate in C-301',routeEnd('C-301 scroll solids passage',1),[routeEnd('C-301 scroll solids passage')],'Follow concentrate. Centrate goes to a separate wastewater route.',[4,30]);
 move('washing','Receive concentrate in T-305',port('T-305 quenched slurry inlet'),[], '',[30,28]);
 process('washing','Wash and retain slurry in T-305',28,port('T-305 bottom outlet'),'Mixing, settling and liquor removal precede accepted product transfer.');
 move('membranes','Transfer washed slurry into T-402',port('T-402 washed slurry inlet'),[], '',[28,32]);
 process('membranes','Receive the diafiltration inventory',32,port('T-402 bottom outlet'));
 const membraneSource=at,membranePaths=included.membrane.map(branch=>({from:membraneSource,to:port('T-402 retentate return'),via:[routeEnd('TFF-401'+branch+' filter-pack retentate passage'),routeEnd('TFF-401'+branch+' filter-pack retentate passage',1)],branch,owners:[32,33]}));
 move('membranes',membrane==='All'?'Circulate through TFF-401A–H':'Circulate through TFF-401'+membrane,port('T-402 retentate return'),membranePaths[0].via,membrane==='All'?'Included, available membrane branches circulate in parallel. Marker counts do not imply equal flow. Retentate returns to T-402; permeate is excluded.':'Selected membrane branch. Retentate returns to T-402; permeate is excluded.',[32,33]);
 Object.assign(steps.at(-1),{bank:'membrane',branch:membrane,branchCount:included.membrane.length,operation:'membrane-circulate',parallel:membrane==='All',pathBranch:membranePaths[0].branch,sidePaths:membranePaths.slice(1)});
 process('membranes','Accept the washed suspension',32,port('T-402 bottom outlet'),'Wash/concentration endpoint is illustrative; no removal efficiency is assumed.');
 move('sonication','Receive suspension in T-501',port('T-501 washed suspension inlet'),[], '',[32,63]);
 process('sonication','Hold the sonication inventory',63,port('T-501 bottom outlet'));
 move('sonication','Circulate through US-501 and E-501',routeEnd('T-501 cooled return nozzle',1),[routeEnd('US-501A acoustic flow passage'),routeEnd('US-501C acoustic flow passage',1)],'Three sonication cells and process cooling; utility water stays separate.',[63,64,65,66]);
 process('sonication','Accept the conditioned suspension',63,port('T-501 bottom outlet'));
 move('drying','Transfer accepted suspension to T-601',port('T-601 accepted sonication inlet'),[], '',[63,67,69]);
 process('drying','Buffer dryer feed in T-601',69,port('T-601 bottom outlet'));
 move('drying','Meter suspension to the atomizer',port('DR-601 atomizer feed'),[], '',[69,70,71]);
 process('drying','Atomize and dry in DR-601',71,routeEnd('DR-601 powder settling passage'),'Illustrative evaporation and powder formation; kinetics, gas flow and yield are not simulated.',6);
 move('drying','Recover chamber powder into T-602',port('T-602 chamber powder inlet'),[], 'Fines collected in F-601 also return to T-602; no split fraction or yield is assigned.',[71,77]);
 steps.at(-1).sidePaths=[{from:port('DR-601 powder laden exhaust'),to:port('T-602 filter powder inlet'),via:[routeEnd('F-601 captured powder passage')],owners:[71,74,77],note:'Fines recovery through F-601; illustrative split.'}];
 process('drying','Hold recovered powder',77,port('T-602 bottom outlet'),'Powder is released only after the illustrated quality/cooling acceptance.');
 move('thermal','Lift powder into LK-701',port('LK-701 inlet'),[], 'Powered TR-701 transfer.',[77,79,80]);
 process('thermal','Isolate and condition transfer lock',80,port('LK-701 outlet'),'Sequential lock operation; the two isolation boundaries are not opened together.');
 move('thermal','Fill H-701 buffer',port('H-701 inlet'),[], '',[80,81]);
 process('thermal','Buffer furnace feed',81,port('H-701 outlet'));
 move('thermal','Convey and thermally treat in PY-701',routeEnd('PY-701 solids discharge passage',1),[routeEnd('PY-701 solids passage'),routeEnd('PY-701 solids passage',1)],'Product follows the conveying passage. Argon and off-gas paths are separate.',[81,82,83]);
 move('thermal','Cool through E-702 into T-702',port('T-702 inlet'),[], 'Product-cooler duty remains proposed.',[84,85]);
 process('thermal','Accept cooled rGO in T-702',85,port('T-702 outlet'));
 move('doping','Lift and meter rGO into MX-801',port('MX-801 F-801 inlet'),[routeEnd('F-801 metered solids passage')],'Product passes through TR-801, H-801 and F-801. The separate co-feed is identified at mixing.',[101,102,104,106]);
 process('doping','Mix the rGO and specified co-feed',106,port('MX-801 discharge'),'KBH₄ has its own dosing circuit. The highlighted lineage follows rGO, with no implied mass ratio.');
 move('doping','Receive mixed solids in H-803',port('H-803 inlet'),[], '',[106,107]);
 process('doping','Hold mixed furnace feed',107,port('H-803 outlet'));
 move('doping','Meter, pyrolyze and cool in PY-801',port('PY-801 cooled product outlet'),[routeEnd('PY-801 process passage'),routeEnd('PY-801 process passage',1)],'Illustrative process passage and cooling; thermal performance is not calculated.',[107,108,109]);
 move('doping','Release product to adjacent A-900',routeEnd('A-900 short contained product transfer',0),[], 'The A-800 acceptance boundary remains subject to qualified product and receiver criteria.',[109,200]);
 move('pelletizing','Transfer product into H-901',port('H-901 contained product inlet'),[], 'TR-901 is a short contained transfer function; its technology is HOLD.',[200,201]);
 process('pelletizing','Buffer and weigh product in H-901',201,port('H-901 bottom outlet'),'Inert atmosphere and capacity criteria remain unresolved.');
 move('pelletizing','Meter product into PG-901',routeEnd('PG-901 pellet-formation passage',1),[routeEnd('F-901 metered product passage'),routeEnd('F-901 metered product passage',1)],'Illustrative contained path; pelletization technology and formulation are unresolved.',[201,202,203]);
 move('pelletizing','Cool, classify and collect A-900 product',routeEnd('PK-901 accepted product release',1),[routeEnd('SC-901 cooling and classification passage'),routeEnd('SC-901 cooling and classification passage',1)],'Accepted route through SC-901 and PK-901; pellet, package and release criteria remain open.',[204,205,208]);
 return steps.map((s,i)=>({...s,id:'journey-'+i,operation:s.operation||s.label,duration:s.duration||6}));
}

// Split at real centreline contacts, including branch ends on the middle of a
// header. Never use equipment proximity to connect a path.
export function createJourneyNetwork(model,{acceptEdge}={}){
 const routes=new Map(model.routes.map(r=>[r.id,r]));
 const candidates=model.edges.map((e,index)=>({...e,index})).filter(e=>acceptEdge?acceptEdge(e,routes.get(e.routeId)):allowedService(e.service||routes.get(e.routeId)?.service)&&!['filter medium permeation'].includes(e.transport));
 const index=createPathIndex(candidates),splits=candidates.map(e=>[...(e.path||[e.a,e.b])]);
 for(const e of candidates)for(const p of [e.a,e.b])for(const j of index.at(p))splits[j].push(p);
 const nodes=new Map(),adj=new Map();const addPoint=p=>{const key=pointKey(p);if(!nodes.has(key)){nodes.set(key,p);adj.set(key,[]);}return key;};
 candidates.forEach((e,j)=>{const path=e.path||[e.a,e.b];for(let k=1;k<path.length;k++){
  const a=path[k-1],b=path[k],ps=[...new Map(splits[j].filter(p=>pointSegmentDistanceSquared(p,a,b)<1e-10).map(p=>[pointKey(p),p])).values()].sort((p,q)=>distance(p,a)-distance(q,a));
  for(let n=1;n<ps.length;n++){const from=addPoint(ps[n-1]),to=addPoint(ps[n]),length=distance(ps[n-1],ps[n]);if(length<1e-7)continue;const info={index:e.index,part:e.part,tag:e.barrierTag,routeId:e.routeId,length};adj.get(from).push({...info,to});if(!e.oneWay)adj.get(to).push({...info,to:from});}
 }});
 function resolve(ref){if(Array.isArray(ref))return ref;if(ref.port){const p=model.ports.filter(p=>p.label===ref.port&&(ref.owner==null||p.reactor===ref.owner));if(p.length!==1)throw Error('Unresolved or ambiguous port: '+ref.port);return p[0].point;}
  const rows=ref.route?model.routes.filter(r=>r.label===ref.route&&(ref.owner==null||r.reactor===ref.owner)):model.edges.filter(e=>e.name===ref.edge&&(ref.owner==null||e.reactor===ref.owner));if(rows.length!==1)throw Error('Unresolved or ambiguous path: '+(ref.route||ref.edge));const r=rows[0];return ref.route?r.endpoints[ref.end||0]:r[ref.end?'b':'a'];}
 function path(from,to,{closed=new Set(),excluded=new Set()}={}){
  const a=resolve(from),b=resolve(to),start=pointKey(a),end=pointKey(b);if(start===end)return {segments:[],length:0,from:a,to:b};
  if(!nodes.has(start)||!nodes.has(end))throw Error('Endpoint has no product-bearing connection');
  const cost=new Map([[start,0]]),prev=new Map(),queue=[[0,start]],done=new Set();
  while(queue.length){queue.sort((a,b)=>b[0]-a[0]);const [d,at]=queue.pop();if(done.has(at))continue;done.add(at);if(at===end)break;
   for(const edge of adj.get(at)){if(closed.has(edge.tag)||excluded.has(edge.index)||done.has(edge.to))continue;const nd=d+edge.length;if(nd<(cost.get(edge.to)??Infinity)){cost.set(edge.to,nd);prev.set(edge.to,{...edge,from:at});queue.push([nd,edge.to]);}}
  }
  if(!prev.has(end))throw Error('No connected product path between the specified interfaces');const segments=[];let at=end;while(at!==start){const e=prev.get(at);segments.unshift({...e,a:nodes.get(e.from),b:nodes.get(at)});at=e.from;}
  return {segments,length:cost.get(end),from:a,to:b};
 }
 return {resolve,path,candidates};
}

export function compileJourney(model,choices={},network=createJourneyNetwork(model)){
 const steps=journeyDefinition(model,choices),allIds=new Set(),allTags=new Set(),findings=[];
 const compilePath=spec=>{const points=[spec.from,...spec.via||[],spec.to],segments=[];for(let i=1;i<points.length;i++)segments.push(...network.path(points[i-1],points[i]).segments);let length=0;for(const s of segments){s.start=length;length+=s.length;s.end=length;}return {segments,length,branch:spec.pathBranch||spec.branch};};
 for(const step of steps){step.paths=[];step.partIds=new Set();step.tags=new Set();try{
  step.startPoint=network.resolve(step.from);step.endPoint=network.resolve(step.to);
  if(step.kind==='transfer'){step.paths.push(compilePath(step));for(const side of step.sidePaths||[])step.paths.push(compilePath(side));}
  else {const eq=model.equipment[step.owner];if(!eq)throw Error('Inventory equipment is absent');step.center=[eq.x,Number.isFinite(eq.bottom)&&Number.isFinite(eq.top)?(eq.bottom+eq.top)/2:(step.startPoint[1]+step.endPoint[1])/2,eq.z||0];}
  for(const p of step.paths)for(const s of p.segments){step.partIds.add(s.part);if(s.tag)step.tags.add(s.tag);}
  // Include only traversed conduit elements, never the unused remainder of a header.
  for(const valve of model.valves)if(step.tags.has(valve.tag))for(const id of valve.partIds||[])step.partIds.add(id);
  step.status='connected';
 }catch(error){step.status='unresolved';step.issue=error.message;findings.push({step:step.id,label:step.label,reason:error.message});}
 for(const id of step.partIds)allIds.add(id);for(const tag of step.tags)allTags.add(tag);
 }
 // Parallel selection applies to the whole bank, including branches that are
 // absent from this journey. A previously selected inspection cannot leak in.
 const isolatedTags=new Set(allTags);
 for(const valve of model.valves)if(/^(XV-(?:PM|OUT)141[ABCD]|XV-(?:PGLOAD|PG|COL|BOT201|SA|PA|OX|SMP201|SMR201|SMV201|CIP201|DR201|RC)-[ABCD]|XV-P206[AB]-(?:IN|OUT)|XV-TFF-[A-H]-(?:IN|RET|PERM|DR))$/.test(valve.tag||''))isolatedTags.add(valve.tag);
 return {steps,stages:JOURNEY_STAGES,choices,allIds,allTags,isolatedTags,findings,endpoint:'A-900 accepted packaged-pellet boundary',illustrative:true};
}

export const journeySegmentKey=s=>[pointKey(s.a),pointKey(s.b)].sort().join('|');
export function pointOnJourneyPath(path,fraction){if(!path.segments.length)return null;const d=Math.max(0,Math.min(1,fraction))*path.length;const s=path.segments.find(s=>s.end>=d)||path.segments.at(-1),t=s.length?(d-s.start)/s.length:0;return s.a.map((v,k)=>v+(s.b[k]-v)*t);}
// For a parallel membrane bank, a local closure removes that branch from the
// circulating set. A shared-header closure (or no available branches) stops it.
export function journeyPathStates(step,closed=new Set()){
 return step.paths.map(path=>{const segment=path.segments.find(s=>closed.has(s.tag));return {path,available:!segment,block:segment?{tag:segment.tag,fraction:path.length?segment.start/path.length:0,point:segment.a}:null};});
}
export function journeyValveConfiguration(plan,step,closed=new Set()){
 const tags=step.parallel?new Set(journeyPathStates(step,closed).filter(s=>s.available).flatMap(s=>s.path.segments.map(e=>e.tag).filter(Boolean))):step.tags;
 return Object.fromEntries([...plan.isolatedTags].map(tag=>[tag,tags.has(tag)&&!closed.has(tag)?'open':'closed']));
}
export function journeyBlock(step,closed){
 const states=journeyPathStates(step,closed);
 if(step.parallel&&states.some(s=>s.available))return null;
 const blocks=states.map(s=>s.block).filter(Boolean).sort((a,b)=>a.fraction-b.fraction);
 if(step.parallel&&blocks.length)return {...blocks[0],fraction:0,reason:'All included membrane paths are isolated.'};
 return blocks[0]||null;
}
// Match the semantic operation across bank expansion, never a shifted row index.
export function matchJourneyStep(plan,previous){
 const candidates=plan.steps.map((s,i)=>({s,i})).filter(({s})=>s.operation===previous.operation);
 const score=s=>(s.branch===previous.branch?2:0)+(s.pumpBranch===previous.pumpBranch?1:0);
 if(candidates.length)return candidates.sort((a,b)=>score(b.s)-score(a.s))[0].i;
 return Math.max(0,plan.steps.findIndex(s=>s.stage===previous.stage));
}

export function createJourneyPlayer(plan,onChange=()=>{}){
 const state={index:0,elapsed:0,playing:false,speed:1,finished:false,blocked:null,closed:new Set()};
 const notify=()=>onChange(state,plan.steps[state.index]);
 const api={state,plan,play(){if(state.finished){state.index=0;state.elapsed=0;state.finished=false;}state.playing=true;state.blocked=null;api.update(0);notify();},pause(){state.playing=false;notify();},seek(index,fraction=0){state.index=Math.max(0,Math.min(plan.steps.length-1,index));state.elapsed=Math.max(0,Math.min(1,fraction))*plan.steps[state.index].duration;state.finished=false;state.blocked=null;api.update(0);notify();},close(tag){state.closed=new Set(tag?[tag]:[]);state.blocked=null;api.update(0);notify();},update(dt){const step=plan.steps[state.index];if(step.status!=='connected'){const changed=!state.blocked;state.playing=false;state.blocked={reason:step.issue};if(changed)notify();return;}
  const limit=journeyBlock(step,state.closed);if(limit&&state.elapsed/step.duration>=limit.fraction){const changed=!state.blocked;state.elapsed=step.duration*limit.fraction;state.playing=false;state.blocked=limit;if(changed)notify();return;}
  if(!state.playing)return;state.elapsed+=Math.max(0,dt)*state.speed;
  if(limit&&state.elapsed/step.duration>=limit.fraction){state.elapsed=step.duration*limit.fraction;state.playing=false;state.blocked=limit;notify();return;}
  if(state.elapsed>=step.duration){state.elapsed=0;if(state.index===plan.steps.length-1){state.elapsed=step.duration;state.playing=false;state.finished=true;}else state.index++;notify();api.update(0);}
 }};return api;
}

import {JOURNEY_STAGES,JOURNEY_NOTE,createJourneyNetwork,compileJourney,createJourneyPlayer,matchJourneyStep,journeyPathStates} from './product-journey.js';
import {annotateJourneyPassages} from './journey-marker-scale.js';
import {createJourneyDrawing} from './product-journey-view.js';
import {resolveJourneyReview,compareReviewViews} from './journey-review.js';
import {mountJourneyReview} from './journey-review-ui.js';

export function mountProductJourney({model,parts,meshes,scene,getCamera,getHeight,getEquipmentIds,onEnter,onLeave,onStep,onFit,onColors,getReviewView,getReviewEvidence,captureReviewImage,onStateChange=()=>{}}){
 const host=document.getElementById('product-journey');if(!host)return null;
 const $=id=>document.getElementById(id);let network=null,plan=null,player=null,active=false,stepIndex=-1,lastUI=0,restore=null;
 const drawing=createJourneyDrawing({scene,meshes,parts,getCamera,getHeight}),cache=new Map(),byId=new Map(parts.map(p=>[p.id,p]));
 let partColors=new Map(),allIds=new Set(),currentIds=new Set();
 let reviewBaseline=null,reviewRange=null,reviewSession=0;
 const current=()=>plan?.steps[player?.state.index||0],stage=()=>JOURNEY_STAGES.find(s=>s.id===current()?.stage);
 const choices=()=>({pregBranch:$('journey-preg').value,reactorBranch:$('journey-reactor').value,pump:$('journey-pump').value,membrane:$('journey-membrane').value});
 const color=step=>$('journey-colors').checked?JOURNEY_STAGES.find(s=>s.id===step.stage).color:'#ffd166';
 function decorate(next){annotateJourneyPassages(next,parts);next.equipment=model.equipment;for(const step of next.steps){step.frameIds=new Set(step.partIds);step.highlightIds=new Set(step.partIds);const owners=new Set(step.owners);for(const id of step.partIds){const p=byId.get(id);if(p&&model.equipment[p.reactor]?.packageParentId)owners.add(p.reactor);}
   for(const owner of owners){if(owner===33)continue;for(const id of getEquipmentIds(owner)||[]){step.frameIds.add(id);const p=byId.get(id);if(p&&['shell','head','internal'].includes(p.system)&&!p.pneumaticPackage)step.highlightIds.add(id);}}
  }return next;}
 function buildPlan(){network||=createJourneyNetwork(model);const c=choices(),key=JSON.stringify(c);if(!cache.has(key)){if(cache.size>=8)cache.delete(cache.keys().next().value);cache.set(key,decorate(compileJourney(model,c,network)));}return cache.get(key);}
 function recolor(){partColors=new Map();allIds=new Set();for(const step of plan.steps){for(const id of step.frameIds)allIds.add(id);for(const id of step.highlightIds){const ownStage=JOURNEY_STAGES.find(s=>s.area===model.equipment[byId.get(id)?.reactor]?.areaId);partColors.set(id,$('journey-colors').checked&&!step.partIds.has(id)&&ownStage?ownStage.color:color(step));}}drawing.setColors($('journey-colors').checked);onColors();legend();}
 function legend(){const el=$('journey-legend');el.replaceChildren();for(const s of JOURNEY_STAGES){const row=document.createElement('span'),swatch=document.createElement('i');swatch.style.background=$('journey-colors').checked?s.color:'#ffd166';row.append(swatch,document.createTextNode(s.area));row.title=s.title;el.append(row);}}
 function setStep(){if(!active)return;const s=current();currentIds=s.frameIds;drawing.setStage(s.highlightIds,$('journey-xray').checked);onStep(s,plan,player.state);if($('journey-follow').checked)onFit(currentIds);stepIndex=player.state.index;render();}
 function render(){if(!player)return;const s=current(),st=stage(),state=player.state,problem=state.blocked;
  if($('journey-review-play')&&!$('journey-review-play').disabled)$('journey-review-play').textContent=state.playing?'Pause review segment':'Play review segment';
  onStateChange({active,playing:state.playing});
  $('journey-controls').hidden=false;$('journey-play').textContent=state.playing?'Pause product flow':state.finished?'Replay product flow':'Play product flow';$('journey-play').setAttribute('aria-pressed',String(state.playing));
  $('journey-stage').value=s.stage;$('journey-step').textContent=(state.index+1)+' / '+plan.steps.length+' · '+s.label;
  $('journey-material').textContent=st.area+' · '+st.material;
  const branches=[];
  if(s.bank==='pregBranch')branches.push('R-141'+s.branch+' · branch '+s.branchIndex+' of '+s.branchCount+(s.branchCount>1?' · alternative batch demonstration':''));
  if(s.bank==='reactorBranch')branches.push('R-201'+s.branch+' · branch '+s.branchIndex+' of '+s.branchCount+(s.branchCount>1?' · alternative batch demonstration':''));
  if(s.pumpBranch)branches.push('P-206'+s.pumpBranch+' · duty path '+s.pumpIndex+' of '+s.pumpCount);
  if(s.bank==='membrane'){const paths=journeyPathStates(s,state.closed),available=paths.filter(p=>p.available);branches.push('TFF-401 · '+available.length+' of '+paths.length+' included branches available'+(s.parallel?' · parallel circulation':''));const isolated=paths.filter(p=>!p.available).map(p=>p.path.branch);if(isolated.length)branches.push('Isolated: '+isolated.join(', '));}
  $('journey-branch-status').textContent=branches.join(' · ');$('journey-branch-status').hidden=!branches.length;
  $('journey-status').textContent=problem?(problem.tag?'Stopped at closed '+problem.tag+'. Open the demonstration isolation to continue.':'Unresolved connection: '+problem.reason):state.finished?'Reached the A-900 handoff. Cartridge filling is not modeled.':(state.playing?'Playing · ': 'Paused · ')+(s.kind==='inventory'?'Processing / holding inventory. ':'Transferring material. ')+s.note;
  $('journey-status').dataset.issue=String(!!problem);$('journey-next').disabled=state.index===plan.steps.length-1;$('journey-previous').disabled=state.index===0;
  $('journey-progress').value=(state.index+state.elapsed/s.duration)/plan.steps.length*100;
  $('journey-open').textContent=active?'Route highlighted':'Trace product route';$('journey-open').setAttribute('aria-pressed',String(active));
 }
 function makePlayer(){return createJourneyPlayer(plan,()=>{if(!active)return;if(stepIndex!==player.state.index)setStep();else{onStep(current(),plan,player.state);render();}});}
 function configurePlan(){drawing.setPlan(plan,$('journey-colors').checked);recolor();
  const select=$('journey-block');select.replaceChildren(new Option('No simulated closure',''));for(const tag of [...plan.allTags].sort())select.append(new Option(tag,tag));
  $('journey-findings').textContent=plan.findings.length?plan.findings.length+' connection(s) need review. Playback stops at each unresolved step.':'All '+plan.steps.length+' model steps connected.';
 }
 function enter(animated=false){if(model.scope==='future')return;if(!active){plan=buildPlan();reviewBaseline=getReviewView?.();reviewSession++;restore=onEnter();active=true;player=makePlayer();configurePlan();
   $('journey-controls').hidden=false;setStep();onFit(animated?currentIds:allIds);
  }
  if(animated){reviewRange=null;player.state.speed=+$('journey-speed').value;player.play();}else player.pause();render();}
 function leave(){if(!active)return;active=false;reviewRange=null;player.state.playing=false;onStateChange({active:false,playing:false});drawing.hide();partColors.clear();allIds.clear();currentIds.clear();stepIndex=-1;$('journey-controls').hidden=true;$('journey-open').textContent='Trace product route';$('journey-open').setAttribute('aria-pressed','false');onLeave(restore);restore=null;}
 function prepareReview(variant){
  if(!getReviewEvidence?.().webglAvailable)throw new Error('A working WebGL view is required. The review remains pending.');
  if(variant.restore){if(!active||!reviewBaseline)throw new Error('Start a journey review from your chosen view before testing restoration.');const before=reviewBaseline;leave();const after=getReviewView();return {restore:true,session:reviewSession,before,after,comparison:compareReviewViews(before,after)};}
  for(const id of ['journey-preg','journey-reactor','journey-pump','journey-membrane'])$(id).value='All';
  $('journey-follow').checked=false;enter(false);player.pause();const nextPlan=buildPlan();
  const result=resolveJourneyReview(nextPlan,variant);plan=nextPlan;player=makePlayer();stepIndex=-1;configurePlan();
  $('journey-marker-mode').value=result.overview?'overview':'inspection';$('journey-marker-mode').onchange();$('journey-xray').checked=result.xray;
  $('journey-speed').value='0.5';player.state.speed=.5;player.close(result.closure);$('journey-block').value=result.closure;
  player.seek(result.index,result.fraction);drawing.update(player);onFit(result.frameIds);reviewRange=null;
  return {restore:false,session:reviewSession,index:result.index,endIndex:result.endIndex,fraction:result.fraction,closure:result.closure,overview:result.overview,xray:result.xray,label:current().label,endLabel:plan.steps[result.endIndex].label};
 }
 function reviewMatches(prepared){
  if(!prepared||prepared.session!==reviewSession)return false;
  if(prepared.restore){const stable=v=>{if(!v)return v;const {activePanel,workspaceMode,...rest}=v;return rest;};return !active&&compareReviewViews(stable(prepared.after),stable(getReviewView?.())).matches;}
  const view=getReviewView?.();return active&&view?.amount===0&&!view?.section.enabled&&Object.values(plan.choices).every(v=>v==='All')&&player.state.index>=prepared.index&&player.state.index<=prepared.endIndex&&[...player.state.closed].join('')===prepared.closure&&$('journey-xray').checked===prepared.xray&&($('journey-marker-mode').value==='overview')===prepared.overview;
 }
 function playReview(prepared){if(!reviewMatches(prepared))throw new Error('The view settings changed. Prepare the review again.');if(player.state.playing){player.pause();reviewRange=null;return;}reviewRange=prepared;if(player.state.index===prepared.endIndex&&player.state.elapsed/current().duration>=.999){player.seek(prepared.index,prepared.fraction);}player.play();}
 const api={enter,leave,openArea(area){const wanted=JOURNEY_STAGES.find(s=>s.area===area);if(!wanted)return false;enter(false);reviewRange=null;player.pause();const index=plan.steps.findIndex(s=>s.stage===wanted.id);if(index<0)return false;player.seek(index);onFit(currentIds);return true;},prepareReview,playReview,reviewMatches,pauseReview(){reviewRange=null;if(active)player.pause();},get active(){return active;},get plan(){return plan;},get player(){return player;},get currentIds(){return currentIds;},get allIds(){return allIds;},getColor:id=>active?partColors.get(id):null,navigation(){if(active&&$('journey-follow').checked){$('journey-follow').checked=false;}},update(dt,now){if(!active)return;if(reviewRange&&player.state.playing&&player.state.index===reviewRange.endIndex&&player.state.elapsed+dt*player.state.speed>=current().duration){player.pause();player.seek(reviewRange.endIndex,.999999);}else player.update(dt);drawing.update(player);if(now-lastUI>150){lastUI=now;$('journey-progress').value=(player.state.index+player.state.elapsed/current().duration)/plan.steps.length*100;}},getState:()=>active?{active,index:player.state.index,label:current().label,playing:player.state.playing,finished:player.state.finished,blocked:player.state.blocked,choices:plan.choices,fraction:player.state.elapsed/current().duration,closed:[...player.state.closed],markerMode:$('journey-marker-mode').value,xray:$('journey-xray').checked,branch:current().branch,pump:current().pumpBranch,steps:plan.steps.length,findings:plan.findings,illustrative:true}: {active:false}};
 $('journey-open').onclick=()=>enter(false);$('journey-exit').onclick=leave;
 $('journey-play').onclick=()=>{reviewRange=null;player.state.playing?player.pause():player.play();};$('journey-restart').onclick=()=>{reviewRange=null;player.pause();player.seek(0);};
 $('journey-previous').onclick=()=>{reviewRange=null;player.pause();player.seek(player.state.index-1);};$('journey-next').onclick=()=>{reviewRange=null;player.pause();player.seek(player.state.index+1);};
 $('journey-stage').replaceChildren(...JOURNEY_STAGES.map(s=>new Option(s.area+' · '+s.title,s.id)));
 $('journey-stage').onchange=()=>{const wanted=$('journey-stage').value;reviewRange=null;player.pause();player.seek(plan.steps.findIndex(s=>s.stage===wanted));};
 $('journey-progress').oninput=()=>{const pos=+$('journey-progress').value/100*plan.steps.length;reviewRange=null;player.pause();player.seek(Math.min(plan.steps.length-1,Math.floor(pos)),pos>=plan.steps.length?1:pos%1);};
 $('journey-speed').onchange=()=>{if(player)player.state.speed=+$('journey-speed').value;};
 $('journey-colors').onchange=()=>{legend();if(active)recolor();};$('journey-xray').onchange=()=>{if(active)drawing.setStage(current().highlightIds,$('journey-xray').checked);};
 $('journey-follow').onchange=()=>{if(active&&$('journey-follow').checked)onFit(currentIds);};$('journey-fit').onclick=()=>onFit(currentIds);
 $('journey-block').onchange=()=>player.close($('journey-block').value);
 for(const id of ['journey-preg','journey-reactor','journey-pump','journey-membrane'])$(id).onchange=()=>{
  if(!active)return;reviewRange=null;const previous=current(),fraction=player.state.elapsed/previous.duration,speed=player.state.speed,closed=new Set(player.state.closed);player.pause();
  plan=buildPlan();player=makePlayer();player.state.speed=speed;player.state.closed=new Set([...closed].filter(tag=>plan.allTags.has(tag)));stepIndex=-1;configurePlan();
  const index=matchJourneyStep(plan,previous),next=plan.steps[index],same=next.operation===previous.operation&&next.branch===previous.branch&&next.pumpBranch===previous.pumpBranch;
  $('journey-block').value=[...player.state.closed][0]||'';player.seek(index,same?fraction:0);
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)player.pause();});
 $('journey-marker-mode').onchange=()=>{drawing.setOverview($('journey-marker-mode').value==='overview');$('journey-marker-note').textContent=$('journey-marker-mode').value==='overview'?'Enlarged symbols may extend beyond pipes.':'Markers fit modeled passages; unknown bores are approximated.';};
 $('journey-note').textContent=JOURNEY_NOTE;legend();
 if(getReviewEvidence)api.review=mountJourneyReview({journey:api,getEvidence:getReviewEvidence,captureImage:captureReviewImage});
 if(model.scope==='future'){host.hidden=true;}return api;
}

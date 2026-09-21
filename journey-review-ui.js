import {JOURNEY_REVIEWS,reviewVariant,createJourneyReviewLog} from './journey-review.js';

function download(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function mountJourneyReview({journey,getEvidence,captureImage}){
 const $=id=>document.getElementById(id);if(!$('journey-review-case'))return;
 const log=createJourneyReviewLog();let prepared=null,screenshot=null;
 const choice=()=>reviewVariant($('journey-review-case').value,$('journey-review-variant').value);
 const message=text=>$('journey-review-message').textContent=text;
 function summary(){const records=log.export().records,clear=records.filter(r=>r.status==='clear').length,issues=records.filter(r=>r.status==='issue').length;$('journey-review-summary').textContent=clear+' / '+records.length+' views observed clear · '+issues+' with issues · '+records.filter(r=>r.status==='pending').length+' pending. Session results: export before leaving or reloading.';}
 function changeView(){journey.pauseReview();const {check,variant,key}=choice();prepared=null;screenshot=null;$('journey-review-expect').textContent=check.expect;
  $('journey-review-prepare').textContent=variant.restore?'Return & compare prior view':'Prepare review view';
  $('journey-review-play').disabled=true;$('journey-review-play').textContent='Play review segment';$('journey-review-capture').disabled=true;
  const record=log.get(key);$('journey-review-result').value=record?.status||'pending';$('journey-review-note').value=record?.note||'';message(record?'Saved observation retained. Prepare again to update it.':'No observation yet. Prepare this view first.');}
 function changeCase(){const check=JOURNEY_REVIEWS.find(c=>c.id===$('journey-review-case').value);$('journey-review-variant').replaceChildren(...check.variants.map(v=>new Option(v.title,v.id)));changeView();}
 function attempt(action){try{action();}catch(error){message(error.message);}}
 $('journey-review-case').replaceChildren(...JOURNEY_REVIEWS.map(c=>new Option(c.title,c.id)));
 $('journey-review-case').onchange=changeCase;$('journey-review-variant').onchange=changeView;
 $('journey-review-prepare').onclick=()=>attempt(()=>{
  const {variant,key}=choice();prepared=null;screenshot=null;
  const result=journey.prepareReview(variant);prepared={key,preparedAt:new Date().toISOString(),...result,evidence:getEvidence()};
  $('journey-review-play').disabled=!!variant.restore;$('journey-review-capture').disabled=false;
  $('journey-review-play').textContent='Play review segment';
  message(variant.restore?(result.comparison.matches?'Recorded view values match. Visually confirm the restored model before saving.':'View values differ: '+result.comparison.differences.join(', ')):'Prepared with All branches, explosion zero and section off. Pan, rotate or zoom; play the segment, then record what you see.');
 });
 $('journey-review-play').onclick=()=>attempt(()=>{if(!prepared||prepared.key!==choice().key)throw new Error('Prepare this review view first.');journey.playReview(prepared);$('journey-review-play').textContent=journey.player.state.playing?'Pause review segment':'Play review segment';});
 $('journey-review-capture').onclick=()=>attempt(()=>{
  if(!prepared||!journey.reviewMatches(prepared))throw new Error('Prepare this view again before capturing it.');
  const captured=captureImage(),name='rgo-review-'+prepared.key.replace('/','-')+'-'+Date.now()+'.png';
  download(captured.blob,name);screenshot={filename:name,capturedAt:new Date().toISOString(),evidence:captured.evidence};message('Viewport PNG requested for download. It excludes interface labels; export the report for camera and route settings.');
 });
 $('journey-review-save').onclick=()=>attempt(()=>{
  const {key}=choice(),status=$('journey-review-result').value;
  if(status!=='pending'&&prepared?.key!==key)throw new Error('Prepare this review view first.');
  if(status!=='pending'&&!journey.reviewMatches(prepared))throw new Error('The route settings changed. Prepare this view again before recording it.');
  log.record(key,{status,note:$('journey-review-note').value,prepared,observed:getEvidence(),screenshot});summary();message('Observation saved in this session. Export the review report to keep it.');
 });
 $('journey-review-export').onclick=()=>attempt(()=>{download(new Blob([JSON.stringify(log.export(),null,2)],{type:'application/json'}),'rgo-journey-visual-review.json');message('Review report requested for download. Pending views remain pending.');});
 changeCase();summary();return {log};
}

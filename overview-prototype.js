// Isolated staged-display prototype; full model remains authoritative. V181: envelopes rebuilt from the prepared model on each
// evidence build (overview-data.json) and coloured by data-layer coverage (overview-coverage.json); the selection card links
// the area review and the Semantic Plant Core record.
import * as T from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
const started=performance.now(),host=document.getElementById('overview'),status=document.getElementById('status'),select=document.getElementById('equipment');
let overviewData,coverage=null;
const COLORS={approved:0x5fd38d,held:0xf0b35a,documented:0x7fb2e5,record:0x8a9bb0,none:0x4a5563},SELECTED=0xffc675;
const CSS={approved:'#5fd38d',held:'#f0b35a',documented:'#7fb2e5',record:'#8a9bb0',none:'#4a5563'};
const coverageOf=id=>coverage?.items?.[String(id)]||null,colorOf=id=>COLORS[coverageOf(id)?.class||'none'];
const text=(tag,t)=>{const e=document.createElement(tag);e.textContent=t;return e;};
function legend(){const el=document.getElementById('legend');if(!coverage){el.textContent='Coverage data unavailable; envelopes uncoloured.';return;}el.replaceChildren(...Object.entries(coverage.classes).map(([k,label])=>{const s=document.createElement('span');s.style.setProperty('--c',CSS[k]);s.textContent=label+' ('+coverage.counts[k]+')';return s;}));}
function card(e){const c=document.getElementById('card');c.replaceChildren();if(!e){c.hidden=true;return;}const cov=coverageOf(e.id);c.hidden=false;
 const head=document.createElement('p');head.append(text('strong',e.tag),document.createTextNode(' · '+e.name+' · '+e.area+(e.designStatus?' · '+e.designStatus:'')));c.append(head);
 if(!cov)return;const dl=document.createElement('dl');dl.append(text('dt','Coverage'),text('dd',coverage.classes[cov.class]));
 const dd=document.createElement('dd');if(cov.records.length){cov.records.forEach((r,i)=>{if(i)dd.append(document.createElement('br'));dd.append(document.createTextNode(r.assetId+' ('+r.assetClassId+'): '+(r.identityHold?r.heldRows+' held':r.approvedRows+' approved')+', '+r.pendingRows+' pending, '+r.dataLayerRows+' harvested rows'));});}else dd.textContent='no semantic record bound to this equipment';
 dl.append(text('dt','Records'),dd);c.append(dl);
 const links=document.createElement('p');const link=(href,label,ext)=>{const a=document.createElement('a');a.href=href;a.textContent=label;if(ext){a.target='_blank';a.rel='noopener';}links.append(a);};
 if(cov.review)link(cov.review.href,e.area+' review '+cov.review.revision+(cov.review.reviewer?' · '+cov.review.reviewer:'')+' ↗',true);
 if(cov.records.length)link('./semantic-core.html#area-'+encodeURIComponent(e.area),'Semantic Plant Core ↗',true);
 link('./index.html','Open in full plant',false);c.append(links);}
try{
 const response=await fetch('./overview-data.json');if(!response.ok)throw Error('Overview data unavailable');const data=await response.json();overviewData=data;
 try{const cv=await fetch('./overview-coverage.json');if(cv.ok)coverage=await cv.json();}catch{}legend();document.getElementById('basis').textContent=(data.version?data.version+' · ':'')+data.date+' · '+data.basis+(coverage?' · Semantic Core '+coverage.semanticCoreVersion:'')+'. Pipe routes, stairs and engineering measurements require the full model.';
 const scene=new T.Scene();scene.background=new T.Color('#101f2e');const camera=new T.PerspectiveCamera(45,1,.1,5000),renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement),all=new T.Box3(),meshes=new Map();
 for(const e of data.equipment){const box=new T.Box3(new T.Vector3(...e.min),new T.Vector3(...e.max)),size=box.getSize(new T.Vector3());all.union(box);const mesh=new T.Mesh(new T.BoxGeometry(...size.toArray()),new T.MeshBasicMaterial({color:colorOf(e.id),wireframe:true}));mesh.position.copy(box.getCenter(new T.Vector3()));scene.add(mesh);meshes.set(String(e.id),{mesh,box,e});const option=new Option(e.area+' · '+e.tag+' · '+e.name,e.id);select.append(option);}
 function draw(){renderer.render(scene,camera);}
 function frame(box){const center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),distance=size.length()/(2*Math.tan(camera.fov*Math.PI/360)*Math.min(1,camera.aspect));controls.target.copy(center);camera.position.copy(center).add(new T.Vector3(1,.9,1).normalize().multiplyScalar(Math.max(8,distance*1.2)));controls.update();draw();}
 function resize(){renderer.setSize(host.clientWidth,host.clientHeight,false);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();draw();}new ResizeObserver(resize).observe(host);resize();frame(all);controls.addEventListener('change',draw);
 select.onchange=()=>{for(const [id,r]of meshes)r.mesh.material.color.setHex(id===select.value?SELECTED:colorOf(id));const selected=meshes.get(select.value);frame(selected?.box||all);document.getElementById('selection').textContent=selected?selected.e.tag+' · '+selected.e.name+' · simplified envelope':'Whole plant';card(selected?.e||null);};document.getElementById('reset').onclick=()=>{select.value='';select.onchange();};
 requestAnimationFrame(()=>{const elapsed=performance.now()-started;status.textContent=data.equipment.length+' envelopes ready · '+Math.round(elapsed)+' ms since overview module started. Module download time excluded; full model not loaded.';window.rgoOverviewTiming={moduleToFrameMs:elapsed,envelopes:data.equipment.length};});
 }catch(error){
 if(!overviewData){status.textContent='Overview data unavailable. Use “Open full plant” to continue.';console.error(error);}else{
 document.getElementById('controls-help').textContent='Choose equipment to frame its envelope; Reset overview returns to the whole plant.';
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.style.cssText='width:100%;height:100%;background:#101f2e';svg.setAttribute('role','img');svg.setAttribute('aria-label','Plant equipment envelopes, top view');host.replaceChildren(svg);
 const minX=Math.min(...overviewData.equipment.map(e=>e.min[0])),minZ=Math.min(...overviewData.equipment.map(e=>e.min[2])),maxX=Math.max(...overviewData.equipment.map(e=>e.max[0])),maxZ=Math.max(...overviewData.equipment.map(e=>e.max[2]));const whole=[minX-2,minZ-2,maxX-minX+4,maxZ-minZ+4].join(' ');svg.setAttribute('viewBox',whole);
 for(const e of overviewData.equipment){const rect=document.createElementNS(svg.namespaceURI,'rect');for(const [k,v]of Object.entries({x:e.min[0],y:e.min[2],width:e.max[0]-e.min[0],height:e.max[2]-e.min[2],fill:'none',stroke:CSS[coverageOf(e.id)?.class||'none'],'stroke-width':.15}))rect.setAttribute(k,v);const title=document.createElementNS(svg.namespaceURI,'title');title.textContent=e.tag+' · '+e.name;rect.append(title);svg.append(rect);select.append(new Option(e.area+' · '+e.tag+' · '+e.name,e.id));}
 select.onchange=()=>{const e=overviewData.equipment.find(e=>String(e.id)===select.value);svg.setAttribute('viewBox',e?[e.min[0]-2,e.min[2]-2,e.max[0]-e.min[0]+4,e.max[2]-e.min[2]+4].join(' '):whole);document.getElementById('selection').textContent=e?e.tag+' · '+e.name+' · simplified envelope':'Whole plant';card(e||null);};document.getElementById('reset').onclick=()=>{select.value='';select.onchange();};status.textContent='3D rendering unavailable on this device. Showing '+overviewData.equipment.length+' equipment envelopes in a 2D fallback; use the equipment selector to frame an item.';
 }
}


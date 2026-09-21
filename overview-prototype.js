// v115 · 2026-09-14: isolated staged-display prototype; full model remains authoritative.
import * as T from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
const started=performance.now(),host=document.getElementById('overview'),status=document.getElementById('status'),select=document.getElementById('equipment');
let overviewData;
try{
 const response=await fetch('./overview-data_v115_2026-09-14.json');if(!response.ok)throw Error('Overview data unavailable');const data=await response.json();overviewData=data;
 const scene=new T.Scene();scene.background=new T.Color('#101f2e');const camera=new T.PerspectiveCamera(45,1,.1,5000),renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement),all=new T.Box3(),meshes=new Map();
 for(const e of data.equipment){const box=new T.Box3(new T.Vector3(...e.min),new T.Vector3(...e.max)),size=box.getSize(new T.Vector3());all.union(box);const mesh=new T.Mesh(new T.BoxGeometry(...size.toArray()),new T.MeshBasicMaterial({color:0x51808e,wireframe:true}));mesh.position.copy(box.getCenter(new T.Vector3()));scene.add(mesh);meshes.set(String(e.id),{mesh,box,e});const option=new Option(e.area+' · '+e.tag+' · '+e.name,e.id);select.append(option);}
 function draw(){renderer.render(scene,camera);}
 function frame(box){const center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),distance=size.length()/(2*Math.tan(camera.fov*Math.PI/360)*Math.min(1,camera.aspect));controls.target.copy(center);camera.position.copy(center).add(new T.Vector3(1,.9,1).normalize().multiplyScalar(Math.max(8,distance*1.2)));controls.update();draw();}
 function resize(){renderer.setSize(host.clientWidth,host.clientHeight,false);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();draw();}new ResizeObserver(resize).observe(host);resize();frame(all);controls.addEventListener('change',draw);
 select.onchange=()=>{for(const [id,r]of meshes)r.mesh.material.color.setHex(id===select.value?0xffc675:0x51808e);const selected=meshes.get(select.value);frame(selected?.box||all);document.getElementById('selection').textContent=selected?selected.e.tag+' · '+selected.e.name+' · simplified envelope':'Whole plant';};document.getElementById('reset').onclick=()=>{select.value='';select.onchange();};
 requestAnimationFrame(()=>{const elapsed=performance.now()-started;status.textContent=data.equipment.length+' envelopes ready · '+Math.round(elapsed)+' ms since overview module started. Module download time excluded; full model not loaded.';window.rgoOverviewTiming={moduleToFrameMs:elapsed,envelopes:data.equipment.length};});
 }catch(error){
 if(!overviewData){status.textContent='Overview data unavailable. Use “Open full plant” to continue.';console.error(error);}else{
 document.getElementById('controls-help').textContent='Choose equipment to frame its envelope; Reset overview returns to the whole plant.';
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.style.cssText='width:100%;height:100%;background:#101f2e';svg.setAttribute('role','img');svg.setAttribute('aria-label','Plant equipment envelopes, top view');host.replaceChildren(svg);
 const minX=Math.min(...overviewData.equipment.map(e=>e.min[0])),minZ=Math.min(...overviewData.equipment.map(e=>e.min[2])),maxX=Math.max(...overviewData.equipment.map(e=>e.max[0])),maxZ=Math.max(...overviewData.equipment.map(e=>e.max[2]));const whole=[minX-2,minZ-2,maxX-minX+4,maxZ-minZ+4].join(' ');svg.setAttribute('viewBox',whole);
 for(const e of overviewData.equipment){const rect=document.createElementNS(svg.namespaceURI,'rect');for(const [k,v]of Object.entries({x:e.min[0],y:e.min[2],width:e.max[0]-e.min[0],height:e.max[2]-e.min[2],fill:'none',stroke:'#75afb8','stroke-width':.15}))rect.setAttribute(k,v);const title=document.createElementNS(svg.namespaceURI,'title');title.textContent=e.tag+' · '+e.name;rect.append(title);svg.append(rect);select.append(new Option(e.area+' · '+e.tag+' · '+e.name,e.id));}
 select.onchange=()=>{const e=overviewData.equipment.find(e=>String(e.id)===select.value);svg.setAttribute('viewBox',e?[e.min[0]-2,e.min[2]-2,e.max[0]-e.min[0]+4,e.max[2]-e.min[2]+4].join(' '):whole);document.getElementById('selection').textContent=e?e.tag+' · '+e.name+' · simplified envelope':'Whole plant';};document.getElementById('reset').onclick=()=>{select.value='';select.onchange();};status.textContent='3D rendering unavailable on this device. Showing '+overviewData.equipment.length+' equipment envelopes in a 2D fallback; use the equipment selector to frame an item.';
 }
}


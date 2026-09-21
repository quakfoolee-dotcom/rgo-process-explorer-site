import * as T from './vendor/three.module.js';
import {equipmentExplorePlan} from './equipment-explore.js?v=125';
import {REGISTER_REVISION} from './engineering-register.js';

export function drawingCameras(bounds, aspect) {
 const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const span=Math.max(size.x/aspect,size.z/aspect,size.z,size.y,.1)*1.16;
 const distance=Math.max(size.length()*3,1);
 return [[0,1,0],[1,1,1],[0,0,1],[1,0,0]].map((direction,i)=>{
  const height=i===1?Math.max(size.length(),.1)*1.16:span;
  const camera=new T.OrthographicCamera(-height*aspect/2,height*aspect/2,height/2,-height/2,.01,distance*3);
  camera.position.copy(center).add(new T.Vector3(...direction).normalize().multiplyScalar(distance));
  if(i===0)camera.up.set(0,0,-1);
  camera.lookAt(center);camera.updateMatrixWorld();return camera;
 });
}

export async function openEquipmentDrawing({model,equipmentId,register,showAccessories=false}) {
 const plan=equipmentExplorePlan(model,equipmentId,{showAccessories}),record=register[equipmentId];
 if(!plan||!record)throw Error('Select equipment with a modeled assembly first.');
 const dialog=document.createElement('dialog');dialog.className='equipment-drawing-dialog';
 dialog.innerHTML='<header><h2>Equipment drawing sheet</h2><button data-close aria-label="Close drawing sheet">×</button></header><div class="drawing-actions"><label>Paper <select data-paper><option value="A4">A4 landscape</option><option value="A3">A3 landscape</option></select></label><button data-print disabled>Print / Save as PDF</button><button data-save disabled>Download PNG</button></div><p data-status role="status">Preparing four views…</p><div class="drawing-preview"></div>';
 if(!document.querySelector('#equipment-drawing-css')){const link=document.createElement('link');link.id='equipment-drawing-css';link.rel='stylesheet';link.href=new URL('./equipment-drawing.css',import.meta.url);document.head.append(link);}
 document.body.append(dialog);dialog.showModal();
 let cancelled=false,url,frame;
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{cancelled=true;if(url)URL.revokeObjectURL(url);frame?.remove();dialog.remove();},{once:true});
 const status=dialog.querySelector('[data-status]');let renderer;const edges=new Map();
 const fill=new T.MeshPhongMaterial({color:0xe7ebee,shininess:12,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
 const line=new T.LineBasicMaterial({color:0x253441});
 try{
  await new Promise(r=>setTimeout(r,0));if(cancelled)return;
  renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(1480,900);renderer.setClearColor(0xffffff,1);
  const scene=new T.Scene();scene.add(new T.HemisphereLight(0xffffff,0xb8c3cf,2));const light=new T.DirectionalLight(0xffffff,2);light.position.set(6,10,8);scene.add(light);
  const bounds=new T.Box3();
  for(let i=0;i<plan.members.length;i++){
   const part=plan.members[i],mesh=new T.Mesh(part.geometry,fill);mesh.position.copy(part.operatingPosition||part.position);mesh.quaternion.copy(part.quaternion);mesh.scale.copy(part.scale);mesh.updateMatrixWorld();scene.add(mesh);
   part.geometry.computeBoundingBox();bounds.union(part.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
   if(!edges.has(part.geometry))edges.set(part.geometry,new T.EdgesGeometry(part.geometry,30));
   const outline=new T.LineSegments(edges.get(part.geometry),line);outline.position.copy(part.operatingPosition||part.position);outline.quaternion.copy(part.quaternion);outline.scale.copy(part.scale);scene.add(outline);
   if(i%150===0){await new Promise(r=>setTimeout(r,0));if(cancelled)return;}
  }
  const canvas=document.createElement('canvas');canvas.width=3200;canvas.height=2260;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,3200,2260);
  function text(value,x,y,size=30,color='#263745'){ctx.font=`${size}px Arial, sans-serif`;ctx.fillStyle=color;ctx.fillText(value,x,y,3060);}
  text(`${record.tag} · ${record.name||'Equipment'}`,80,90,48);text('EQUIPMENT DRAWING SHEET',80,145,26);text('Orthographic views · '+(showAccessories?'equipment with attached accessories':'equipment only')+' · not to scale',80,188,27);
  const cells=[[80,230],[1640,230],[80,1200],[1640,1200]],labels=['TOP · from +Y, −Z at top','ISOMETRIC · from +X / +Y / +Z','FRONT · looking from +Z','RIGHT SIDE · looking from +X'];
  const cameras=drawingCameras(bounds,1480/900);
  for(let i=0;i<4;i++){
   status.textContent=`Rendering ${i+1} of 4 views…`;await new Promise(r=>setTimeout(r,0));if(cancelled)return;
   renderer.render(scene,cameras[i]);const [x,y]=cells[i];ctx.drawImage(renderer.domElement,x,y,1480,900);text(labels[i],x,y+935,26);ctx.strokeStyle='#cad2d8';ctx.strokeRect(x,y,1480,900);
  }
  text(`${plan.members.length.toLocaleString()} assigned components · external services excluded · ${new Date().toISOString().slice(0,10)} UTC`,80,2190,25);
  text(`Model register: ${REGISTER_REVISION} · Concept model — not for fabrication.`,80,2230,24);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Image export failed.')),'image/png'));if(cancelled)return;
  url=URL.createObjectURL(blob);const image=document.createElement('img');image.src=url;image.alt=`${record.tag}: top, isometric, front and right-side assembly views`;dialog.querySelector('.drawing-preview').append(image);
  const filename=`${record.tag.replace(/[^a-z0-9_-]/gi,'_')}_drawing_${new Date().toISOString().slice(0,10)}.png`;
  dialog.querySelector('[data-save]').onclick=()=>{const a=document.createElement('a');a.href=url;a.download=filename;a.click();};
  dialog.querySelector('[data-print]').onclick=()=>{
   frame?.remove();frame=document.createElement('iframe');frame.title='Equipment drawing print';frame.style.cssText='position:fixed;width:1px;height:1px;left:-9999px;border:0';document.body.append(frame);
   const doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html><head><title>Equipment drawing</title></head><body></body></html>');doc.close();
   doc.title=record.tag+' Equipment drawing';const style=doc.createElement('style');style.textContent=`@page {size:${dialog.querySelector('[data-paper]').value} landscape;margin:8mm} html,body{margin:0;padding:0}img{display:block;width:100%;height:${dialog.querySelector('[data-paper]').value==='A3'?'280mm':'193mm'};object-fit:contain;break-inside:avoid}`;doc.head.append(style);
   const printImage=doc.createElement('img');printImage.alt=image.alt;printImage.onload=()=>{frame.contentWindow.focus();frame.contentWindow.print();};printImage.src=url;doc.body.append(printImage);
  };
  dialog.querySelectorAll('[data-print],[data-save]').forEach(b=>b.disabled=false);
  status.textContent='Ready. Top, front and side use the same scale. Save as PDF through your print dialog; turn off browser headers and footers.';
 }catch(error){if(!cancelled)status.textContent='Could not generate this sheet. Close and try again. '+error.message;}
 finally{for(const geometry of edges.values())geometry.dispose();fill.dispose();line.dispose();if(renderer){renderer.dispose();renderer.forceContextLoss();}}
}

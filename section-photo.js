// One high-resolution render on demand. Reuse the display renderer so clipping,
// antialiasing, ACES tone mapping and sRGB match the inspection view exactly.
// The canvas is copied before yielding; its size and helpers restore in finally.
import * as T from './vendor/three.module.js';
export function photoDimensions(width,height,maxEdge=4096,maxPixels=12000000,footer=96){
 if(!(width>0&&height>0&&maxEdge>=256))throw Error('The 3D view has no usable image size.');
 const scale=Math.min(maxEdge/width,(maxEdge-footer)/height,Math.sqrt(maxPixels/(width*height)));
 const w=Math.max(1,Math.floor(width*scale)),h=Math.max(1,Math.floor(height*scale));return {width:w,height:h,footer,totalHeight:h+footer};
}
export function sectionPhotoIdentity({tag,axis,value,flip,normal,configuration,capturedAt=new Date()}){
 const safe=String(tag||'visible-plant').replace(/[^a-zA-Z0-9_-]+/g,'-'),coordinate=value.toFixed(3),date=capturedAt.toISOString();
 const retained=(normal??(flip?1:-1))>0?'≥':'≤';
 return {filename:`${safe}_section-${axis.toUpperCase()}_${coordinate}m_${date.replace(/[:.]/g,'-')}.png`,
  title:`${tag||'Visible plant'} · ${axis.toUpperCase()} = ${coordinate} m · retained ${axis.toUpperCase()} ${retained} ${coordinate} m`,
  note:`${configuration} · Open cut faces · ${date.replace('T',' ').slice(0,19)} UTC`};
}
export async function captureSectionPhoto({renderer,scene,camera,helpers=[],identity,maxEdge=4096,maxPixels=12000000,includeFooter=true,format='png',jpegQuality=.94,background=null,document:doc=document}){
 const gl=renderer.getContext();if(gl.isContextLost())throw Error('The 3D view is unavailable. Restore it and try again.');
 const maxViewport=gl.getParameter(gl.MAX_VIEWPORT_DIMS),limit=Math.min(maxEdge,gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),maxViewport[0],maxViewport[1]);
 const oldSize=renderer.getSize(new T.Vector2()),oldRatio=renderer.getPixelRatio(),oldViewport=renderer.getViewport(new T.Vector4()),oldScissor=renderer.getScissor(new T.Vector4()),oldScissorTest=renderer.getScissorTest(),oldTarget=renderer.getRenderTarget();
 const savedHelpers=helpers.filter(Boolean).map(node=>[node,node.visible]),exportCamera=camera.clone(),oldBackground=scene.background;exportCamera.updateMatrixWorld();
 let canvas=null,dimensions=null,lastError=null;
 try{
  for(const [node]of savedHelpers)node.visible=false;
  if(background)scene.background=new T.Color(background);
  // A bounded fallback handles devices unable to allocate the first request.
  for(const edge of [...new Set([limit,Math.min(limit,2048)])]){
   try{
    dimensions=photoDimensions(oldSize.x,oldSize.y,edge,maxPixels,includeFooter?96:0);canvas=doc.createElement('canvas');canvas.width=dimensions.width;canvas.height=dimensions.totalHeight;
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Image memory could not be allocated.');
    renderer.setRenderTarget(null);renderer.setScissorTest(false);renderer.setDrawingBufferSize(dimensions.width,dimensions.height,1);renderer.setViewport(0,0,dimensions.width,dimensions.height);
    if(gl.drawingBufferWidth!==dimensions.width||gl.drawingBufferHeight!==dimensions.height)throw Error('The requested image size exceeds this device’s graphics limit.');
    renderer.render(scene,exportCamera);if(gl.isContextLost())throw Error('The graphics device could not finish the image.');
    // Capture immediately: preserving the drawing buffer on every frame is unnecessary.
    ctx.drawImage(renderer.domElement,0,0,dimensions.width,dimensions.height);
    if(includeFooter){ctx.fillStyle='#111d2b';ctx.fillRect(0,dimensions.height,dimensions.width,dimensions.footer);
    const padding=Math.max(12,Math.round(dimensions.width*.007));ctx.fillStyle='#e5edf5';ctx.textBaseline='top';
    const fit=(text,max)=>{let size=max;do{ctx.font=`500 ${size}px Arial`;if(ctx.measureText(text).width<=dimensions.width-2*padding)break;size--;}while(size>10);};
    fit(identity.title,Math.min(30,Math.max(16,Math.round(dimensions.width/135))));ctx.fillText(identity.title,padding,dimensions.height+14);
    fit(identity.note,Math.min(23,Math.max(13,Math.round(dimensions.width/175))));ctx.fillStyle='#b8cedd';ctx.fillText(identity.note,padding,dimensions.height+55);}lastError=null;break;
   }catch(error){lastError=error;if(canvas){canvas.width=canvas.height=1;canvas=null;}if(gl.isContextLost())break;}
  }
  if(lastError)throw lastError;
 }finally{
  for(const [node,visible]of savedHelpers)node.visible=visible;
  scene.background=oldBackground;
  renderer.setDrawingBufferSize(oldSize.x,oldSize.y,oldRatio);renderer.setRenderTarget(oldTarget);renderer.setViewport(oldViewport);renderer.setScissor(oldScissor);renderer.setScissorTest(oldScissorTest);
  if(!gl.isContextLost())renderer.render(scene,camera);
 }
 if(!canvas)throw Error('The section image could not be prepared.');
 const mime=format==='jpeg'?'image/jpeg':'image/png',extension=format==='jpeg'?'.jpg':'.png';
 try{const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Image encoding failed. Try the photo again.')),mime,format==='jpeg'?jpegQuality:undefined));return {blob,filename:identity.filename.replace(/\.(?:png|jpe?g)$/i,extension),width:dimensions.width,height:dimensions.totalHeight,reduced:limit<maxEdge||Math.max(dimensions.width,dimensions.totalHeight)<maxEdge-2,format};}
 finally{canvas.width=canvas.height=1;}
}
export function downloadSectionPhoto(result){const url=URL.createObjectURL(result.blob),a=document.createElement('a');a.href=url;a.download=result.filename;a.setAttribute('data-photo-download','');document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}

// Labels occupy scene units. Projecting their camera-facing width gives the
// same zoom and perspective scaling as equipment at the label anchor.
export const LABEL_WORLD_WIDTH=1.7;
export function projectEquipmentLabel(anchor,camera,viewportWidth,viewportHeight,baseWidth=120,baseHeight=32){
 const view=anchor.clone().applyMatrix4(camera.matrixWorldInverse),point=anchor.clone().project(camera);
 if(view.z>=0||point.z < -1||point.z > 1||Math.abs(point.x)>1.2||Math.abs(point.y)>1.2)return null;
 const pixelsPerUnit=viewportWidth*camera.projectionMatrix.elements[0]/2/(camera.isPerspectiveCamera?-view.z:1);
 const width=LABEL_WORLD_WIDTH*pixelsPerUnit,scale=width/baseWidth,height=baseHeight*scale;
 if(!Number.isFinite(scale)||scale<=0)return null;
 const x=(point.x+1)*viewportWidth/2,y=(1-point.y)*viewportHeight/2;
 return {x,y,anchorX:x,anchorY:y,width,height,scale};
}

// Pack using each label's projected bounds, including perspective depth.
export function placeLabels(items,width,height,labelWidth=120,labelHeight=32){
 const placed=[],margin=8;
 for(const item of items){const w=item.width??labelWidth,h=item.height??labelHeight,scale=item.scale??1,gap=4*scale;let found=null;
  const overlaps=r=>placed.some(p=>{const g=Math.max(gap,4*(p.scale??1));return r.x<p.x+p.width+g&&r.x+w+g>p.x&&r.y<p.y+p.height+g&&r.y+h+g>p.y;});
  const base={x:Math.max(margin,Math.min(width-w-margin,item.x-w/2)),y:Math.max(48,Math.min(height-h-46,item.y-h-12*scale))};
  for(let ring=0;ring<24&&!found;ring++)for(const [dx,dy] of [[0,-ring],[0,ring],[-ring,0],[ring,0],[-ring,-ring],[ring,-ring],[-ring,ring],[ring,ring]]){const r={x:base.x+dx*(w+5*scale),y:base.y+dy*(h+5*scale)};if(r.x<margin||r.x+w>width-margin||r.y<48||r.y+h>height-46||overlaps(r))continue;found=r;break;}
  if(found)placed.push({...item,...found,width:w,height:h});
 }
 return placed;
}

// v115 · 2026-09-14: reveal detail only when its projected size is useful.
export function equipmentLabelDetail(projectedWidth,selected=false){
 if(selected)return 'full';
 if(projectedWidth<50)return 'hidden';
 return projectedWidth<100?'tag':'full';
}

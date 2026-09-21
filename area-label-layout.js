// Screen-space packing keeps text readable; zoom controls visibility, never tiny font scaling.
export function rectanglesOverlap(a,b,gap=6){return a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;}
export function placeAreaLabels(items,width,height,obstacles=[]){
 const placed=[],ordered=[...items].sort((a,b)=>(b.priority||0)-(a.priority||0)||b.projectedArea-a.projectedArea||a.id.localeCompare(b.id));
 for(const item of ordered){
  if(!item.priority&&(item.regionWidth<item.width+12||item.regionHeight<item.height+10))continue;
  for(const [cx,cy]of item.positions){const r={x:cx-item.width/2,y:cy-item.height/2,width:item.width,height:item.height};
   if(r.x<8||r.x+r.width>width-8||r.y<64||r.y+r.height>height-64)continue;
   if([...placed,...obstacles].some(p=>rectanglesOverlap(r,p)))continue;
   placed.push({...item,...r});break;
  }
 }
 return placed;
}
export function overlayVisibility(state,view){
 const available=!view.exploded&&!view.below&&!view.section&&!view.archive;
 return {boundaries:available&&state.boundaries,labels:available&&state.labels,interaction:available&&(state.boundaries||state.labels)&&!view.measuring};
}

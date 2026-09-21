const NS='http://www.w3.org/2000/svg',colour={hw:'#ff7575',cw:'#55aaff',chw:'#b2eaff'},$=id=>document.getElementById(id);
export function projectPoint(p,view){return view==='front'?[p[0],-p[1]]:view==='side'?[p[2],-p[1]]:[p[0],p[2]];}
export function projectionBounds(box,view){const a=projectPoint(box.min,view),b=projectPoint(box.max,view);return {x:Math.min(a[0],b[0]),y:Math.min(a[1],b[1]),width:Math.abs(a[0]-b[0]),height:Math.abs(a[1]-b[1])};}
const overlaps=(a,b)=>a.min.every((v,i)=>v<=b.max[i]&&a.max[i]>=b.min[i]);
export async function mountThermalProjection(){
 const root=$('thermal-projection');if(!root)return;
 try{
  const response=await fetch('./thermal-projection.json');if(!response.ok)throw Error('Assembled review data is unavailable');const data=await response.json();
  let selected=null,view='top',zoom=1;
  const node=(tag,attrs,text)=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs||{}))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
  function rows(){const kind=$('review-kind').value;return data.issues.filter(i=>kind==='all'||i.kind===kind);}
  function render(){
   const box=selected?.box||data.overview,b=projectionBounds(box,view),cx=b.x+b.width/2,cy=b.y+b.height/2,span=Math.max(b.width,b.height*1.65,3)/zoom,w=span,h=span/1.65,scale=940/w,ids=new Set(selected?.partIds||[]),conflicts=new Set(selected?.conflictIds||[]);
   const svg=$('review-drawing');svg.replaceChildren();svg.setAttribute('viewBox',`${cx-w/2} ${cy-h/2} ${w} ${h}`);svg.setAttribute('aria-label',`${view} projection · ${selected?.label||'A-5000 utilities'} · assembled model`);
   svg.append(node('title',{},`${view} · ${selected?.label||'A-5000 utilities'}`));
   const grid=node('g',{stroke:'#253950','stroke-width':.6/scale});
   const step=w>30?5:w>10?2:.5;
   for(let x=Math.ceil((cx-w/2)/step)*step;x<=cx+w/2;x+=step)grid.append(node('line',{x1:x,x2:x,y1:cy-h/2,y2:cy+h/2}));
   for(let y=Math.ceil((cy-h/2)/step)*step;y<=cy+h/2;y+=step)grid.append(node('line',{x1:cx-w/2,x2:cx+w/2,y1:y,y2:y}));svg.append(grid);
   if(view!=='top')svg.append(node('line',{x1:cx-w/2,x2:cx+w/2,y1:0,y2:0,stroke:'#7894ab','stroke-width':1/scale}));
   for(const s of data.solids){if(!overlaps(s,box))continue;const p=projectionBounds(s,view),highlight=ids.has(s.id),conflict=conflicts.has(s.id),rect=node('rect',{x:p.x,y:p.y,width:Math.max(p.width,.015),height:Math.max(p.height,.015),fill:conflict?'#f472b622':highlight?'#ffd15c33':'#66839c0b',stroke:conflict?'#ff73a8':highlight?'#ffdb75':'#657c93','stroke-width':(highlight||conflict?2:0.6)/scale});rect.append(node('title',{},s.name));svg.append(rect);}
   for(const p of data.pipes){const bounds={min:[0,1,2].map(k=>Math.min(...p.path.map(v=>v[k]))),max:[0,1,2].map(k=>Math.max(...p.path.map(v=>v[k])))};if(!overlaps(bounds,box))continue;
    const highlight=ids.has(p.id),conflict=conflicts.has(p.id),primary=colour[p.circuit],stroke=conflict?'#ff73a8':highlight?'#ffdb75':primary|| (p.circuit?.startsWith('secondary-')?'#c7a5ff':'#647b90'),width=highlight||conflict?3:p.circuit?1.6:.65;
    const line=node('polyline',{points:p.path.map(v=>projectPoint(v,view).join(',')).join(' '),fill:'none',stroke,'stroke-width':width/scale,'stroke-linejoin':'round','stroke-dasharray':p.role==='return'?`${6/scale} ${4/scale}`:p.role==='inactive'?`${2/scale} ${4/scale}`:'none'});line.append(node('title',{},`${p.name} · ${p.circuit||'Adjacent service'} · ${p.role||'context'}`));svg.append(line);
   }
   if(selected?.standing){const p=projectionBounds(selected.standing,view);svg.append(node('rect',{x:p.x,y:p.y,width:p.width,height:p.height,fill:'#ffca5820',stroke:'#ffca58','stroke-width':2/scale,'stroke-dasharray':`${7/scale} ${4/scale}`}));}
   if(selected){const p=projectPoint(selected.point,view),r=8/scale;svg.append(node('circle',{cx:p[0],cy:p[1],r,fill:'none',stroke:'#ffffff','stroke-width':2/scale}));svg.append(node('line',{x1:p[0]-r*1.7,x2:p[0]+r*1.7,y1:p[1],y2:p[1],stroke:'#ffffff','stroke-width':1/scale}));}
   const text=(x,y,t)=>node('text',{x,y,fill:'#dce8f7','font-size':13/scale,'font-family':'system-ui'},t);
   if(!selected){const placed=[];for(const e of data.equipment.filter(e=>/^A-5[123]00$|^TCU-|^CP-5000$/.test(e.tag)&&e.area==='A-5000')){
    const p=projectPoint([e.x,e.y,e.z],view),tw=(e.tag.length*8+10)/scale,th=18/scale;
    for(const [dx,dy]of [[12,-12],[12,16],[-70,-24],[-70,28],[12,-45],[12,48]]){
     const x=Math.max(cx-w/2+8/scale,Math.min(cx+w/2-tw,p[0]+dx/scale)),y=Math.max(cy-h/2+th,Math.min(cy+h/2-th,p[1]+dy/scale));
     const b={x,y:y-th,w:tw,h:th};if(placed.some(a=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y))continue;
     placed.push(b);svg.append(node('line',{x1:p[0],y1:p[1],x2:x,y2:y-5/scale,stroke:'#8298aa','stroke-width':.7/scale}));const label=text(x,y,e.tag);label.setAttribute('stroke','#101e2c');label.setAttribute('stroke-width',String(3/scale));label.setAttribute('paint-order','stroke');svg.append(label);break;
    }
   }}
   const bar=Math.max(.5,step),bx=cx-w/2+18/scale,by=cy+h/2-22/scale;svg.append(node('line',{x1:bx,x2:bx+bar,y1:by,y2:by,stroke:'#e8f0fc','stroke-width':3/scale}),text(bx,by-8/scale,`${bar} m`));
   $('review-view-note').textContent=(view==='top'?'Top · X / Z':view==='front'?'Front · X / elevation':'Side · Z / elevation')+' · '+(selected?selected.area+' · ':'')+'Zoom '+zoom.toFixed(1)+'×. Hover a part or line for its name.';
   $('review-item-title').textContent=selected?.label||'A-5000 assembled overview';$('review-item-status').textContent=selected?.status||'Baseline model · inspection aid';
   $('review-item-reason').textContent=selected?.reason||data.source;$('review-item-detail').textContent=selected?.detail||`${data.summary.obstructed} obstructed candidate positions; ${data.summary.mobile} mobile-access holds. These sets overlap.`;$('review-item-action').textContent=selected?.action||'Select an item to inspect its location, nearby geometry and required action.';
   const items=rows(),index=items.indexOf(selected);$('review-prev').disabled=index<=0;$('review-next').disabled=index>=items.length-1||!items.length;$('review-zoom-out').disabled=zoom<=.75;$('review-zoom-in').disabled=zoom>=3;
  }
  function filter(){const items=rows();$('review-item').replaceChildren(new Option('A-5000 overview',''),...items.map(i=>new Option(i.label,i.id)));selected=null;zoom=1;render();$('review-count').textContent=`${items.length} review records · ${data.summary.support} support items · ${data.summary.interface} discharge interfaces · ${data.summary.joint} takeoff contacts`;}
  $('review-kind').onchange=filter;$('review-item').onchange=()=>{selected=data.issues.find(i=>i.id===$('review-item').value)||null;zoom=1;render();};
  for(const id of ['top','front','side'])$('review-'+id).onclick=()=>{view=id;for(const v of ['top','front','side'])$('review-'+v).setAttribute('aria-pressed',String(v===id));render();};
  function step(delta){const items=rows(),i=items.indexOf(selected),next=items[i+delta];if(next){selected=next;$('review-item').value=next.id;zoom=1;render();}}
  $('review-prev').onclick=()=>step(-1);$('review-next').onclick=()=>step(1);
  $('review-zoom-in').onclick=()=>{zoom=Math.min(3,zoom+.25);render();};$('review-zoom-out').onclick=()=>{zoom=Math.max(.75,zoom-.25);render();};$('review-reset').onclick=()=>{zoom=1;render();};
  filter();root.dataset.state='ready';
 }catch(e){$('review-count').textContent=e.message;root.dataset.state='error';}
}

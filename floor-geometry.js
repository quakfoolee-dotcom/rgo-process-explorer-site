// Orthogonal floor allocations: exact union / exclusion area, with no bounding-box area credit.
export const inRect=(x,z,r)=>x>r[0]&&x<r[2]&&z>r[1]&&z<r[3];
export function floorRegion(rects,exclusions=[]){
 if(!rects.length)return {tiles:[],segments:[],areaM2:0,bounds:null};
 const bounds=[Math.min(...rects.map(r=>r[0])),Math.min(...rects.map(r=>r[1])),Math.max(...rects.map(r=>r[2])),Math.max(...rects.map(r=>r[3]))];
 const cuts=exclusions.filter(r=>r[0]<bounds[2]&&r[2]>bounds[0]&&r[1]<bounds[3]&&r[3]>bounds[1]);
 const xs=[...new Set([...rects,...cuts].flatMap(r=>[Math.max(bounds[0],r[0]),Math.min(bounds[2],r[2])]))].sort((a,b)=>a-b),zs=[...new Set([...rects,...cuts].flatMap(r=>[Math.max(bounds[1],r[1]),Math.min(bounds[3],r[3])]))].sort((a,b)=>a-b);
 const occupied=new Set(),tiles=[],segments=[];let areaM2=0;
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){const x=(xs[i]+xs[i+1])/2,z=(zs[j]+zs[j+1])/2;if(rects.some(r=>inRect(x,z,r))&&!cuts.some(r=>inRect(x,z,r))){occupied.add(i+','+j);tiles.push([xs[i],zs[j],xs[i+1],zs[j+1]]);areaM2+=(xs[i+1]-xs[i])*(zs[j+1]-zs[j]);}}
 for(const key of occupied){const [i,j]=key.split(',').map(Number),a=xs[i],b=xs[i+1],d=zs[j],e=zs[j+1];if(!occupied.has(i+','+(j-1)))segments.push([[a,d],[b,d]]);if(!occupied.has((i+1)+','+j))segments.push([[b,d],[b,e]]);if(!occupied.has(i+','+(j+1)))segments.push([[b,e],[a,e]]);if(!occupied.has((i-1)+','+j))segments.push([[a,e],[a,d]]);}
 return {tiles,segments,areaM2,bounds};
}
export function floorTriangles(tiles,elevation=()=>.018){const positions=[];for(const[a,d,b,e]of tiles)for(const[x,z]of[[a,d],[a,e],[b,e],[a,d],[b,e],[b,d]])positions.push(x,elevation(x,z),z);return positions;}
export function feetInches(m){const inches=Math.round(m/.0254);return `${Math.floor(inches/12)}′${String(inches%12).padStart(2,'0')}″`;}
export const floorDimensions=r=>{if(!r.bounds)return null;const width=r.bounds[2]-r.bounds[0],length=r.bounds[3]-r.bounds[1];return {width,length,imperial:`${feetInches(width)} × ${feetInches(length)}`,metric:`${Math.round(width*1000).toLocaleString('en-CA')} mm × ${Math.round(length*1000).toLocaleString('en-CA')} mm`,area:`${(r.areaM2/.09290304).toFixed(2)} ft² / ${r.areaM2.toFixed(2)} m²`,rectangular:Math.abs(width*length-r.areaM2)<1e-6};};

export function connectedFloor(tiles){
 if(!tiles.length)return false;const pending=new Set(tiles.map((_,i)=>i)),queue=[pending.values().next().value];pending.delete(queue[0]);
 while(queue.length){const a=tiles[queue.pop()];for(const i of pending){const b=tiles[i],touchX=(Math.abs(a[0]-b[2])<1e-7||Math.abs(a[2]-b[0])<1e-7)&&Math.min(a[3],b[3])-Math.max(a[1],b[1])>1e-7,touchZ=(Math.abs(a[1]-b[3])<1e-7||Math.abs(a[3]-b[1])<1e-7)&&Math.min(a[2],b[2])-Math.max(a[0],b[0])>1e-7;if(touchX||touchZ){pending.delete(i);queue.push(i);}}}return pending.size===0;
}

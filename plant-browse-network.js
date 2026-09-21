import {walkwayGraph} from './walkway-review.js';

// The eye point is a viewing choice. Traversability uses the independently
// screened 1.2 m corridor / 2.3 m headroom, never the camera near plane.
export const BROWSE_PERSON=Object.freeze({eyeHeight:1.6,speed:1,maxStep:.08});
export const edgeElevation=(edge,t)=>(edge.ya??0)+((edge.yb??0)-(edge.ya??0))*t;
export const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function projectToEdge(p,e){
 const dx=e.b[0]-e.a[0],dz=e.b[1]-e.a[1],length=Math.hypot(dx,dz);
 const t=length?Math.max(0,Math.min(1,((p[0]-e.a[0])*dx+(p[1]-e.a[1])*dz)/(length*length))):0;
 const point=[e.a[0]+dx*t,e.a[1]+dz*t];return {point,t,distance:Math.hypot(p[0]-point[0],p[1]-point[1])};
}
export function createBrowseNetwork(w,review){
 // Unlike a general graph viewer, browsing fails closed without complete data.
 if(!w||!review||review.revision!==w.revision||review.widthM!==w.widthM||review.headroomM!==w.headroomM||review.segments.length!==w.segments.length)throw new Error('Walkway check is missing or out of date.');
 const checked=new Map(review.segments.map(s=>[s.id,s]));
 if(w.segments.some(s=>!checked.has(s.id)||s.a.length!==2||s.b.length!==2||!(s.width>0)))throw new Error('Walkway check is incomplete.');
 const graph=walkwayGraph(w,review),segments=new Map(w.segments.map(s=>[s.id,s])),edges=[],adj=new Map(),seen=new Set();
 for(const n of graph.nodes.values())for(const e of n.edges){if(n.id>=e.to||seen.has(n.id+'|'+e.to))continue;seen.add(n.id+'|'+e.to);const s=segments.get(e.segment),b=graph.nodes.get(e.to).point;
  const edge={id:edges.length,a:n.point,b,from:n.id,to:e.to,length:e.distance,segment:s.id,width:s.width,heading:Math.atan2(b[0]-n.point[0],b[1]-n.point[1])};
  edges.push(edge);for(const id of [edge.from,edge.to]){if(!adj.has(id))adj.set(id,[]);adj.get(id).push(edge);}
 }
 function nearest(p,tolerance=null){let best=null;for(const edge of edges){const hit=projectToEdge(p,edge),limit=tolerance??Math.min(.6,edge.width/2);if(hit.distance<=limit+1e-7&&(!best||hit.distance<best.distance))best={...hit,edge};}return best;}
 return {edges,adj,nearest,blocked:review.segments.filter(s=>!s.clear).length};
}
export function createBrowseWalker(network,hit){
 const state={edge:hit.edge,t:hit.t,point:[...hit.point],heading:hit.edge.heading,y:edgeElevation(hit.edge,hit.t),distance:0,choices:[],blocked:null};
 function options(node){return (network.adj.get(node)||[]).map(edge=>{const forward=edge.from===node;return {edge,t:forward?0:1,heading:edge.heading+(forward?0:Math.PI)};});}
 function advance(distance,lookHeading,isBlocked=()=>false){
  let left=Math.abs(distance),desired=lookHeading+(distance<0?Math.PI:0);state.blocked=null;state.turnDelta=0;
  // Stop at every branch. Explicit branch choice is required; no diagonal cuts.
  while(left>1e-8){const e=state.edge,forward=Math.cos(angleDelta(desired,e.heading))>=0,sign=forward?1:-1,available=(forward?1-state.t:state.t)*e.length;
   if(available<1e-7){const node=forward?e.to:e.from;let choices=options(node).filter(o=>o.edge.id!==e.id);if(e.deck&&choices.length>1){const straight=choices.filter(o=>Math.abs(angleDelta(o.heading,desired))<.2);if(straight.length===1)choices=straight;}state.choices=choices;
    if(choices.length!==1){state.blocked=choices.length?'Choose a direction at the junction.':'End of this walkway.';break;}
    const next=choices[0];state.edge=next.edge;state.t=next.t;state.turnDelta+=angleDelta(next.heading,desired);desired=next.heading;state.heading=desired;continue;
   }
   const step=Math.min(left,available,BROWSE_PERSON.maxStep),t=state.t+sign*step/e.length,p=[e.a[0]+(e.b[0]-e.a[0])*t,e.a[1]+(e.b[1]-e.a[1])*t];
   if(isBlocked(state.point,p)){state.blocked='Movement stopped: walkway occupied.';break;}
   state.t=t;state.point=p;state.y=edgeElevation(e,t);state.distance+=step;state.heading=e.heading+(forward?0:Math.PI);left-=step;state.choices=[];
  }return state;
 }
 function choose(index){const option=state.choices[index];if(!option)return false;state.edge=option.edge;state.t=option.t;state.y=edgeElevation(option.edge,option.t);state.heading=option.heading;state.choices=[];state.blocked=null;return true;}
 return {state,advance,choose};
}

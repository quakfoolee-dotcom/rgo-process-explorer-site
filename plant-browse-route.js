import {createBrowseWalker,edgeElevation} from './plant-browse-network.js';

// Virtual endpoint links keep the exact start and selected positions on their edges.
export function planBrowseRoute(network,start,destination){
 const s=start.edge,g=destination.edge,dist=new Map(),prev=new Map(),pending=new Set();
 const leg=(edge,from,to)=>({edge,from,to,distance:Math.abs(to-from)*edge.length,heading:edge.heading+(to<from?Math.PI:0)});
 for(const [node,t] of [[s.from,0],[s.to,1]]){const first=leg(s,start.t,t);if(first.distance<(dist.get(node)??Infinity)){dist.set(node,first.distance);prev.set(node,{node:null,leg:first});pending.add(node);}}
 while(pending.size){let node=null;for(const n of pending)if(node===null||dist.get(n)<dist.get(node))node=n;pending.delete(node);
  for(const edge of network.adj.get(node)||[]){const forward=edge.from===node,next=forward?edge.to:edge.from,cost=dist.get(node)+edge.length;if(cost<(dist.get(next)??Infinity)-1e-9){dist.set(next,cost);prev.set(next,{node,leg:leg(edge,forward?0:1,forward?1:0)});pending.add(next);}}
 }
 let best=s.id===g.id?{distance:Math.abs(destination.t-start.t)*s.length,legs:[leg(s,start.t,destination.t)]}:null;
 for(const [node,t] of [[g.from,0],[g.to,1]]){const last=leg(g,t,destination.t),cost=(dist.get(node)??Infinity)+last.distance;if(!Number.isFinite(cost)||best&&cost>=best.distance-1e-9)continue;const legs=[last];let n=node;while(n!=null){const p=prev.get(n);legs.unshift(p.leg);n=p.node;}best={distance:cost,legs};}
 if(!best)return null;best.legs=best.legs.filter(l=>l.distance>1e-7);best.destination=destination;best.elevations=[edgeElevation(s,start.t),...best.legs.map(l=>edgeElevation(l.edge,l.to))];best.points=[[...start.point],...best.legs.map(l=>[l.edge.a[0]+(l.edge.b[0]-l.edge.a[0])*l.to,l.edge.a[1]+(l.edge.b[1]-l.edge.a[1])*l.to])];return best;
}
export function createBrowseRouteTravel(network,route,totalDistance=0){
 let index=0,walked=totalDistance,walker=null,remaining=0,done=!route.legs.length;
 function enter(){const l=route.legs[index];if(!l){done=true;return;}walker=createBrowseWalker(network,{edge:l.edge,t:l.from,point:[l.edge.a[0]+(l.edge.b[0]-l.edge.a[0])*l.from,l.edge.a[1]+(l.edge.b[1]-l.edge.a[1])*l.from]});walker.state.distance=walked;remaining=l.distance;}
 if(!done)enter();
 return {advance(amount){while(amount>1e-8&&!done){const l=route.legs[index],step=Math.min(amount,remaining);walker.advance(step,l.heading);walked=walker.state.distance;remaining-=step;amount-=step;if(remaining<1e-7){index++;if(index===route.legs.length)done=true;else enter();}}return walker;},get walker(){return walker;},get done(){return done;},get heading(){return route.legs[Math.min(index,route.legs.length-1)]?.heading||0;}};
}

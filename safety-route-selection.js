// Route length is measured on the checked graph; unknown safety data never
// turns a geometric candidate into an approved emergency recommendation.
export function rankSafetyRoutes(candidates){
 return [...candidates].sort((a,b)=>(Number(!a.path)-Number(!b.path))||((a.distance??Infinity)-(b.distance??Infinity))||a.tag.localeCompare(b.tag));
}
export function stationRouteLabel(station,route,shortest){
 const name=station.tag+' · '+(station.label||station.areaId||'');
 return (shortest?'★ Shortest modelled · ':'')+name+(route?.path?' · '+(route.completeDistanceM??route.distance).toFixed(1)+' m'+(Number.isFinite(route.completeDistanceM)?' incl. final approach':''):route?' · '+(route.reason||'Access unresolved'):'');
}
export function routeCrossings(w,path){return path?w.crossings.filter(c=>path.some((p,i)=>{if(!i)return false;const a=path[i-1];return Math.max(a[0],p[0])>=c.rect[0]&&Math.min(a[0],p[0])<=c.rect[2]&&Math.max(a[1],p[1])>=c.rect[1]&&Math.min(a[1],p[1])<=c.rect[3];})).map(c=>c.id):[];}

export function emergencyWalkReview(review){return {...review,segments:review.segments.map(s=>({...s,clear:s.clear&&!(s.crossings||[]).length}))};}

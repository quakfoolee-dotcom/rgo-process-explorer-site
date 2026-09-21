// One stable symbol per station type. Selection never replaces the icon.
const icons={fire:'<path d="M10 8h6v3h-6zM9 11h8v12H9zM11 5h5v3h-5z"/><path d="M16 6h4v8h-2V8h-2zM8 4h9v2H8z"/>',emergency:'<path d="M5 23V5h9v2H7v16zm6-15h7l2 3H9z"/><path d="M11 13h2v3h-2zm5 0h2v3h-2zM9 18h13v2H9zm2 3h9v2h-9z"/>'};
export function createSafetyMarker(kind,tag,description,onChoose){
 const b=document.createElement('button');b.type='button';b.className=kind==='fire'?'fire-marker':'emergency-marker';
 b.innerHTML=`<svg viewBox="0 0 28 28" width="24" height="24" aria-hidden="true" focusable="false" fill="currentColor">${icons[kind]}</svg>`;
 const tooltip=document.createElement('span');tooltip.className='safety-marker-tooltip';tooltip.textContent=tag+' · '+description;b.append(tooltip);
 b.title=tag+' · '+description;b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed','false');b.onclick=onChoose;return b;
}
export function selectSafetyMarker(markers,tag){for(const [id,m]of markers)m.setAttribute('aria-pressed',String(id===tag));}

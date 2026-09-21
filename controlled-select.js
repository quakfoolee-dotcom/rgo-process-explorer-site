// A select-only combobox over the existing select: tool state has one owner.
export function popupBounds(field, boundary, viewport, desired=320){
 const left=Math.max(8,boundary.left,field.left),right=Math.min(viewport.width-8,boundary.right,field.right);
 const below=Math.max(0,Math.min(viewport.height-8,boundary.bottom??viewport.height-8)-field.bottom),above=Math.max(0,field.top-Math.max(8,boundary.top??8)),up=below<Math.min(180,desired)&&above>below;
 const height=Math.max(0,Math.min(desired,up?above:below));
 return {left,width:Math.max(0,right-left),top:up?field.top-height:field.bottom,height};
}
export function nextOption(options,from,delta){
 for(let n=1;n<=options.length;n++){const i=(from+delta*n+options.length*2)%options.length;if(!options[i].disabled)return i;}return -1;
}
export function mountControlledSelects(root=document){
 const records=new Map();let opened=null,serial=0,pending=false;
 const make=(tag,cls)=>{const n=root.createElement(tag);if(cls)n.className=cls;return n;};
 function close(){if(!opened)return;if(opened.popup.hidePopover){try{opened.popup.hidePopover();}catch{}}opened.popup.hidden=true;opened.button.setAttribute('aria-expanded','false');opened.button.removeAttribute('aria-activedescendant');opened=null;}
 function options(select){return [...select.options].map((o,index)=>({index,text:o.label||o.textContent,value:o.value,disabled:o.disabled||o.parentElement?.disabled===true,group:o.parentElement?.tagName==='OPTGROUP'?o.parentElement.label:''}));}
 function place(r){const box=r.button.getBoundingClientRect();if(!box.width||!box.height){close();return;}const owner=r.select.closest('#navigation-sidebar,.workspace-dialog,#section-inspector,#transport-review,#fire-safety-panel,#emergency-station-panel,#walk-panel,#walkway-panel,#plant-browse-panel');const edge=owner?.getBoundingClientRect()||{left:8,right:innerWidth-8};const stage=r.select.closest('#viewport')?.getBoundingClientRect();const b=popupBounds(box,{left:edge.left+4,right:edge.right-4,top:stage?stage.top+8:8,bottom:stage?stage.bottom-8:innerHeight-8},{width:innerWidth,height:innerHeight},Math.min(360,r.popup.scrollHeight||360));Object.assign(r.popup.style,{left:b.left+'px',top:b.top+'px',width:b.width+'px',maxHeight:b.height+'px'});}
 function paint(r){for(const [i,n]of r.items.entries()){n.classList.toggle('option-focus',i===r.active);n.setAttribute('aria-selected',String(i===r.select.selectedIndex));}const item=r.items[r.active];if(item){r.button.setAttribute('aria-activedescendant',item.id);if(item.offsetTop<r.popup.scrollTop)r.popup.scrollTop=item.offsetTop;else if(item.offsetTop+item.offsetHeight>r.popup.scrollTop+r.popup.clientHeight)r.popup.scrollTop=item.offsetTop+item.offsetHeight-r.popup.clientHeight;}}
 function rebuild(r){r.rows=options(r.select);r.popup.replaceChildren();r.items=[];let group='';for(const row of r.rows){if(row.group&&row.group!==group){const heading=make('div','select-group');heading.textContent=row.group;r.popup.append(heading);}group=row.group;const n=make('div','select-option');n.id=r.popup.id+'-'+row.index;n.setAttribute('role','option');n.setAttribute('aria-disabled',String(row.disabled));n.dataset.index=row.index;const mark=make('span','option-check');mark.textContent='✓';mark.setAttribute('aria-hidden','true');const text=make('span');const match=row.text.match(/^((?:A|FE|ES)-\d+[A-Z]?)\s*(?:[·:—–-]\s*)?(.*)$/);if(match){const code=make('strong');code.textContent=match[1];text.append(code,root.createTextNode(match[2]?' · '+match[2]:''));}else text.textContent=row.text;n.append(mark,text);r.popup.append(n);r.items.push(n);}r.active=r.select.selectedIndex;if(r.active<0||r.rows[r.active]?.disabled)r.active=nextOption(r.rows,-1,1);}
 function sync(r){
  if(!r.select.isConnected){r.popup.remove();r.wrap.remove();records.delete(r.select);if(opened===r)close();return;}
  if(r.wrap.hidden!==r.select.hidden)r.wrap.hidden=r.select.hidden;
  r.button.disabled=r.select.disabled||r.select.options.length<2;
  const selected=r.select.selectedOptions[0];const text=selected?.label||selected?.textContent||'No options available';if(r.value.textContent!==text)r.value.textContent=text;
  const explicit=r.select.getAttribute('aria-label'),labelled=r.select.getAttribute('aria-labelledby');
  if(labelled){r.button.setAttribute('aria-labelledby',labelled+' '+r.value.id);r.popup.setAttribute('aria-labelledby',labelled);}
  else {const labels=[...r.select.labels||[]];const name=explicit||labels.map(l=>[...l.childNodes].filter(n=>n!==r.wrap&&!n.contains?.(r.select)).map(n=>n.textContent).join(' ').trim()).join(' ')||r.select.title||r.select.id||'Selection';r.button.setAttribute('aria-label',name+': '+r.value.textContent);r.popup.setAttribute('aria-label',name);}
  if(opened===r&&(r.button.disabled||r.wrap.hidden))close();
 }
 function open(r){if(r.button.disabled)return;close();sync(r);rebuild(r);opened=r;r.popup.hidden=false;if(r.popup.showPopover){try{r.popup.showPopover();}catch{root.body.append(r.popup);}}else root.body.append(r.popup);r.button.setAttribute('aria-expanded','true');place(r);paint(r);}
 function commit(r,index){if(!r.rows[index]||r.rows[index].disabled)return;const changed=r.select.selectedIndex!==index;r.select.selectedIndex=index;close();sync(r);r.button.focus({preventScroll:true});if(changed){r.select.dispatchEvent(new Event('input',{bubbles:true}));r.select.dispatchEvent(new Event('change',{bubbles:true}));}schedule();}
 function enhance(select){if(records.has(select)||select.multiple||select.size>1||select.dataset.nativeSelect!==undefined)return;
  const wrap=make('span','controlled-select'),button=make('button','select-trigger'),value=make('span','select-value'),arrow=make('span','select-chevron'),popup=make('div','select-popup');
  select.before(wrap);wrap.append(select,button,popup);select.classList.add('enhanced-native-select');select.tabIndex=-1;select.setAttribute('aria-hidden','true');button.type='button';button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');popup.id='select-popup-'+(++serial);popup.setAttribute('role','listbox');popup.setAttribute('popover','manual');popup.hidden=true;value.id=popup.id+'-value';arrow.textContent='⌄';arrow.setAttribute('aria-hidden','true');button.setAttribute('aria-controls',popup.id);button.append(value,arrow);
  const r={select,wrap,button,value,popup,rows:[],items:[],active:-1,typed:'',typedAt:0};records.set(select,r);sync(r);
  select.addEventListener('focus',()=>button.focus());
  button.onclick=e=>{e.preventDefault();opened===r?close():open(r);};
  popup.addEventListener('pointerdown',e=>e.preventDefault());popup.onclick=e=>{const o=e.target.closest('[role=option]');if(o){e.preventDefault();commit(r,Number(o.dataset.index));}};
  button.onkeydown=e=>{
   if(e.key==='Tab'){close();return;}
   if(e.key==='Escape'&&opened===r){e.preventDefault();e.stopPropagation();close();return;}
   if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();const wasOpen=opened===r;if(!wasOpen)open(r);else if(e.key==='Enter'||e.key===' '){commit(r,r.active);return;}
    if(e.key==='Home')r.active=nextOption(r.rows,-1,1);else if(e.key==='End')r.active=nextOption(r.rows,0,-1);else if(wasOpen&&e.key.startsWith('Arrow'))r.active=nextOption(r.rows,r.active,e.key==='ArrowDown'?1:-1);paint(r);return;}
   if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();if(opened!==r)open(r);const now=Date.now();r.typed=now-r.typedAt<700?r.typed+e.key.toLowerCase():e.key.toLowerCase();r.typedAt=now;const prefix=/^(.)\1+$/.test(r.typed)?r.typed[0]:r.typed;for(let n=1;n<=r.rows.length;n++){const i=(r.active+n+r.rows.length)%r.rows.length;if(!r.rows[i].disabled&&r.rows[i].text.toLowerCase().startsWith(prefix)){r.active=i;break;}}paint(r);}
  };
 }
 function scan(node){if(node.nodeType!==1&&node!==root)return;if(node.matches?.('select'))enhance(node);node.querySelectorAll?.('select').forEach(enhance);}
 function schedule(){if(pending)return;pending=true;queueMicrotask(()=>{pending=false;for(const r of records.values())sync(r);});}
 scan(root);
 const observer=new MutationObserver(changes=>{let changed=false;for(const m of changes){const select=m.target.tagName==='SELECT'?m.target:m.target.closest?.('select');if(select){const r=records.get(select);if(r){sync(r);if(opened===r){rebuild(r);place(r);paint(r);}}changed=true;}if(m.type==='childList'){for(const n of m.addedNodes)scan(n);if([...m.removedNodes].some(n=>n.nodeType===1&&(n.tagName==='SELECT'||n.querySelector?.('select'))))changed=true;}}if(changed)schedule();});
 observer.observe(root.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','hidden','selected','label','aria-label','aria-labelledby']});
 root.addEventListener('pointerdown',e=>{if(opened&&!opened.wrap.contains(e.target)&&!opened.popup.contains(e.target))close();},true);
 root.addEventListener('focusin',e=>{if(opened&&!opened.wrap.contains(e.target)&&!opened.popup.contains(e.target))close();});
 for(const name of ['click','change','input'])root.addEventListener(name,schedule,true);
 // A scrolling panel should not leave its popup stranded over another tool.
 root.addEventListener('scroll',e=>{if(opened&&!opened.popup.contains(e.target))close();},true);
 window.addEventListener('resize',close);
 return {sync:schedule,close,destroy(){close();observer.disconnect();}};
}

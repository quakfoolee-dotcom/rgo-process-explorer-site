const WIDTH_STORAGE_KEY='rgo-inspector-width';
const HEIGHT_STORAGE_KEY='rgo-inspector-height';
export const DEFAULT_INSPECTOR_WIDTH=340;
export const DEFAULT_INSPECTOR_HEIGHT=520;
export const MIN_INSPECTOR_WIDTH=300;
export const MIN_INSPECTOR_HEIGHT=320;

export function inspectorMaximumWidth(viewportWidth){
 return Math.max(MIN_INSPECTOR_WIDTH,Math.min(viewportWidth-32,viewportWidth*.82));
}

export function inspectorMaximumHeight(availableHeight){
 return Math.max(MIN_INSPECTOR_HEIGHT,availableHeight);
}

export function clampInspectorWidth(width,viewportWidth){
 return Math.round(Math.min(inspectorMaximumWidth(viewportWidth),Math.max(MIN_INSPECTOR_WIDTH,Number(width)||DEFAULT_INSPECTOR_WIDTH)));
}

export function clampInspectorHeight(height,availableHeight){
 return Math.round(Math.min(inspectorMaximumHeight(availableHeight),Math.max(MIN_INSPECTOR_HEIGHT,Number(height)||DEFAULT_INSPECTOR_HEIGHT)));
}

function makeHandle(kind,label,title,orientation){
 const handle=document.createElement('div');
 handle.className=`inspector-resize-handle inspector-resize-${kind}`;
 handle.tabIndex=0;
 handle.setAttribute('role','separator');
 handle.setAttribute('aria-orientation',orientation);
 handle.setAttribute('aria-label',label);
 handle.title=title;
 return handle;
}

export function mountResizableInspector({panel,viewport,onResizeStart,onResize,onResizeEnd}={}){
 if(!panel||!viewport)return null;
 const handles={
  left:makeHandle('left','Resize equipment details width','Drag left or right to resize width · Double-click to reset','vertical'),
  bottom:makeHandle('bottom','Resize equipment details height','Drag up or down to resize height · Double-click to reset','horizontal'),
  corner:makeHandle('corner','Resize equipment details width and height','Drag to resize width and height · Double-click to reset','vertical')
 };
 for(const handle of Object.values(handles))panel.before(handle);
 let width=DEFAULT_INSPECTOR_WIDTH,height=DEFAULT_INSPECTOR_HEIGHT,drag=null;
 const mobile=matchMedia('(max-width:760px)');
 try{
  width=Number(localStorage.getItem(WIDTH_STORAGE_KEY))||DEFAULT_INSPECTOR_WIDTH;
  height=Number(localStorage.getItem(HEIGHT_STORAGE_KEY))||DEFAULT_INSPECTOR_HEIGHT;
 }catch{}
 function viewportWidth(){return viewport.getBoundingClientRect().width||innerWidth;}
 function availableHeight(){
  const stage=panel.parentElement?.getBoundingClientRect(),rect=panel.getBoundingClientRect();
  const toolbar=parseFloat(getComputedStyle(panel.parentElement||panel).getPropertyValue('--stage-toolbar-space'))||0;
  return Math.max(MIN_INSPECTOR_HEIGHT,(stage?.bottom||innerHeight)-rect.top-toolbar-12);
 }
 function syncHandles(){
  const rect=panel.getBoundingClientRect(),unavailable=panel.hidden||mobile.matches||!rect.width||!rect.height;
  for(const handle of Object.values(handles))handle.hidden=unavailable;
  if(unavailable)return;
  Object.assign(handles.left.style,{left:rect.left+'px',top:rect.top+'px',height:rect.height+'px'});
  Object.assign(handles.bottom.style,{left:rect.left+'px',top:(rect.bottom-6)+'px',width:rect.width+'px'});
  Object.assign(handles.corner.style,{left:rect.left+'px',top:(rect.bottom-12)+'px'});
 }
 function apply(nextWidth=width,nextHeight=height,persist=false){
  width=clampInspectorWidth(nextWidth,viewportWidth());
  height=clampInspectorHeight(nextHeight,availableHeight());
  panel.style.width=width+'px';
  panel.style.height=height+'px';
  panel.style.setProperty('--inspector-width',width+'px');
  panel.style.setProperty('--inspector-height',height+'px');
  handles.left.setAttribute('aria-valuemin',String(MIN_INSPECTOR_WIDTH));
  handles.left.setAttribute('aria-valuemax',String(Math.round(inspectorMaximumWidth(viewportWidth()))));
  handles.left.setAttribute('aria-valuenow',String(width));
  handles.bottom.setAttribute('aria-valuemin',String(MIN_INSPECTOR_HEIGHT));
  handles.bottom.setAttribute('aria-valuemax',String(Math.round(inspectorMaximumHeight(availableHeight()))));
  handles.bottom.setAttribute('aria-valuenow',String(height));
  if(persist)try{
   localStorage.setItem(WIDTH_STORAGE_KEY,String(width));
   localStorage.setItem(HEIGHT_STORAGE_KEY,String(height));
  }catch{}
  syncHandles();
  onResize?.({width,height});
 }
 function begin(kind,event){
  if(event.button!==0)return;
  const rect=panel.getBoundingClientRect();
  drag={kind,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,startWidth:rect.width,startHeight:rect.height};
  panel.classList.add('is-resizing');
  handles[kind].classList.add('is-resizing');
  handles[kind].setPointerCapture?.(event.pointerId);
  onResizeStart?.({width,height,kind});
  event.stopPropagation();
  event.preventDefault();
 }
 function move(event){
  if(!drag||event.pointerId!==drag.pointerId)return;
  const resizeWidth=drag.kind==='left'||drag.kind==='corner';
  const resizeHeight=drag.kind==='bottom'||drag.kind==='corner';
  apply(resizeWidth?drag.startWidth+(drag.startX-event.clientX):width,resizeHeight?drag.startHeight+(event.clientY-drag.startY):height);
  event.stopPropagation();
  event.preventDefault();
 }
 function finish(event){
  if(!drag||event.pointerId!==drag.pointerId)return;
  const handle=handles[drag.kind];
  handle.releasePointerCapture?.(event.pointerId);
  handle.classList.remove('is-resizing');
  panel.classList.remove('is-resizing');
  const kind=drag.kind;drag=null;
  apply(width,height,true);
  onResizeEnd?.({width,height,kind});
  event.stopPropagation();
 }
 function reset(kind){
  apply(kind==='bottom'?width:DEFAULT_INSPECTOR_WIDTH,kind==='left'?height:DEFAULT_INSPECTOR_HEIGHT,true);
  onResizeEnd?.({width,height,kind});
 }
 for(const [kind,handle] of Object.entries(handles)){
  handle.addEventListener('pointerdown',event=>begin(kind,event));
  handle.addEventListener('pointermove',move);
  handle.addEventListener('pointerup',finish);
  handle.addEventListener('pointercancel',finish);
  handle.addEventListener('dblclick',event=>{event.preventDefault();reset(kind);});
  handle.addEventListener('keydown',event=>{
   const step=event.shiftKey?50:20;let nextWidth=width,nextHeight=height,handled=true;
   if(kind==='left'||kind==='corner'){
    if(event.key==='ArrowLeft')nextWidth+=step;
    else if(event.key==='ArrowRight')nextWidth-=step;
    else if(event.key==='Home')nextWidth=MIN_INSPECTOR_WIDTH;
    else if(event.key==='End')nextWidth=inspectorMaximumWidth(viewportWidth());
    else handled=false;
   }else if(event.key==='ArrowUp')nextHeight-=step;
   else if(event.key==='ArrowDown')nextHeight+=step;
   else if(event.key==='Home')nextHeight=MIN_INSPECTOR_HEIGHT;
   else if(event.key==='End')nextHeight=inspectorMaximumHeight(availableHeight());
   else handled=false;
   if(!handled)return;
   event.preventDefault();apply(nextWidth,nextHeight,true);onResizeEnd?.({width,height,kind});
  });
 }
 const observer=new ResizeObserver(()=>{apply(width,height);syncHandles();});
 observer.observe(viewport);observer.observe(panel);
 const mutationObserver=new MutationObserver(syncHandles);
 mutationObserver.observe(panel,{attributes:true,attributeFilter:['hidden','class','style']});
 addEventListener('resize',syncHandles);addEventListener('scroll',syncHandles,true);mobile.addEventListener?.('change',syncHandles);
 apply(width,height);
 return{
  reset(){apply(DEFAULT_INSPECTOR_WIDTH,DEFAULT_INSPECTOR_HEIGHT,true);onResizeEnd?.({width,height,kind:'corner'});},
  destroy(){observer.disconnect();mutationObserver.disconnect();removeEventListener('resize',syncHandles);removeEventListener('scroll',syncHandles,true);mobile.removeEventListener?.('change',syncHandles);for(const handle of Object.values(handles))handle.remove();}
 };
}

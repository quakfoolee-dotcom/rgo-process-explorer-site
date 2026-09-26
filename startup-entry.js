// Keep loading feedback and recovery independent of the heavy application imports.
const loading=document.getElementById('loading'),status=document.getElementById('loading-status'),progress=document.getElementById('loading-progress'),retry=document.getElementById('loading-retry');
const started=performance.now();let ready=false,failed=false;
function fail(error){if(ready||failed)return;failed=true;clearTimeout(timer);clearTimeout(cap);loading.hidden=false;status.textContent='The 3D plant could not finish loading. Check your connection and retry.';progress.hidden=true;retry.hidden=false;loading.setAttribute('aria-busy','false');const renderingError=document.getElementById('error');if(renderingError&&!renderingError.hidden){loading.hidden=true;renderingError.append(retry);}console.error('Plant startup failed',error);}
// Fail on silence, not on total time: a configuration built in the browser reports progress for several minutes.
// A background tab paints no frames, so hold the verdict until the page is visible again.
const timeout=()=>{if(document.hidden){addEventListener('visibilitychange',()=>{if(!ready&&!failed){clearTimeout(timer);timer=setTimeout(timeout,60000);}},{once:true});return;}fail(Error('Startup timeout'));};let timer=setTimeout(timeout,150000);const cap=setTimeout(timeout,1260000);
window.rgoStartup={timing:{started},setProgress({phase,progress:value}){if(failed||ready)return;clearTimeout(timer);timer=setTimeout(timeout,300000);status.textContent=phase+'…';if(value>0)progress.value=value;else progress.removeAttribute('value');},ready(){if(failed||ready)return;ready=true;clearTimeout(timer);clearTimeout(cap);loading.hidden=true;this.timing.firstFrameMs=performance.now()-started;},fail};
retry.onclick=()=>{try{sessionStorage.setItem('rgo-retry-load','1');}catch{}location.reload();};
addEventListener('error',event=>fail(event.error));addEventListener('unhandledrejection',event=>fail(event.reason));
// Let the loading state paint before requesting the application graph.
let importing=false;const start=()=>{if(importing)return;importing=true;import('./app.js').catch(fail);};requestAnimationFrame(()=>setTimeout(start,0));setTimeout(start,1000);

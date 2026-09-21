// Keep loading feedback and recovery independent of the heavy application imports.
const loading=document.getElementById('loading'),status=document.getElementById('loading-status'),progress=document.getElementById('loading-progress'),retry=document.getElementById('loading-retry');
const started=performance.now();let ready=false,failed=false;
function fail(error){if(ready||failed)return;failed=true;clearTimeout(timer);loading.hidden=false;status.textContent='The 3D plant could not finish loading. Check your connection and retry.';progress.hidden=true;retry.hidden=false;loading.setAttribute('aria-busy','false');const renderingError=document.getElementById('error');if(renderingError&&!renderingError.hidden){loading.hidden=true;renderingError.append(retry);}console.error('Plant startup failed',error);}
const timer=setTimeout(()=>fail(Error('Startup timeout')),150000);
window.rgoStartup={timing:{started},setProgress({phase,progress:value}){if(failed||ready)return;status.textContent=phase+'…';if(value>0)progress.value=value;else progress.removeAttribute('value');},ready(){if(failed||ready)return;ready=true;clearTimeout(timer);loading.hidden=true;this.timing.firstFrameMs=performance.now()-started;},fail};
retry.onclick=()=>{try{sessionStorage.setItem('rgo-retry-load','1');}catch{}location.reload();};
addEventListener('error',event=>fail(event.error));addEventListener('unhandledrejection',event=>fail(event.reason));
// Let the loading state paint before requesting the application graph.
requestAnimationFrame(()=>{setTimeout(()=>{import('./app.js').catch(fail);},0);});

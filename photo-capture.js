export function mountPhotoCapture({button,dialog,getMode,onCapture}){
 const $=id=>dialog.querySelector('#'+id),close=$('photo-capture-close'),download=$('photo-capture-download'),status=$('photo-capture-status'),style=$('photo-capture-style');let busy=false;
 function sync(){const mode=getMode();style.textContent=mode==='studio'?'Studio · perspective and photographic lighting':'Engineering · current orthographic view';download.disabled=busy;dialog.querySelectorAll('select').forEach(el=>el.disabled=busy);}
 button.onclick=()=>{status.hidden=true;sync();dialog.showModal();};
 close.onclick=()=>{if(!busy)dialog.close();};
 dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
 download.onclick=async()=>{if(busy)return;busy=true;status.hidden=false;status.textContent='Preparing the high-quality image on this device…';sync();
  try{const result=await onCapture({resolution:Number($('photo-resolution').value),format:$('photo-format').value,background:$('photo-background').value});status.textContent=`Downloaded ${result.width} × ${result.height} px ${result.format.toUpperCase()}${result.reduced?' · adjusted to this device’s graphics limit':''}. No AI rendering credits used.`;}
  catch(error){status.textContent='Photo not saved. '+error.message;}
  finally{busy=false;sync();}
 };
 return {open:()=>button.click()};
}

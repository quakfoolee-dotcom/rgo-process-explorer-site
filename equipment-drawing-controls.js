// Compatibility wiring for the current prepared startup bundle. The maintained
// application marks buttons it owns so a future bundle does not open two sheets.
const ids=new Set(['equipment-drawing-open','explore-drawing-open']);

document.addEventListener('click',async event=>{
 const button=event.target.closest('button');
 if(!button||!ids.has(button.id)||button.dataset.drawingSourceWired==='true')return;
 const explorer=window.reactorExplorer;
 if(!explorer){alert('The plant is still loading. Try the drawing sheet again when the model is ready.');return;}
 const state=explorer.getState();
 const equipmentId=button.id==='explore-drawing-open'?state.exploration?.equipmentId:state.selection?.equipmentId;
 if(equipmentId==null){alert('Select equipment with a modeled assembly first.');return;}
 button.disabled=true;button.setAttribute('aria-busy','true');
 try{
  const {openEquipmentDrawing}=await import('./equipment-drawing.js?v=129');
  const showAccessories=document.getElementById(button.id==='explore-drawing-open'?'explore-accessories':'equipment-accessories')?.checked===true;
  const register=Object.fromEntries(Object.entries(explorer.model.equipment).map(([id,equipment])=>[id,{...equipment,name:equipment.name||equipment.label}]));
  await openEquipmentDrawing({model:explorer.model,equipmentId,register,showAccessories});
 }catch(error){alert('Unable to open drawing sheet: '+error.message);}
 finally{button.disabled=false;button.removeAttribute('aria-busy');}
});

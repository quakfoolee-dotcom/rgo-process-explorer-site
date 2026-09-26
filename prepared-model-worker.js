self.onmessage=async({data})=>{
 try{
  globalThis.rgoModelQuery=new URLSearchParams({a400:data.selection.a400||''}).toString();
  const [{buildModel},{prepareModelContext},{encodePreparedModel}]=await Promise.all([import('./model.js'),import('./prepare-model-context.js'),import('./prepared-model-codec.js')]);
  const model=buildModel({...data.selection,onPhase:phase=>self.postMessage({progress:{phase:'Preparing '+phase.replace(/([A-Z])/g,' $1').toLowerCase(),progress:0}})});
  self.postMessage({progress:{phase:'Preparing area inspection context',progress:0}});
  model.preparedContext=prepareModelContext(model);model.preparedSelection=data.selection;
  self.postMessage({progress:{phase:'Preparing plant geometry for this browser',progress:0}});
  const raw=encodePreparedModel(model);self.postMessage({progress:{phase:'Compressing selected configuration',progress:0}});
  const bytes=await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
  self.postMessage({bytes},[bytes]);
 }catch(error){self.postMessage({error:error.message||'Configuration could not be prepared.'});}
};

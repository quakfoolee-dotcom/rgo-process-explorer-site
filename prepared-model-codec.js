import * as T from './vendor/three.module.js';
import {geometryFromRecipe,recipeIsExact} from './geometry-recipe.js';

// Reference-preserving model snapshot. Geometry arrays retain their exact bytes;
// Float64 transforms, metadata, shared references and safety obstacles are intact.
// Completed construction helpers (roof/port/connectWash) are intentionally omitted;
// interactive inspection uses their completed parts, ports and geometry parameters.
export const SNAPSHOT_SCHEMA=3;
const classes=['Vector2','Vector3','Vector4','Quaternion','Euler','Box2','Box3','Sphere','Matrix3','Matrix4','Color','Plane','Shape','Path','CurvePath','LineCurve','LineCurve3','CubicBezierCurve','CubicBezierCurve3','QuadraticBezierCurve3','SplineCurve','ArcCurve','QuadraticBezierCurve','EllipseCurve','CatmullRomCurve3'];
const typed={Float32Array,Float64Array,Uint32Array,Uint16Array,Uint8Array,Int32Array,Int16Array,Int8Array,Uint8ClampedArray};
const geometryKeys=['type','parameters','index','attributes','morphAttributes','morphTargetsRelative','groups','drawRange','boundingBox','boundingSphere','userData','name'];
export function encodePreparedModel(model,{onStats=()=>{}}={}){
 const nodes=[],seen=new Map(),chunks=[],strings=[],stringIds=new Map();let binaryLength=0;
 const intern=s=>{if(!stringIds.has(s)){stringIds.set(s,strings.length);strings.push(s);}return stringIds.get(s);};
 const binary=array=>{binaryLength=Math.ceil(binaryLength/8)*8;const offset=binaryLength;chunks.push({offset,bytes:new Uint8Array(array.buffer,array.byteOffset,array.byteLength)});binaryLength+=array.byteLength;return offset;};
 function ref(value,path='model'){
  if(value===undefined)return ['undefined'];
  if(typeof value==='string')return ['s',intern(value)];
  if(typeof value==='number'&&!Number.isFinite(value))return ['number',String(value)];
  if(value===null||typeof value!=='object'){if(typeof value==='function'){if(['roof','port','connectWash'].includes(path.split('.').at(-1)))return ['builder'];throw Error('Functions cannot be stored in a prepared model: '+path);}return value;}
  if(seen.has(value))return [seen.get(value)];
  const id=nodes.length;seen.set(value,id);nodes.push(null);let node;
  const vectorClass=['Vector2','Vector3','Vector4','Quaternion','Matrix3','Matrix4'].find(name=>value.constructor===T[name]);
  if(vectorClass){const array=new Float64Array(value.toArray());node=['Vector',vectorClass,binary(array),array.length];}
  else if(Array.isArray(value)&&value.length&&value.every(x=>typeof x==='number')){const C=value.every(x=>Number.isInteger(x)&&x>=0&&x<=4294967295)?Uint32Array:Float64Array,array=new C(value);node=['Numbers',C.name,binary(array),array.length];}
  else if(ArrayBuffer.isView(value)){
   if(!typed[value.constructor.name])throw Error('Unsupported numeric array');
   node=['Typed',value.constructor.name,binary(value),value.length];
  }else if(Array.isArray(value))node=['Array',value.map((v,i)=>ref(v,path+'.'+i))];
  else if(value instanceof Map)node=['Map',[...value].map(([k,v])=>[ref(k,path+'.key'),ref(v,path+'.map')])];
  else if(value instanceof Set)node=['Set',[...value].map((v,i)=>ref(v,path+'.'+i))];
  else {
   let kind=classes.find(name=>value.constructor===T[name])||value.constructor?.name||'Object',entries;
   if(value.isBufferGeometry){kind='Geometry';const recipe=recipeIsExact(value);entries=geometryKeys.filter(k=>value[k]!==undefined&&(!recipe||!['attributes','index'].includes(k))).map(k=>[k,value[k]]);if(recipe)entries.push(['preparedRecipe',true]);}
   else if(value.isBufferAttribute){kind='Attribute';entries=['array','itemSize','normalized','name','usage','gpuType'].filter(k=>value[k]!==undefined).map(k=>[k,value[k]]);}
   else {if(kind!=='Object'&&!classes.includes(kind))throw Error('Unsupported model class: '+kind);entries=Object.entries(value);}
   node=[kind,entries.map(([k,v])=>[intern(k),ref(v,path+'.'+k)])];
  }
  nodes[id]=node;return [id];
 }
 const root=ref(model),encoder=new TextEncoder(),blocks=list=>{const result=[];for(let i=0;i<list.length;i+=4096)result.push(encoder.encode(JSON.stringify(list.slice(i,i+4096))));return result;},stringBlocks=blocks(strings),nodeBlocks=blocks(nodes);
 const header=encoder.encode(JSON.stringify({schema:SNAPSHOT_SCHEMA,root,stringBlocks:stringBlocks.map(b=>b.length),nodeBlocks:nodeBlocks.map(b=>b.length)})),jsonLength=header.length+[...stringBlocks,...nodeBlocks].reduce((s,b)=>s+b.length,0),offset=Math.ceil((8+jsonLength)/8)*8,buffer=new ArrayBuffer(offset+binaryLength),view=new DataView(buffer);
 onStats({nodes:nodes.length,jsonBytes:jsonLength,binaryLength});
 view.setUint32(0,0x52474f31,true);view.setUint32(4,header.length,true);let at=8;for(const block of [header,...stringBlocks,...nodeBlocks]){new Uint8Array(buffer,at,block.length).set(block);at+=block.length;}
 for(const c of chunks)new Uint8Array(buffer,offset+c.offset,c.bytes.length).set(c.bytes);
 return buffer;
}
export async function decodePreparedModel(buffer,{onProgress=()=>{},yieldControl=()=>new Promise(r=>setTimeout(r,0))}={}){
 const view=new DataView(buffer);if(view.byteLength<8||view.getUint32(0,true)!==0x52474f31)throw Error('Invalid prepared model');
 const length=view.getUint32(4,true);
 const data=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,8,length)));
 if(data.schema!==SNAPSHOT_SCHEMA)throw Error('Prepared model version mismatch');
 const nodes=[],strings=[],decoder=new TextDecoder();let at=8+length,readSlice=performance.now(),readCount=0;
 for(const[sizes,list]of [[data.stringBlocks,strings],[data.nodeBlocks,nodes]])for(const size of sizes){const rows=JSON.parse(decoder.decode(new Uint8Array(buffer,at,size)));for(const row of rows)list.push(row);at+=size;readCount++;if(performance.now()-readSlice>8){onProgress({phase:'Reading plant data',progress:readCount/(data.stringBlocks.length+data.nodeBlocks.length)});await yieldControl();readSlice=performance.now();}}
 const offset=Math.ceil(at/8)*8,values=new Array(nodes.length);let slice=performance.now();
 async function checkpoint(i,phase){if(performance.now()-slice>8){onProgress({phase,progress:i/nodes.length});await yieldControl();slice=performance.now();}}
 for(let i=0;i<nodes.length;i++){
  const n=nodes[i],kind=n[0];
  if(kind==='Vector')values[i]=new T[n[1]]().fromArray(new Float64Array(buffer,offset+n[2],n[3]));
  else if(kind==='Numbers')values[i]=Array.from(new typed[n[1]](buffer,offset+n[2],n[3]));
  else if(kind==='Array')values[i]=[];
  else if(kind==='Map')values[i]=new Map();
  else if(kind==='Set')values[i]=new Set();
  else if(kind==='Typed'){const C=typed[n[1]];if(!C)throw Error('Invalid numeric format');values[i]=new C(buffer,offset+n[2],n[3]);}
  else if(kind==='Geometry')values[i]=new T.BufferGeometry();
  else if(kind==='Attribute')values[i]=new T.BufferAttribute(new Float32Array(),1);
  else if(kind==='Object')values[i]={};
  else if(classes.includes(kind))values[i]=new T[kind]();
  else throw Error('Unsupported prepared class: '+kind);
  if(i%512===0)await checkpoint(i,'Preparing components');
 }
 const deref=v=>!Array.isArray(v)?v:v[0]==='s'?strings[v[1]]:['undefined','builder'].includes(v[0])?undefined:v[0]==='number'?Number(v[1]):values[v[0]];
 for(let i=0;i<nodes.length;i++){
  const [kind,fields]=nodes[i],v=values[i];
  if(kind==='Array')for(const x of fields)v.push(deref(x));
  else if(kind==='Map')for(const[k,x]of fields)v.set(deref(k),deref(x));
  else if(kind==='Set')for(const x of fields)v.add(deref(x));
  else if(!['Typed','Vector','Numbers'].includes(kind))for(const[k,x]of fields)Object.defineProperty(v,strings[k],{value:deref(x),writable:true,enumerable:true,configurable:true});
  if(kind==='Attribute')v.count=v.array.length/v.itemSize;
  if(i%512===0)await checkpoint(i,'Connecting model data');
 }
 for(let i=0;i<nodes.length;i++)if(nodes[i][0]==='Geometry'&&values[i].preparedRecipe){const target=values[i],g=geometryFromRecipe(target.type,target.parameters,target.userData.preparedShell);if(!g)throw Error('Invalid geometry recipe');target.attributes=g.attributes;target.index=g.index;delete target.preparedRecipe;await checkpoint(i,'Opening equipment shapes');}
 onProgress({phase:'Model ready',progress:1});return deref(data.root);
}

import {screenInterferences} from './inspection.js';
self.onmessage=({data})=>{try{const result=screenInterferences(data.model,data.options);self.postMessage({requestId:data.requestId,result})}catch(e){self.postMessage({requestId:data.requestId,error:e.message})}};

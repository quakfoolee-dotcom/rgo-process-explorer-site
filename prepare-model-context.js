import {equipmentRegister} from './engineering-register.js';
import {equipmentSupportContext} from './structural-kit.js';
import {a3000ConnectionContext} from './vent-review.js';
import {prepareAreaVisibility} from './view-modes.js';
export function prepareModelContext(model){
 const register=equipmentRegister(model.equipment),mountingContext=equipmentSupportContext(model);
 for(const[id,connected]of a3000ConnectionContext(model)){const ids=mountingContext.get(id)||new Set();for(const p of connected)ids.add(p);mountingContext.set(id,ids);}
 return {mountingContext,areaVisibility:prepareAreaVisibility(model,register,mountingContext)};
}

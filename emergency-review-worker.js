import {restoreEmergencyReview} from './emergency-review-snapshot.js';
import {inspectEmergencyStations,calculateEmergencyCoverage} from './emergency-station-review.js';
import {EMERGENCY_EXPOSURE_POINTS} from './emergency-exposure-points.js';

self.onmessage=({data})=>{
 try{
  const model=restoreEmergencyReview(data);
  self.postMessage({type:'progress',stage:'stations'});
  const start=performance.now(),review=inspectEmergencyStations(model),stationMs=performance.now()-start;
  self.postMessage({type:'progress',stage:'routes'});
  const routeStart=performance.now(),coverage=calculateEmergencyCoverage(model,review,EMERGENCY_EXPOSURE_POINTS);
  self.postMessage({type:'result',review,coverage,timing:{stationMs,routeMs:performance.now()-routeStart}});
 }catch(error){self.postMessage({type:'error',message:error.message||'Station inspection failed'});}
};

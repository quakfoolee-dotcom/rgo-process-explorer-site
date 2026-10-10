// Display colour of structural steel and equipment bodies in the Pipe ID (flow) view. `color` is the steel; `equipment` is a separate shade so racks and vessels stay distinguishable. Presets only: each stays clear of the pipe-identification palette.
// The old context slate (#43546b) read as black beside the inert-gas pipes (#4d5b6b), so galvanized grey is the default.
export const STEEL_PRESETS={
 galvanized:{label:'Galvanized grey',color:'#c4c7ca',equipment:'#939598'},
 pale:{label:'Pale grey',color:'#dfe4e8',equipment:'#c9cdd1'},
 mid:{label:'Mid grey',color:'#7d858c',equipment:'#8a929a'},
 blue:{label:'Blue steel',color:'#6f87a6',equipment:'#627792'},
 slate:{label:'Dark slate (previous)',color:'#43546b',equipment:'#43546b'}
};
export const DEFAULT_STEEL_PRESET='galvanized';
const KEY='rgo.steelColour';
export const steelPresetKey=value=>Object.hasOwn(STEEL_PRESETS,value)?value:DEFAULT_STEEL_PRESET;
export function loadSteelPreset(storage=globalThis.localStorage){try{return steelPresetKey(storage?.getItem(KEY));}catch{return DEFAULT_STEEL_PRESET;}}
export function saveSteelPreset(value,storage=globalThis.localStorage){try{storage?.setItem(KEY,steelPresetKey(value));}catch{/* storage may be blocked; the choice then lasts for the session */}}

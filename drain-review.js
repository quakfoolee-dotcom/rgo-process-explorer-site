// v115 · 2026-09-14. Geometry comparison only; no hydraulic sizing claim.
import {A400_DRAIN_LAYOUT as layout} from './a400-drain.js';
export const lengthOf=points=>points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(...p.map((v,k)=>v-points[i][k])),0);
export const drainComparison={version:115,date:'2026-09-14',revision:layout.revision,points:layout.points,modelledLength:lengthOf(layout.points),straightLineLowerBound:lengthOf([layout.points[0],layout.points.at(-1)]),holds:layout.holds};

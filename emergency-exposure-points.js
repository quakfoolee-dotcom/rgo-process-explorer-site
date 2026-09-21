import {ADDITIONAL_EMERGENCY_TASKS} from './emergency-task-basis.js';
// Candidate work positions, never approved exposure locations.
const LEGACY_EMERGENCY_EXPOSURE_POINTS=[
  {
    "id": "LOCAL-R141A",
    "label": "A-140 · R-141A approach",
    "point": [
      -29,
      -11.5
    ],
    "area": "A-140",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-R141B",
    "label": "A-140 · R-141B approach",
    "point": [
      -25,
      -11.5
    ],
    "area": "A-140",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-R141C",
    "label": "A-140 · R-141C approach",
    "point": [
      -29,
      -23
    ],
    "area": "A-140",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-R141D",
    "label": "A-140 · R-141D approach",
    "point": [
      -25,
      -23
    ],
    "area": "A-140",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-T161",
    "label": "A-160 · T-161 approach",
    "point": [
      -22.25,
      -15
    ],
    "area": "A-160",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-T162",
    "label": "A-160 · T-162 approach",
    "point": [
      -22.25,
      -20
    ],
    "area": "A-160",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-T163",
    "label": "A-160 · T-163 / P-165 service bay approach",
    "point": [
      -23.75,
      -25
    ],
    "area": "A-160",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-F161",
    "label": "A-160 · F-161 approach",
    "point": [
      -10.75,
      -21
    ],
    "area": "A-160",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-D164",
    "label": "A-160 · D-164 approach",
    "point": [
      -12.25,
      -15.75
    ],
    "area": "A-160",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-TR164",
    "label": "A-160 · TR-164 approach",
    "point": [
      -12.5,
      -17.25
    ],
    "area": "A-160",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-R201A",
    "label": "A-200 · R-201A approach",
    "point": [
      -2.5,
      3.75
    ],
    "area": "A-200",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-R201B",
    "label": "A-200 · R-201B approach",
    "point": [
      2.5,
      -4
    ],
    "area": "A-200",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-R201C",
    "label": "A-200 · R-201C approach",
    "point": [
      -2.5,
      -12.5
    ],
    "area": "A-200",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-R201D",
    "label": "A-200 · R-201D approach",
    "point": [
      2.5,
      -12.5
    ],
    "area": "A-200",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-DOSE201AB",
    "label": "A-200 · A/B dosing frontage approach",
    "point": [
      -2.5,
      -7.5
    ],
    "area": "A-200",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-DOSE201CD",
    "label": "A-200 · C/D dosing frontage approach",
    "point": [
      -2.5,
      -23.5
    ],
    "area": "A-200",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-T201",
    "label": "A-200 · T-201 approach",
    "point": [
      -10.75,
      0
    ],
    "area": "A-200",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-T202",
    "label": "A-200 · T-202 approach",
    "point": [
      -10.5,
      -6.75
    ],
    "area": "A-200",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-T301",
    "label": "A-300 · T-301 approach",
    "point": [
      10.75,
      -6.75
    ],
    "area": "A-300",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-T303",
    "label": "A-300 · T-303 approach",
    "point": [
      10.75,
      0
    ],
    "area": "A-300",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-T305",
    "label": "A-300 · T-305 approach",
    "point": [
      10.75,
      6.75
    ],
    "area": "A-300",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-T302",
    "label": "A-300 · T-302 approach",
    "point": [
      10.75,
      10.5
    ],
    "area": "A-300",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-C301",
    "label": "A-300 · C-301 approach",
    "point": [
      -1.75,
      6.25
    ],
    "area": "A-300",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "LOCAL-T304",
    "label": "A-300 · T-304 approach",
    "point": [
      1,
      13.5
    ],
    "area": "A-300",
    "riskAssumption": "high",
    "basis": "Equipment-side work approach; exposure task and SDS assessment pending",
    "exposureVerified": false
  },
  {
    "id": "wastewater-0",
    "label": "East frontage",
    "point": [
      57.75,
      2.75
    ],
    "area": "A-1000",
    "riskAssumption": "high",
    "basis": "Sampled service approach; chemical task, exposure position and risk pending",
    "exposureVerified": false
  },
  {
    "id": "wastewater-2",
    "label": "Treatment bays",
    "point": [
      35,
      -15.25
    ],
    "area": "A-1000",
    "riskAssumption": "high",
    "basis": "Sampled service approach; chemical task, exposure position and risk pending",
    "exposureVerified": false
  },
  {
    "id": "wastewater-3",
    "label": "West treatment bays · turn back",
    "point": [
      13.6,
      -15.25
    ],
    "area": "A-1000",
    "riskAssumption": "high",
    "basis": "Sampled service approach; chemical task, exposure position and risk pending",
    "exposureVerified": false
  },
  {
    "id": "washing-0",
    "label": "Rear module aisle",
    "point": [
      25,
      17.3
    ],
    "area": "A-400",
    "riskAssumption": "high",
    "basis": "Sampled service approach; chemical task, exposure position and risk pending",
    "exposureVerified": false
  },
  {
    "id": "washing-4",
    "label": "Front service junction · alternate clear viewpoint",
    "point": [
      15,
      28.75
    ],
    "area": "A-400",
    "riskAssumption": "high",
    "basis": "Sampled service approach; chemical task, exposure position and risk pending",
    "exposureVerified": false
  },
  {
    "id": "washing-5",
    "label": "Washing equipment frontage · alternate clear viewpoint",
    "point": [
      25.25,
      28.75
    ],
    "area": "A-400",
    "riskAssumption": "high",
    "basis": "Sampled service approach; chemical task, exposure position and risk pending",
    "exposureVerified": false
  },
  {
    "id": "reclaimed-7",
    "label": "CIP / concentrate approach",
    "point": [
      102.25,
      -26.5
    ],
    "area": "A-2000",
    "riskAssumption": "high",
    "basis": "Sampled service approach; chemical task, exposure position and risk pending",
    "exposureVerified": false
  }
];

export const EMERGENCY_EXPOSURE_POINTS=[...LEGACY_EMERGENCY_EXPOSURE_POINTS.map(e=>({...e,elevationM:0,eyeRisk:'unassigned',skinRisk:'unassigned',work:e.basis,material:'Confirm SDS and concentration'})),...ADDITIONAL_EMERGENCY_TASKS];

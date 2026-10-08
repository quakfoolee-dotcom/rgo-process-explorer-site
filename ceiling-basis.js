// Building ceiling basis (V328). The plant is to go into an existing building with a 30 ft (9.144 m) ceiling (QFL 2026-10-08). The clearance below the ceiling
// for roof steel, lights and sprinklers is an assumption until the as-built drawings are known, so the usable clear height is 9.144 - 0.85 = 8.294 m.
// Nothing here is measured from the real building: confirm the ceiling height (underside of roof steel), the clearance and any high bay.
const CEILING_M=30*.3048,CLEARANCE_M=.85;
export const CEILING_BASIS={revision:'V328',decision:'D-MDL-10',date:'2026-10-08',ceilingFt:30,ceilingM:CEILING_M,clearanceM:CLEARANCE_M,clearM:CEILING_M-CLEARANCE_M,assumed:true,
 note:'30 ft ceiling from QFL (2026-10-08). The 0.85 m clearance for roof steel, lights and sprinklers, the single ceiling height for the whole footprint, and the absence of a high bay are assumptions pending the as-built building drawings.'};

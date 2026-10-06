// Structured overview text for the equipment whose geometry status is long. The status string is one field that mixes what the
// equipment is with how it was modelled, so the inspector shows a short summary and keeps the rest as labelled notes.
//
// The notes are the record's geometry status split at sentence boundaries, with no wording changed: joined with single spaces
// (after the summary, when summaryInStatus is set) they must equal the status exactly. structuredFor() returns an entry only when
// that holds for the text the panel is showing (apart from the two known acid-route additions), so a record whose status was edited falls back to
// the plain (folded) description instead of showing stale notes. tests/validate-equipment-notes.mjs reports which entries drifted.
// To change a record: edit its status where it is defined, then update its entry here (or delete the entry).
export const NOTE_LABELS=['Basis','Basis and connections','Position','Position and spacing','Position and open items','Geometry','Geometry and sizing','Constraints','Connections','Bypass','Limits','Not modelled','Open items','Route option','Route note'];
export const EQUIPMENT_NOTES={
 "SL-1001":
  {summary:"Hydrated lime silo in A-1000: Ø 4.5 m with a 60° conical hopper, 135 m³ (two days of storage at the bounding dose; provisional). Piped for tanker fill, a filtered vent and discharge to T-1002; all provisional.",notes:[
   {label:"Basis",text:"Envelope from FEED-PE-DAT-127 (D-MDL-01 release 3, LAY-10 ruling L1). Standalone — tie-ins deferred to the model engineer. Screening size; vendor geometry unqualified."},
   {label:"Position",text:"Back at its A-1000 position (18, −24.5), ≈ 9 m from T-1002 (D-MDL-07, QFL 2026-10-04; D-MDL-06 had moved it east of x 70)."},
   {label:"Geometry and sizing",text:"Ø 4.5 m with a 60° conical hopper (0.5 m outlet at 3 m), cylinder to ≈ 13.7 m. The volume is 2 days at the 40.5 t/d bounding dose (CAL-034) at a settled bulk density of 0.6 t/m³ = 135 m³; DAT-127 implies 200 m³ (0.405 t/m³ loose), so the density and the storage days are provisional until the datasheet owner and a lime supplier confirm them."},
   {label:"Constraints",text:"Only Ø 4.5 m fits here without moving the overhead lines at y 8.7–11.8 m (0.31 m clearance). Cone angle and outlet size are model choices pending the vendor flow test. Tanker access from the WATER-DELIVERY frontage (z −31.5…−28.5)."},
   {label:"Connections",text:"Piping (D-MDL-08, QFL 2026-10-04): closed pneumatic tanker fill (coupling BL-FILLSL1001, isolation valve XV-SL1001-FILL, riser on the north side), roof dust filter with a vent to atmosphere, and a rotary valve plus inclined enclosed screw conveyor (≈ 34°, above the usual ≈ 30° limit; vendor to confirm) to a new roof nozzle on T-1002 — provisional until the powder-versus-slurry report."},
   {label:"Not modelled",text:"Make-up water to T-1002 and hopper aeration air are not modelled."}
  ]},
 "CL-1001":
  {summary:"HDS thickener, Ø 6.5 m, inside A-1000 beside DC-1001 and T-1008. Its gravity feed from R-1004 is not connected yet.",notes:[
   {label:"Basis",text:"Envelope from FEED-PE-DAT-118 (D-MDL-01 release 3, LAY-10 ruling L1). Standalone — tie-ins deferred to the model engineer. Screening size; vendor geometry unqualified."},
   {label:"Position",text:"Relocated inside A-1000 (D-MDL-03, QFL 2026-09-30) to the former T-1004 / P-1001 position after the retired equipment was removed and the interarea lines were re-routed; ≈ 17 m from R-1004, beside DC-1001 and T-1008."},
   {label:"Open items",text:"Tie-ins deferred: the gravity feed from R-1004 needs the thickener feedwell below the R-1004 overflow (≈ 1.0 m in the model) — sink CL-1001 or raise the cascade (W7, civil)."}
  ]},
 "HR-601":
  {summary:"HR-601 is a proposed air-to-air heat exchanger on the DR-601 spray-dryer package (A-600). It uses the hot dryer exhaust to pre-warm the incoming drying air.",summaryInStatus:true,notes:[
   {label:"Basis and connections",text:"Envelope from FEED-PE-DAT-141 (D-MDL-01 release 2) for ≈ 408,000 m³/h exhaust, ducted in series between F-601 and FN-601 on the exhaust side and between the ambient-air battery limit and BL-601 on the air side."},
   {label:"Bypass",text:"The exhaust-side bypass damper DV-601-BYP (datasheet item 3.2, normally closed) is modelled."},
   {label:"Limits",text:"Duct sizes are model choices; vendor geometry unqualified."}
  ]},
 "V-5401":
  {summary:"Thermal-oil expansion vessel: a horizontal N₂-blanketed drum, Ø 1.8 × 4.5 m (≈ 11 m³), on a frame above the loop high point.",notes:[
   {label:"Geometry",text:"Horizontal N₂-blanketed expansion drum Ø 1.8 × 4.5 m (≈ 11 m³) on a frame above the loop high point, with deck, handrail and ladder; the air separator on the pump suction belongs to this assembly until LST-001 allocates a tag."},
   {label:"Basis",text:"Real-world geometry and the thermal-oil mains to HX-601 (and PK-1101 under Route 2 + 6) on a dedicated rack: D-MDL-05 (QFL 2026-10-01), dist/thermal-oil.js; dimensions are model choices pending vendor data (U8)."}
  ]},
 "H-5400":
  {summary:"Gas-fired thermal-oil heater, 14 MW rated: a horizontal coil heater Ø 3.6 × 10 m on saddles with a Ø 1.4 m stack to about 20 m (stack height provisional).",notes:[
   {label:"Geometry",text:"Horizontal cylindrical coil heater Ø 3.6 × 10 m on saddles, burner and FD fan at the north end, flue box and Ø 1.4 m stack to ≈ 20 m (provisional, dispersion study) at the rear (FEED-PE-DAT-140)."},
   {label:"Basis",text:"Real-world geometry and the thermal-oil mains to HX-601 (and PK-1101 under Route 2 + 6) on a dedicated rack: D-MDL-05 (QFL 2026-10-01), dist/thermal-oil.js; dimensions are model choices pending vendor data (U8)."}
  ]},
 "A-5400":
  {summary:"Thermal-oil heater package, 14 MW, on a 10 × 18 m pad in the future-expansion block, connected to HX-601 by DN300 thermal-oil mains.",notes:[
   {label:"Basis",text:"Envelope from FEED-PE-DAT-140 (D-MDL-01 release 3, LAY-10 ruling L1)."},
   {label:"Connections",text:"Connected: DN300 thermal-oil mains to HX-601 (and DN150 to PK-1101 under Route 2 + 6) on a dedicated rack, D-MDL-05 (QFL 2026-10-01)."},
   {label:"Position and spacing",text:"Future-expansion block; ≈ 27 m from the A-600 edge (DR-601), ≈ 14 m from the A-800 block edge and ≈ 17 m from the A-1100 bund — HAZOP inputs (U8, FEED-PS-HOP-001), not a spacing ruling."}
  ]},
 "T-5401":
  {summary:"Thermal-oil drain / storage tank: a horizontal drum Ø 2.6 × 6 m (≈ 30 m³) on saddles at grade inside the curbed pad.",notes:[
   {label:"Geometry",text:"Horizontal drain / storage drum Ø 2.6 × 6 m (≈ 30 m³) on saddles at grade inside the curbed pad; drain-down by N₂ push (a gravity drain would need a pit — vendor, U8)."},
   {label:"Basis",text:"Real-world geometry and the thermal-oil mains to HX-601 (and PK-1101 under Route 2 + 6) on a dedicated rack: D-MDL-05 (QFL 2026-10-01), dist/thermal-oil.js; dimensions are model choices pending vendor data (U8)."}
  ]},
 "P-5401":
  {summary:"Thermal-oil circulation pumps, 900 m³/h: 1 + 1 horizontal end-suction hot-oil pumps with suction from the air separator and discharge to the heater coil.",notes:[
   {label:"Geometry",text:"1 + 1 horizontal end-suction hot-oil pumps with motors on baseplates, suction from the air separator, discharge to the heater coil (FEED-PE-DAT-140)."},
   {label:"Basis",text:"Real-world geometry and the thermal-oil mains to HX-601 (and PK-1101 under Route 2 + 6) on a dedicated rack: D-MDL-05 (QFL 2026-10-01), dist/thermal-oil.js; dimensions are model choices pending vendor data (U8)."}
  ]},
 "F-160":
  {summary:"Pre-G acid filter, a 2.54 m² agitated pressure filter in A-160, placed south of F-161.",notes:[
   {label:"Basis",text:"Envelope from FEED-PE-DAT-106 (D-MDL-01 release 2). Standalone — tie-ins deferred to the model engineer. Diameters and heights are model choices; vendor geometry unqualified."},
   {label:"Position and open items",text:"Agitated pressure filter; placed south of F-161 (no clear space beside T-161), so the R-141 feed and the cake transfer to T-161 need a re-layout — deferred."}
  ]},
 "T-1101":
  {summary:"Concentrator feed tank, 125 m³, in the A-1100 acid bund, south-east yard (Ø 5.5 × 5.4 m from the Sheet 2 geometry).",notes:[
   {label:"Basis",text:"Envelope from FEED-PE-DAT-110 (D-MDL-01 release 3, LAY-10 ruling L1). Standalone — tie-ins deferred to the model engineer. Screening size; vendor geometry unqualified."},
   {label:"Position",text:"A-1100 acid bund, south-east yard (Sheet 2 geometry Ø 5.5 × 5.4 m)."}
  ]},
 "T-1102":
  {summary:"Recovered acid tank, 200 m³, in the A-1100 acid bund, south-east yard (Ø 6.0 × 7.2 m from the Sheet 2 geometry).",notes:[
   {label:"Basis",text:"Envelope from FEED-PE-DAT-111 (D-MDL-01 release 3, LAY-10 ruling L1). Standalone — tie-ins deferred to the model engineer. Screening size; vendor geometry unqualified."},
   {label:"Position",text:"A-1100 acid bund, south-east yard (Sheet 2 geometry Ø 6.0 × 7.2 m)."}
  ]},
 "P-1102":
  {summary:"Recovered acid return pumps A/B: 1 + 1 inside the A-1100 bund, returning to T-201 / T-102 on the south rack.",notes:[
   {label:"Basis",text:"Envelope from FEED-PE-DAT-113 (D-MDL-01 release 3, LAY-10 ruling L1). Standalone — tie-ins deferred to the model engineer. Screening size; vendor geometry unqualified."},
   {label:"Position",text:"1 + 1 inside the A-1100 bund; return to T-201 / T-102 on the south rack."}
  ]},
 "PK-1101":
  {summary:"Spent-acid concentrator package, screening envelope 14 × 10 m; footprint, height and evaporator arrangement are vendor data.",notes:[
   {label:"Basis",text:"Envelope from FEED-PE-DAT-109 (D-MDL-01 release 3, LAY-10 ruling L1). Standalone — tie-ins deferred to the model engineer. Screening size; vendor geometry unqualified."},
   {label:"Open items",text:"Footprint, height and evaporator arrangement are vendor data (hold K1, REP-039 M5)."}
  ]}
};

const squash=s=>String(s||'').replace(/\s+/g,' ').trim();
export function flatStatus(entry){return [...(entry.summaryInStatus?[entry.summary]:[]),...entry.notes.map(n=>n.text)].join(' ');}
// The acid-route setting adds one known sentence to some records: a prefix under Route 2 + 6 (applyAcidRoute in model-catchup.js) and a
// Route 0 note on CL-1001 and SL-1001. Those two additions become extra notes; any other difference means the entry is stale.
const ROUTE_PREFIX=/^OPTION — Route 2 \+ 6 acid recovery, gated on REP-039 M1–M3 \(D-MDL-02\)\.\s+/;
const ROUTE_SUFFIX=/^Under Route 0 /;
export function structuredFor(tag,shownText){
 const entry=EQUIPMENT_NOTES[tag];if(!entry)return null;
 const flat=squash(flatStatus(entry));let rest=squash(shownText),prefix=null,suffix=null;
 if(rest===flat)return entry;
 const m=rest.match(ROUTE_PREFIX);if(m){prefix=m[0].trim();rest=rest.slice(m[0].length);}
 if(rest.startsWith(flat+' ')){const tail=rest.slice(flat.length+1);if(ROUTE_SUFFIX.test(tail)){suffix=tail;rest=flat;}}
 if(rest!==flat||(!prefix&&!suffix))return null;
 return {...entry,notes:[...(prefix?[{label:'Route option',text:prefix}]:[]),...entry.notes,...(suffix?[{label:'Route note',text:suffix}]:[])]};
}

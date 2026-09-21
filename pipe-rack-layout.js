// Shared-structure layout controls, metres, Y up. Every dimension is a concept
// envelope, not a calculated allowable pipe span or a rated steel section.
export const PIPE_RACK_LAYOUT = {
  revision: 'bc-corridors-85',
  strategy: 'Reserve the complete forklift sweep first; place shared rails and columns outside it, then consolidate only with replacement attachments',
  primaryBayTargetM: 6,
  // A concept portal may bridge the reserved entrance. This search bound is not
  // an allowable steel span; every such bay is recorded for structural design.
  vehicleCrossingMaximumConceptSpanM: 12,
  secondaryReachTargetM: 2.5,
  minimumSharedBearings: 3,
  minimumSharedLengthM: 2.4,
  corridorBandM: 4,
  tierBandM: 3,
  consolidation: {
    passes: 3,
    maximumBracketLengthM: 4,
    maximumAttachmentDistanceM: 3.5,
    existingMemberNames: [
      '^AR801-UPPER support column$',
      '^HD-6201(?: branch)? support column$',
      '^A-6100 source riser .* column$',
      '^PL-(601|801)(?: landing [1-5])? (?:deck support column|landing edge girder|bridge support column|bridge girder|extended landing girder|utility rack column|platform column|walkway column)$',
    ],
    exclusionPattern: 'weigh|load.cell|VSEP|vibrat|handrail|guardrail|ladder|nozzle|shell',
    qualification: 'Proposed attachment to explicitly selected fixed structural members with a modeled frame-only foundation path. Additional reactions, connection strength and host capacity remain HOLD.',
    comparisonBaseline: {"revision":"A5000-concept-70","frames":235,"columns":589,"bearings":3602,"memberLengthM":13442.295756132358,"memberEnvelopeVolumeM3":167.7403657023889},
  },
  comparisonBaseline: {"revision":"A5000-concept-70","frames":235,"columns":589,"bearings":3602,"memberLengthM":13442.295756132358,"memberEnvelopeVolumeM3":167.7403657023889},
  fixedCorridors: [{
    id:'PR-A800-VENT',areaId:'A-800',axis:2,
    from:[93,10.63875,23],to:[93,10.63875,32.97],
    columnStations:[[93,10.63875,23],[93,10.63875,32.97]],
    purpose:'Shared elevated vent-riser backing rail retaining previous F-802 mounting access above the platform',
    qualification:'Long clear span retained from prior mounting geometry; beam deflection, strength, stability and reactions require calculation',
  }],
  policies: {
    'A-5000': 'Common columns and stacked thermal rails; vehicle swept reservations and maintenance zones govern placement. Retain individual bearings and thermal movement; strength and restraints HOLD.',
    'A-100': 'Shared feed-service rails with local pump suction pedestals',
    'A-140': 'Common preparation-service rails outside operating positions',
    'A-160': 'Shared fixed service steel outside platform passages and removal envelopes',
    'A-200': 'Parallel reactor service corridors; local nozzle attachments remain independent',
    'A-300': 'Common wash-service rails outside the reserved A-300 to A-1000 forklift entrance; retain low gravity drain supports and equipment legs',
    'A-400': 'Separate fixed VSEP front/rear header rails; preserve vendor flexible interfaces and lifting envelope',
    'A-500': 'Shared longitudinal rails for parallel sonication services',
    'A-600': 'Shared dryer service rails; retain access and thermal movement review',
    'A-700': 'Common thermal-area service rails and compact Ar-bank steel',
    'A-800': 'Common thermal-area service rails outside platform and cassette removal zones',
    'A-1000': 'Reserve the complete under-rack forklift aisle before placing shared collection and reagent-service rails. Keep columns, bases, brackets and braces outside the travel volume; preserve contained drains, suction bays and maintenance positions',
    'A-2000': 'Reserved transfer interfaces supported on common fixed steel; preserve the future RO footprint and access envelopes',
    'A-6000': 'Shared source/distribution spine and short local branches',
  },
  restrictions: [
    'No attachment to handrails, vessel shells, equipment nozzles or vibrating VSEP assemblies',
    'No pipe endpoint, suction profile, drain slope or vendor flexible connection is moved',
    'A new foundation requires a support duty that cannot be assigned to the available shared steel',
    'Frame counts and steel envelope volumes are layout metrics; strength, stability and foundation design remain unqualified',
  ],
};

// State-level adult Medicaid dental benefit tiers.
//
// Medicaid covers dental for children in all 50 states (EPSDT requirement),
// but adult dental benefits vary dramatically by state. This data is the
// difference between "Medicaid patients are profitable" and "Medicaid
// patients lose money" for a dental practice.
//
// Tier definitions follow the Center for Health Care Strategies (CHCS)
// "Medicaid Adult Dental Benefits Coverage Checker" categorization:
//   - extensive  : full coverage for preventive, restorative, and most procedures
//   - limited    : preventive cleanings + some restorative; capped annual benefit
//   - emergency  : extractions and emergency procedures only
//   - none       : no adult dental coverage
//
// State assignments are based on the most recent CHCS report (2023). State
// Medicaid policies change occasionally — review yearly. This is hardcoded
// rather than fetched because (a) there's no public API for it and
// (b) the data changes infrequently.
//
// Server-only — never imported by client components.

import 'server-only';

const TIER_LABELS = {
  extensive: 'Extensive',
  limited: 'Limited',
  emergency: 'Emergency Only',
  none: 'No Adult Coverage',
};

const TIER_DESCRIPTIONS = {
  extensive: 'Comprehensive Medicaid dental benefits for adults — preventive, restorative, and most major procedures are covered.',
  limited: 'Limited Medicaid dental benefits for adults — typically preventive cleanings and basic restorative work, often with annual benefit caps.',
  emergency: 'Emergency-only Medicaid dental benefits for adults — covers extractions and pain relief but not preventive or restorative care.',
  none: 'No Medicaid dental benefits for adults — Medicaid enrollees pay out of pocket or skip dental care entirely.',
};

// FIPS state code → tier
// Sources: CHCS Adult Dental Benefits Coverage tracker, 2023 data
const STATE_TIERS = {
  '01': 'none',         // Alabama
  '02': 'extensive',    // Alaska
  '04': 'extensive',    // Arizona
  '05': 'extensive',    // Arkansas
  '06': 'extensive',    // California
  '08': 'extensive',    // Colorado
  '09': 'extensive',    // Connecticut
  '10': 'none',         // Delaware
  '11': 'extensive',    // DC
  '12': 'limited',      // Florida
  '13': 'emergency',    // Georgia
  '15': 'emergency',    // Hawaii
  '16': 'limited',      // Idaho
  '17': 'extensive',    // Illinois
  '18': 'limited',      // Indiana
  '19': 'extensive',    // Iowa
  '20': 'limited',      // Kansas
  '21': 'limited',      // Kentucky
  '22': 'extensive',    // Louisiana
  '23': 'extensive',    // Maine
  '24': 'limited',      // Maryland
  '25': 'extensive',    // Massachusetts
  '26': 'extensive',    // Michigan
  '27': 'extensive',    // Minnesota
  '28': 'emergency',    // Mississippi
  '29': 'emergency',    // Missouri
  '30': 'extensive',    // Montana
  '31': 'extensive',    // Nebraska
  '32': 'extensive',    // Nevada
  '33': 'extensive',    // New Hampshire
  '34': 'extensive',    // New Jersey
  '35': 'extensive',    // New Mexico
  '36': 'extensive',    // New York
  '37': 'limited',      // North Carolina
  '38': 'extensive',    // North Dakota
  '39': 'extensive',    // Ohio
  '40': 'limited',      // Oklahoma
  '41': 'extensive',    // Oregon
  '42': 'limited',      // Pennsylvania
  '44': 'extensive',    // Rhode Island
  '45': 'emergency',    // South Carolina
  '46': 'extensive',    // South Dakota
  '47': 'none',         // Tennessee
  '48': 'limited',      // Texas
  '49': 'limited',      // Utah
  '50': 'extensive',    // Vermont
  '51': 'limited',      // Virginia
  '53': 'extensive',    // Washington
  '54': 'extensive',    // West Virginia
  '55': 'extensive',    // Wisconsin
  '56': 'extensive',    // Wyoming
};

/**
 * Get the Medicaid adult dental benefit tier for a state.
 *
 * @param {string} stateFips — 2-digit FIPS state code (e.g., '48' for Texas)
 * @returns {object | null} { tier, label, description } or null if unknown
 */
export function getStateMedicaidDental(stateFips) {
  if (!stateFips) return null;
  const tier = STATE_TIERS[stateFips];
  if (!tier) return null;
  return {
    tier,
    label: TIER_LABELS[tier],
    description: TIER_DESCRIPTIONS[tier],
  };
}

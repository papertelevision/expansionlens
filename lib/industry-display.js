// Client-safe industry display strings.
//
// This file is the ONLY industry-config that ships to the browser. It contains
// presentational strings (tooltips, labels, anchor icons, loading step text)
// — never scoring weights, threshold values, or decision logic.
//
// Tooltip text has been sanitized to remove specific numerical thresholds that
// would reveal the underlying scoring methodology (e.g. "$75K+", "above 90%",
// "5,000+ residents"). The full methodology remains in lib/industry-config.js
// which is marked server-only.

export const industryDisplay = {

  // ═══════════════════════════════════════════════════════════════════════════
  //  DENTAL
  // ═══════════════════════════════════════════════════════════════════════════
  dental: {
    slug: 'dental',
    label: 'Dental Practice',
    sublabel: 'Location Analyzer',
    pageTitle: 'Dental Practice Location Analyzer',
    pageSubtitle: 'Evaluate the potential of a location before opening a new dental practice',
    competitorLabel: 'Dental Practices',
    competitorLabelShort: 'Practices',

    anchorIcons: {
      'Hospitals & Clinics': '\u{1F3E5}',
      'Schools': '\u{1F3EB}',
      'Shopping': '\u{1F6D2}',
      'Pharmacies': '\u{1F48A}',
      'Transit Stops': '\u{1F68C}',
    },

    loadingSteps: [
      'Geocoding address...',
      'Scanning for nearby dental practices...',
      'Mapping competitor locations...',
      'Analyzing census tract demographics...',
      'Analyzing population density...',
      'Calculating median household income...',
      'Evaluating education and employment levels...',
      'Evaluating walkability and accessibility...',
      'Identifying nearby anchor locations...',
      'Retrieving competitor ratings and reviews...',
      'Assessing population growth trends...',
      'Evaluating market saturation...',
      'Modeling market demand vs competition...',
      'Identifying high-opportunity zones...',
      'Calculating expansion opportunity score (0–100)...',
      'Generating actionable location strategy...',
      'Finalizing your expansion insights...',
    ],

    breakdownTooltips: {
      'Population': 'Larger residential populations support a broader patient panel within a shorter marketing radius. Density alone is not enough — it pairs with income and competition to shape demand.',
      'Income': 'Higher household incomes correlate with dental insurance coverage and willingness to pay for elective procedures like whitening, implants, and orthodontics.',
      'Competition': 'Based on the dentist-to-resident ratio in the analysis area. Less competition means lower marketing spend and faster ramp-up to a full schedule.',
      'Comp. Quality': 'When nearby practices have lower Google ratings, patients are actively looking for a better experience. A quality gap is one of the strongest signals that a new patient-focused practice can capture share quickly.',
      'Walkability': 'Walkable areas generate natural foot traffic and visibility. For dental practices, higher walkability often means convenient access for patients and proximity to complementary businesses like pharmacies and retail.',
      'Education': 'College-educated populations are statistically more likely to prioritize preventive dental care, accept treatment plans, and maintain regular recall appointments — all of which improve patient lifetime value.',
      'Employment': 'Employed residents are more likely to carry employer-sponsored dental benefits and have predictable income for out-of-pocket procedures. Stronger employment supports steadier patient flow.',
      'Growth': 'Population growth means new residents who haven\'t yet established a dental home. Growing communities create a rising tide of demand — practices that open early in a growth cycle build loyalty before competitors arrive.',
    },

    demoTooltips: {
      'Median Age': 'The median age of residents influences what dental services are most in demand. Younger populations need orthodontics and family dentistry; older demographics drive demand for implants, crowns, and restorative work.',
      'College Educated': 'The percentage of adults with a bachelor\'s degree or higher. College-educated populations are more likely to prioritize preventive care, accept comprehensive treatment plans, and maintain regular recall appointments.',
      'Median Home Value': 'A proxy for neighborhood wealth and stability. Higher home values often correlate with longer patient tenure, willingness to invest in elective dental procedures, and preference for premium providers.',
      'Vacancy Rate': 'The percentage of unoccupied housing units. High vacancy rates can signal a declining neighborhood with lower foot traffic, while low vacancy indicates a stable, in-demand area with a reliable patient base.',
      'Drive to Work': 'The percentage of residents who commute by car. In car-dependent areas, practices need prominent road signage and convenient parking. Lower percentages may indicate urban walkability with more foot-traffic potential.',
      'Transit Score': 'Measures access to public transportation on a 0–100 scale. Higher scores mean patients can reach your practice without a car — important for elderly patients, families, and areas where parking is limited.',
    },

    metricTooltips: {
      competitors: 'The number of existing dental practices found within the analysis area. Fewer competitors means less market saturation and a greater opportunity to capture new patients. Consider both the count and their proximity — a cluster of practices on one side may leave the other side underserved.',
      population: 'The total number of residents living in the immediate area surrounding this address. A higher population means a larger potential patient base. Use this alongside competitor count to gauge whether the area is over- or under-served.',
      income: 'The midpoint household income in the area — half of households earn more, half earn less. Higher income areas tend to support more elective and cosmetic dental services, and patients are more likely to carry dental insurance.',
      walkScore: 'A measure of how walkable the area is, scored from 0 to 100. Higher walkability means more pedestrian foot traffic and natural visibility for a street-level practice. In car-dependent areas, roadside visibility and ample parking become critical.',
      employment: 'The percentage of working-age adults in the area who are currently employed. Stronger employment correlates with more residents who carry employer-sponsored dental insurance and disposable income for dental care.',
      growth: 'The annual population growth rate for the surrounding county. Positive growth means more potential patients are moving into the area, creating rising demand for dental services. Negative growth suggests a shrinking market.',
    },

    qualityTipTiers: {
      excellent: (rating) => ` Competitors are highly rated (${rating} avg). Competing on reviews alone will be difficult — differentiate through specialty services, extended hours, or modern technology that existing practices don't offer.`,
      good: (rating) => ` Competitors are well-reviewed (${rating} avg) but not exceptional. Investing in a standout patient experience — shorter wait times, follow-up care, and a modern office — can earn you the 5-star reputation that pulls patients away.`,
      average: (rating) => ` Most competitors have average ratings (${rating}), indicating an opportunity to outperform on patient experience and reviews. A consistent 4.8+ star presence will make you the obvious choice for new patients searching online.`,
      poor: (rating) => ` Competitors are poorly reviewed (${rating} avg) — patients in this area are likely settling for subpar care. A practice that prioritizes patient comfort, clear communication, and quality outcomes can rapidly capture market share.`,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  BARS
  // ═══════════════════════════════════════════════════════════════════════════
  bars: {
    slug: 'bars',
    label: 'Bar & Nightlife',
    sublabel: 'Location Analyzer',
    pageTitle: 'Bar & Nightlife Location Analyzer',
    pageSubtitle: 'Evaluate the potential of a location before opening a new bar or nightlife venue',
    competitorLabel: 'Bars & Nightlife Venues',
    competitorLabelShort: 'Venues',

    anchorIcons: {
      'Restaurants & Dining': '\u{1F37D}\uFE0F',
      'Hotels & Lodging': '\u{1F3E8}',
      'Entertainment': '\u{1F3AD}',
      'Parking': '\u{1F17F}\uFE0F',
      'Transit Stops': '\u{1F68C}',
    },

    loadingSteps: [
      'Geocoding address...',
      'Scanning for nearby bars & nightlife venues...',
      'Mapping competitor venues...',
      'Analyzing census tract demographics...',
      'Analyzing population density...',
      'Calculating median household income...',
      'Evaluating education and employment levels...',
      'Evaluating walkability and accessibility...',
      'Identifying nearby anchor locations...',
      'Retrieving competitor ratings and reviews...',
      'Assessing population growth trends...',
      'Evaluating market saturation...',
      'Modeling market demand vs competition...',
      'Identifying high-opportunity zones...',
      'Calculating expansion opportunity score (0–100)...',
      'Generating actionable location strategy...',
      'Finalizing your expansion insights...',
    ],

    breakdownTooltips: {
      'Population': 'More residents means a deeper well of potential customers for nightlife. Density provides the critical mass needed to fill a venue on weeknights, not just weekends.',
      'Income': 'Disposable income drives entertainment spending. Higher-income areas support craft cocktails, bottle service, and premium pricing.',
      'Competition': 'Based on the venue-to-resident ratio in the analysis area. Less competition means faster brand establishment and lower pressure to discount drinks.',
      'Comp. Quality': 'When nearby bars and venues have lower Google ratings, patrons are hungry for a better experience. A quality gap in atmosphere, service, or drink selection is your fastest lane to becoming the neighborhood go-to spot.',
      'Walkability': 'This is the single most important factor for bars. Walkable neighborhoods drive pub crawls, spontaneous drop-ins, and — critically — eliminate DUI risk for your customers.',
      'Education': 'College-educated and college-town demographics skew younger and are statistically more likely to frequent bars, attend events, and spend on nightlife. University proximity can be a powerful demand driver.',
      'Employment': 'Employed residents fuel the after-work happy hour crowd and have predictable disposable income for weekend outings. Stronger employment translates to more consistent mid-week revenue.',
      'Growth': 'Population growth means new residents actively seeking social scenes and neighborhood hangouts. People who just moved to an area are the most likely to try new venues — and to become loyal regulars if you open at the right time.',
    },

    demoTooltips: {
      'Median Age': 'The core nightlife demographic skews younger. Younger median ages signal a built-in customer base for bars and late-night venues. Older areas may favor wine bars or upscale lounges over high-energy nightlife.',
      'College Educated': 'College-educated populations and college towns are key drivers of nightlife demand. Higher education levels correlate with higher discretionary spending on entertainment.',
      'Median Home Value': 'A proxy for neighborhood wealth. Higher home values often correlate with stronger discretionary spending and willingness to pay premium prices for quality cocktails and atmosphere.',
      'Vacancy Rate': 'The percentage of unoccupied housing units. High vacancy can signal a declining area with weaker foot traffic, while low vacancy indicates a stable, in-demand neighborhood.',
      'Drive to Work': 'The percentage of residents who commute by car. For bars, walking and transit access are far more valuable than car dependency — DUI risk shapes customer behavior.',
      'Transit Score': 'Measures access to public transportation on a 0–100 scale. Higher transit scores expand your service area and reduce DUI risk for customers — critical for sustainable nightlife.',
    },

    metricTooltips: {
      competitors: 'The number of existing bars and nightlife venues found within the analysis area. Fewer competitors means less market saturation and a greater opportunity to become the neighborhood go-to spot.',
      population: 'The total number of residents living in the immediate area surrounding this address. A higher population means a larger potential customer base. Use this alongside competitor count to gauge whether the area is over- or under-served.',
      income: 'The midpoint household income in the area. Higher income areas support craft cocktails, bottle service, and premium pricing — the unit economics that make nightlife profitable.',
      walkScore: 'A measure of how walkable the area is, scored from 0 to 100. For bars, walkability is the single most important factor — walkable areas drive spontaneous drop-ins and eliminate DUI risk.',
      employment: 'The percentage of working-age adults in the area who are currently employed. Stronger employment fuels the after-work happy hour crowd and supports steady mid-week revenue.',
      growth: 'The annual population growth rate for the surrounding county. Positive growth means new residents actively seeking social scenes and neighborhood hangouts.',
    },

    qualityTipTiers: {
      excellent: (rating) => ` Competitors are highly rated (${rating} avg). You\'ll need a clear differentiator — concept, location, or programming — to win share from venues with strong reputations.`,
      good: (rating) => ` Competitors are well-reviewed (${rating} avg) but not exceptional. Investing in atmosphere, drink quality, and consistent service can earn you the 5-star reputation that turns first-timers into regulars.`,
      average: (rating) => ` Most competitors have average ratings (${rating}), indicating an opportunity to outperform on experience and reviews. A consistent 4.5+ star presence will make you the obvious choice in the neighborhood.`,
      poor: (rating) => ` Competitors are poorly reviewed (${rating} avg) — patrons in this area are settling. A bar that gets the basics right (clean space, good service, quality drinks) can rapidly capture market share.`,
    },
  },
};

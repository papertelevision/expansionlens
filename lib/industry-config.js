// ─── Industry Configuration ───────────────────────────────────────────────────
// Each industry exports a complete config object containing every string,
// threshold, and template needed to run an ExpansionLens analysis.
//
// SERVER-ONLY. The `import 'server-only'` line below tells Next.js to throw
// a build error if any client component tries to import this file. Anything
// the client legitimately needs (tooltips, labels, anchor icons) lives in
// lib/industry-display.js — keep methodology and thresholds here.
// ──────────────────────────────────────────────────────────────────────────────

import 'server-only';

export const industries = {

  // ═══════════════════════════════════════════════════════════════════════════
  //  DENTAL
  // ═══════════════════════════════════════════════════════════════════════════
  dental: {

    // ── 1. Basic info ──────────────────────────────────────────────────────
    slug: 'dental',
    label: 'Dental Practice',
    sublabel: 'Location Analyzer',
    pageTitle: 'Dental Practice Location Analyzer',
    pageSubtitle: 'Evaluate the potential of a location before opening a new dental practice',
    competitorLabel: 'Dental Practices',
    fallbackName: 'Unnamed Dental Practice',
    customerTerm: 'patients',
    businessTerm: 'practice',

    // ── 2. API config ──────────────────────────────────────────────────────
    overpassAmenities: ['dentist'],
    googlePlacesType: 'dentist',
    userAgent: 'ExpansionLens/0.1 (dental-location-analyzer)',

    // ── 3. POI categories ──────────────────────────────────────────────────
    poiCategories: {
      'Hospitals & Clinics': { tags: ['hospital', 'clinic'] },
      'Schools': { tags: ['school'] },
      'Shopping': { tags: ['mall', 'supermarket'] },
      'Pharmacies': { tags: ['pharmacy'] },
      'Transit Stops': { tags: ['bus_stop'] },
    },

    // ── 4. Anchor icons ────────────────────────────────────────────────────
    anchorIcons: {
      'Hospitals & Clinics': '\u{1F3E5}',
      'Schools': '\u{1F3EB}',
      'Shopping': '\u{1F6D2}',
      'Pharmacies': '\u{1F48A}',
      'Transit Stops': '\u{1F68C}',
    },

    // ── 5. Scoring config ──────────────────────────────────────────────────
    scoring: {
      population: { max: 25, divisor: 5000 },
      income: { max: 20, divisor: 75000 },
      competition: { max: 15 },
      compQuality: { max: 8 },
      walkability: { max: 10 },
      education: { max: 10, divisor: 50 },
      employment: { max: 7, divisor: 95 },
      growth: { max: 5, divisor: 3 },
      compRatioUnderserved: 2000,
      compRatioOversaturated: 500,
      areaMultiplier: 25 / 1.5,
    },

    // ── 6. Market capacity config ──────────────────────────────────────────
    marketCapacity: {
      utilizationBase: 0.65,
      revenuePerCustomer: {
        high: 800,
        medium: 680,
        low: 550,
        veryLow: 450,
      },
      incomeThresholds: { high: 75000, medium: 55000, low: 40000 },
      customerCap: { min: 500, max: 2500 },
    },

    // ── 7. Loading steps ───────────────────────────────────────────────────
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

    // ── 8. Breakdown tooltips ──────────────────────────────────────────────
    breakdownTooltips: {
      'Population': 'Larger populations mean more potential patients. Areas with 5,000+ residents in the immediate census tract score highest \u2014 that pool supports a full patient panel within a shorter marketing radius.',
      'Income': 'Higher household incomes correlate with dental insurance coverage and willingness to pay for elective procedures like whitening, implants, and orthodontics. Areas near $75K+ score highest.',
      'Competition': 'Based on the dentist-to-resident ratio in your search area. Fewer practices competing for the same patients means less marketing spend and faster ramp-up to a full schedule.',
      'Comp. Quality': 'When nearby practices have lower Google ratings, patients are actively looking for a better experience. A quality gap is one of the strongest signals that a new, patient-focused practice can capture share quickly.',
      'Walkability': 'Walkable areas generate natural foot traffic and visibility. For dental practices, higher walkability often means convenient access for patients and proximity to complementary businesses like pharmacies and retail.',
      'Education': 'College-educated populations are statistically more likely to prioritize preventive dental care, accept treatment plans, and maintain regular recall appointments \u2014 all of which improve patient lifetime value.',
      'Employment': 'Employed residents are more likely to carry employer-sponsored dental benefits and have predictable income for out-of-pocket procedures. Higher employment rates support steadier patient flow.',
      'Growth': 'Population growth means new residents who haven\'t yet established a dental home. Growing communities create a rising tide of demand \u2014 practices that open early in a growth cycle build loyalty before competitors arrive.',
    },

    // ── 9. Demographic tooltips ────────────────────────────────────────────
    demoTooltips: {
      'Median Age': 'The median age of residents influences what dental services are most in demand. Younger populations need orthodontics and family dentistry; older demographics drive demand for implants, crowns, and restorative work.',
      'College Educated': 'The percentage of adults with a bachelor\'s degree or higher. College-educated populations are more likely to prioritize preventive care, accept comprehensive treatment plans, and maintain regular recall appointments.',
      'Median Home Value': 'A proxy for neighborhood wealth and stability. Higher home values often correlate with longer patient tenure, willingness to invest in elective dental procedures, and preference for premium providers.',
      'Vacancy Rate': 'The percentage of unoccupied housing units. High vacancy rates can signal a declining neighborhood with lower foot traffic, while low vacancy indicates a stable, in-demand area with a reliable patient base.',
      'Drive to Work': 'The percentage of residents who commute by car. In car-dependent areas, practices need prominent road signage and convenient parking. Lower percentages may indicate urban walkability with more foot-traffic potential.',
      'Transit Score': 'Measures access to public transportation on a 0\u2013100 scale. Higher scores mean patients can reach your practice without a car \u2014 important for elderly patients, families, and areas where parking is limited.',
    },

    // ── 10. Metric card tooltips ───────────────────────────────────────────
    metricTooltips: {
      competitors: 'The number of existing dental practices found within the analysis area. Fewer competitors means less market saturation and a greater opportunity to capture new patients. Consider both the count and their proximity \u2014 a cluster of practices on one side may leave the other side underserved.',
      population: 'The total number of residents living in the immediate area surrounding this address. A higher population means a larger potential patient base. The American Dental Association recommends roughly one dentist per 2,000 residents \u2014 use this alongside competitor count to gauge if the area is over- or under-served.',
      income: 'The midpoint household income in the area \u2014 half of households earn more, half earn less. Higher income areas tend to support more elective and cosmetic dental services, and patients are more likely to carry dental insurance. Areas above $65,000 are generally considered favorable for full-service dental practices.',
      walkScore: 'A measure of how walkable the area is, scored from 0 to 100. Higher walkability means more pedestrian foot traffic and natural visibility for a street-level practice. In car-dependent areas (below 30), roadside visibility and ample parking become critical. Scores above 70 indicate strong walk-in potential.',
      employment: 'The percentage of working-age adults in the area who are currently employed. Higher employment rates correlate with more residents who have employer-sponsored dental insurance and disposable income for dental care. Rates above 90% are considered strong; below 85% may indicate a market where patients are more price-sensitive.',
      growth: 'The annual population growth rate for the surrounding county. Positive growth means more potential patients are moving into the area, creating rising demand for dental services. Growing communities (above +1%) often signal new housing developments and families \u2014 ideal for a new practice. Negative growth suggests a shrinking market.',
    },

    // ── 11. Quality tip tiers ──────────────────────────────────────────────
    qualityTipTiers: {
      excellent: (rating) => ` Competitors are highly rated (${rating} avg). Competing on reviews alone will be difficult \u2014 differentiate through specialty services, extended hours, or modern technology that existing practices don't offer.`,
      good: (rating) => ` Competitors are well-reviewed (${rating} avg) but not exceptional. Investing in a standout patient experience \u2014 shorter wait times, follow-up care, and a modern office \u2014 can earn you the 5-star reputation that pulls patients away.`,
      average: (rating) => ` Most competitors have average ratings (${rating}), indicating an opportunity to outperform on patient experience and reviews. A consistent 4.8+ star presence will make you the obvious choice for new patients searching online.`,
      poor: (rating) => ` Competitors are poorly reviewed (${rating} avg) \u2014 patients in this area are likely settling for subpar care. A practice that prioritizes patient comfort, clear communication, and quality outcomes can rapidly capture market share.`,
    },

    // ── 12. Score labels ───────────────────────────────────────────────────
    scoreLabels: {
      excellent: 'Strong Expansion Target',
      moderate: 'Conditional Opportunity',
      challenging: 'High Risk Location',
      poor: 'High Risk Location',
    },

    // ── 13. Summary templates ──────────────────────────────────────────────
    summary: {
      openers: {
        excellent: 'This location shows strong potential for a new dental practice.',
        moderate: 'This area presents a reasonable opportunity for a new dental practice, though some factors warrant consideration.',
        challenging: 'This location faces some headwinds that could make establishing a new dental practice difficult.',
        poor: 'This area may not be well-suited for a new dental practice based on current market conditions.',
      },
      compSentences: {
        minimal: (competitorCount) => `With only ${competitorCount} existing dental practice${competitorCount === 1 ? '' : 's'} within the analysis area, competition is minimal, leaving room for a new entrant to capture market share.`,
        moderate: (competitorCount) => `There are ${competitorCount} dental practices within the analysis area, representing moderate competition that a well-positioned practice could navigate.`,
        significant: (competitorCount) => `The area has ${competitorCount} existing dental practices within the analysis area, indicating a highly competitive market where differentiation will be critical.`,
      },
      demoTemplates: {
        favorableBoth: (popLevel, incomeLevel, medianIncome) => `The demographic profile is favorable, with ${popLevel} population density and ${incomeLevel} household income ($${medianIncome.toLocaleString()}), suggesting a patient base with both volume and purchasing power.`,
        favorableIncome: (incomeLevel, medianIncome, popLevel) => `Household income in the area is ${incomeLevel} at $${medianIncome.toLocaleString()}, which bodes well for elective and cosmetic dental services, though population density is ${popLevel}.`,
        favorablePop: (popLevel, population, incomeLevel, medianIncome) => `Population density is ${popLevel} (${population.toLocaleString()} residents), providing a solid potential patient base, though household income is ${incomeLevel} at $${medianIncome.toLocaleString()}.`,
        unfavorable: (popLevel, population, incomeLevel, medianIncome) => `The area has ${popLevel} population density (${population.toLocaleString()} residents) with ${incomeLevel} household income ($${medianIncome.toLocaleString()}), which may limit the addressable market.`,
        educatedEmployed: (collegePercent, employmentRate) => `The area's educated (${collegePercent}% college-educated) and employed (${employmentRate}% employment rate) population is favorable for a practice offering comprehensive dental services.`,
        lowEducation: (collegePercent) => `Education levels are relatively low (${collegePercent}% college-educated), which may influence demand for elective dental procedures.`,
        growthPositive: (popGrowth) => `Notably, the county is experiencing ${popGrowth}% year-over-year population growth, a positive signal for long-term demand.`,
        growthNegative: (popGrowth) => `The county is experiencing population decline (${popGrowth}% YoY), which could limit future growth prospects.`,
        compHighRating: (avgCompetitorRating, totalCompetitorReviews) => `Existing competitors are well-regarded, averaging ${avgCompetitorRating} stars across ${totalCompetitorReviews.toLocaleString()} reviews \u2014 entering this market will require a strong value proposition and exceptional patient experience.`,
        compLowRating: (avgCompetitorRating, totalCompetitorReviews) => `Competitors in the area average just ${avgCompetitorRating} stars (${totalCompetitorReviews.toLocaleString()} reviews), suggesting a clear opportunity to differentiate through quality of care and patient satisfaction.`,
        walkHigh: (walkScore) => `High walkability (Walk Score: ${walkScore}) means strong foot traffic and visibility for a street-level practice.`,
        walkLow: (walkScore) => `Low walkability (Walk Score: ${walkScore}) suggests a car-dependent area \u2014 ample parking and visibility from main roads will be important.`,
      },
      closers: {
        excellent: (score) => `Overall, this location scores ${score}/100, indicating an excellent opportunity worth serious consideration.`,
        moderate: (score) => `With a score of ${score}/100, this location merits further investigation and a detailed business plan.`,
        challenging: (score) => `The opportunity score of ${score}/100 suggests proceeding with caution and thorough market research.`,
        poor: (score) => `At ${score}/100, we recommend exploring alternative locations with stronger fundamentals.`,
      },
      businessType: 'dental practice',
      serviceTerms: {
        elective: 'elective and cosmetic dental services',
        comprehensive: 'comprehensive dental services',
      },
    },

    // ── 14. Recommendation templates ───────────────────────────────────────
    recommendation: {
      excellent: {
        opener: (score) => `This area warrants serious exploration for a new dental practice. With a score of ${score}/100, the fundamentals \u2014 patient demand, income levels, and competitive landscape \u2014 align well.`,
        compMinimal: (competitorCount) => `The low number of existing practices (${competitorCount}) suggests an underserved market. Consider a general or family dentistry model to capture broad demand before competitors enter.`,
        compModerate: (competitorCount) => `With ${competitorCount} existing practices, there is room for a new entrant, but consider differentiating through specialty services (cosmetic, orthodontic, or pediatric dentistry) to stand out.`,
        incomeAboveAvg: (medianIncome) => `Above-average household income ($${medianIncome.toLocaleString()}) supports a practice model that includes elective and cosmetic procedures \u2014 these higher-margin services could accelerate profitability.`,
        closer: 'Suggested next steps: conduct a site visit to evaluate street-level visibility and foot traffic, research commercial lease availability and rates in the area, and consult with a dental practice broker or consultant to validate patient volume projections.',
      },
      moderate: {
        opener: (score) => `This location shows promise but requires careful planning. At ${score}/100, certain factors work in your favor while others need mitigation.`,
        compSignificant: (competitorCount) => `The competitive density (${competitorCount} practices) is the primary concern. If you proceed, a clear differentiator will be essential \u2014 consider underserved specialties like pediatric dentistry, orthodontics, or sedation dentistry that existing practices may not emphasize.`,
        popLow: 'Population density is a limiting factor. Consider whether the area has daytime traffic (offices, retail, commuters) that could supplement the residential patient base, as this wouldn\'t be captured in residential population figures alone.',
        growthPositive: (popGrowth) => `The positive population growth trend (+${popGrowth}% YoY) is encouraging \u2014 new residents will need to establish dental care relationships, giving a new practice a natural acquisition advantage.`,
        closer: 'Suggested next steps: visit the area during business hours to assess real foot traffic, analyze the specific services offered by nearby competitors for gaps you could fill, and develop a conservative financial model before committing to a lease.',
      },
      challenging: {
        opener: (score) => `This area presents meaningful challenges for a new dental practice. At ${score}/100, we recommend exploring whether specific micro-conditions could improve the outlook before investing further.`,
        compHighLowIncome: 'High competition combined with moderate-to-low income levels creates pressure on both patient acquisition and pricing. A discount or membership-based dental model (dental savings plans) may be more viable than a traditional fee-for-service approach in this market.',
        lowWalkability: 'The car-dependent nature of this area means location selection is especially critical \u2014 prioritize high-visibility spots near major intersections or anchored retail centers where patients are already driving.',
        closer: 'Suggested next steps: before committing, evaluate 2\u20133 alternative locations within a 10\u201315 mile radius for comparison, speak with local dental suppliers or labs about practice density in the region, and consider a part-time or shared-space model to test the market before a full buildout.',
      },
      poor: {
        opener: (compLevel, popLevel, incomeLevel) => `Based on current market conditions, this area is not recommended for a new dental practice. The combination of factors \u2014 ${compLevel} competition, ${popLevel} population density, and ${incomeLevel} income \u2014 creates a difficult environment for a sustainable practice.`,
        alternative: 'If you\'re committed to this general region, we recommend running analyses on adjacent areas that may have stronger fundamentals. Look for nearby communities with growing populations, fewer existing dental practices, or higher household income.',
        creative: 'Alternative consideration: if this location has personal or strategic significance, a mobile dental practice or tele-dentistry model could allow you to serve the area with lower overhead and less risk than a traditional brick-and-mortar buildout.',
      },
    },

    // ── 15. Upside & Risks ─────────────────────────────────────────────────
    upsideRisks: {
      competition: {
        upside: {
          none: { text: 'No direct competition within the analysis area', detailFn: () => '0 practices found' },
          underserved: { text: 'Underserved market \u2014 fewer dentists per resident than average', detailFn: (ratio) => `1 : ${ratio.toLocaleString()} ratio (ADA benchmark: 1 : 2,000)` },
        },
        risk: {
          oversaturated: { text: 'Highly competitive market \u2014 oversaturated with dental practices', detailFn: (ratio) => `1 : ${ratio.toLocaleString()} ratio (ADA benchmark: 1 : 2,000)` },
          tight: { text: 'Competitive market \u2014 dentist-to-resident ratio is tight', detailFn: (ratio) => `1 : ${ratio.toLocaleString()} ratio (ADA benchmark: 1 : 2,000)` },
        },
        thresholds: { noComp: 0, underservedRatio: 2000, oversaturatedRatio: 1000 },
      },
      income: {
        upside: {
          high: { text: 'High household income supports elective and cosmetic services', detailFn: (income) => `$${income.toLocaleString()} median` },
          aboveAvg: { text: 'Above-average household income', detailFn: (income) => `$${income.toLocaleString()} median` },
        },
        risk: {
          low: { text: 'Low household income may limit elective procedure demand', detailFn: (income) => `$${income.toLocaleString()} median` },
        },
        thresholds: { high: 75000, aboveAvg: 55000, low: 40000 },
      },
      population: {
        upside: {
          strong: { text: 'Strong population density \u2014 large potential patient base', detailFn: (pop) => `${pop.toLocaleString()} residents` },
        },
        risk: {
          low: { text: 'Low population density limits the addressable patient pool', detailFn: (pop) => `${pop.toLocaleString()} residents` },
        },
        thresholds: { strong: 4000, low: 2000 },
      },
      employment: {
        upside: {
          high: { text: 'High employment rate \u2014 more employer-sponsored dental benefits', detailFn: (rate) => `${rate}% employed` },
        },
        risk: {
          low: { text: 'Below-average employment may mean fewer insured patients', detailFn: (rate) => `${rate}% employed` },
        },
        thresholds: { high: 92, low: 85 },
      },
      walkability: {
        upside: {
          high: { text: 'Highly walkable \u2014 strong foot traffic and natural visibility', detailFn: (ws) => `Walk Score: ${ws}` },
        },
        risk: {
          low: { text: 'Extremely low walkability \u2014 car-dependent with limited foot traffic', detailFn: (ws) => `Walk Score: ${ws}` },
        },
        thresholds: { high: 70, low: 25 },
      },
      growth: {
        upside: {
          growing: { text: 'Growing population \u2014 rising demand for dental services', detailFn: (g) => `+${g}% year-over-year` },
        },
        risk: {
          declining: { text: 'Declining population \u2014 shrinking patient base over time', detailFn: (g) => `${g}% year-over-year` },
        },
        thresholds: { growing: 1, declining: -0.5 },
      },
      compQuality: {
        upside: {
          poor: { text: 'Competitors are poorly reviewed \u2014 clear quality gap opportunity', detailFn: (rating) => `${rating} avg stars` },
        },
        risk: {
          excellent: { text: 'Competitors are highly rated \u2014 differentiation will be difficult', detailFn: (rating) => `${rating} avg stars` },
        },
        thresholds: { poor: 3.5, excellent: 4.5 },
      },
      education: {
        upside: {
          high: { text: 'Highly educated population \u2014 more likely to prioritize dental care', detailFn: (pct) => `${pct}% college-educated` },
        },
        risk: {
          low: { text: 'Low education levels may reduce demand for preventive care', detailFn: (pct) => `${pct}% college-educated` },
        },
        thresholds: { high: 40, low: 15 },
      },
      anchors: {
        upside: {
          strong: { text: 'Strong nearby amenities drive consistent area traffic', detailFn: (count) => `${count} points of interest` },
        },
        risk: {
          limited: { text: 'Limited nearby amenities \u2014 less natural draw to the area', detailFn: (count) => `${count} points of interest` },
        },
        thresholds: { strong: 15, limited: 3 },
      },
    },

    // ── 16. Win strategy rules ─────────────────────────────────────────────
    winStrategy: [
      { condition: (r) => r.competitorCount === 0, text: 'No existing dental practices nearby \u2014 be the first mover and establish brand recognition before competitors arrive' },
      { condition: (r) => r.competitorCount > 0 && r.competitorCount <= 3, text: 'Low competition gives you room to build a broad general practice, but invest in visibility early to become the area\'s go-to provider' },
      { condition: (r) => r.competitorCount > 15, text: (r) => `With ${r.competitorCount} practices in the area, you must carve a clear niche \u2014 generalist practices will struggle to stand out in this density` },
      { condition: (r) => r.competitorCount > 8 && r.competitorCount <= 15, text: 'Moderate-to-high competition means differentiation is essential \u2014 find the service gap that existing practices aren\'t filling' },
      { condition: (r) => r.avgCompetitorRating != null && r.competitorCount > 0 && r.avgCompetitorRating < 3.5, text: (r) => `Competitors average just ${r.avgCompetitorRating} stars \u2014 patient experience is your fastest path to capturing market share from dissatisfied patients` },
      { condition: (r) => r.avgCompetitorRating != null && r.competitorCount > 0 && r.avgCompetitorRating >= 3.5 && r.avgCompetitorRating < 4.2, text: (r) => `Competitor ratings are moderate (${r.avgCompetitorRating} stars) \u2014 a strong focus on patient experience, modern technology, and online reputation can set you apart` },
      { condition: (r) => r.avgCompetitorRating != null && r.competitorCount > 0 && r.avgCompetitorRating >= 4.5, text: (r) => `Competitors are well-reviewed (${r.avgCompetitorRating} stars) \u2014 competing on quality alone won't be enough; differentiate through specialty services, convenience, or pricing` },
      { condition: (r) => r.medianIncome >= 85000, text: 'High-income area supports premium services \u2014 invest in cosmetic dentistry, veneers, implants, and Invisalign to maximize revenue per patient' },
      { condition: (r) => r.medianIncome >= 65000 && r.medianIncome < 85000, text: 'Above-average income supports a full-service model \u2014 include elective procedures alongside preventive care to build higher-margin revenue' },
      { condition: (r) => r.medianIncome < 40000, text: 'Lower income area requires a value-focused model \u2014 consider dental membership plans, sliding-scale fees, and Medicaid acceptance to build volume' },
      { condition: (r) => r.medianIncome >= 40000 && r.medianIncome < 55000, text: 'Moderate income means price sensitivity \u2014 transparent pricing, payment plans, and insurance-friendly scheduling will drive patient loyalty' },
      { condition: (r) => { const ws = r.walkScore?.walkScore ?? null; return ws != null && ws >= 70; }, text: 'High walkability means strong foot traffic \u2014 invest in street-level signage, window visibility, and an inviting storefront to capture walk-in patients' },
      { condition: (r) => { const ws = r.walkScore?.walkScore ?? null; return ws != null && ws < 25; }, text: 'Car-dependent area requires roadside visibility \u2014 prioritize locations near major intersections with prominent signage and easy parking access' },
      { condition: (r) => r.popGrowth != null && r.popGrowth > 2, text: (r) => `Rapid population growth (${r.popGrowth}% YoY) creates a window \u2014 new residents choose providers quickly, so launch with strong digital marketing and local SEO from day one` },
      { condition: (r) => r.popGrowth != null && r.popGrowth > 1 && r.popGrowth <= 2, text: 'Steady population growth means rising demand \u2014 target new residents with welcome mailers, community events, and new-patient promotions' },
      { condition: (r) => r.popGrowth != null && r.popGrowth < -0.5, text: 'Declining population means a shrinking patient base \u2014 focus on retention, comprehensive care plans, and maximizing revenue per patient over volume' },
      { condition: (r) => r.collegePercent != null && r.collegePercent >= 40, text: 'Highly educated population responds well to treatment plan education \u2014 invest in case presentation technology and thorough consultations to increase acceptance rates' },
      { condition: (r) => r.employmentRate != null && r.employmentRate >= 92, text: 'High employment rate means most patients will have dental benefits \u2014 ensure your practice is in-network with major PPO plans to capture insured demand' },
      { condition: (r) => r.employmentRate != null && r.employmentRate < 85, text: 'Below-average employment means fewer insured patients \u2014 an in-house membership plan and flexible financing will be critical to patient acquisition' },
      { condition: (r) => r.competitorCount > 5 && r.medianIncome >= 55000, text: 'Consider a specialty focus (cosmetic, pediatric, or orthodontic) \u2014 in competitive markets with purchasing power, specialists command higher fees and clearer positioning' },
      { condition: (r) => { const total = r.anchors ? Object.values(r.anchors).reduce((sum, d) => sum + d.count, 0) : 0; return total >= 15; }, text: 'Strong nearby amenities create natural patient flow \u2014 partner with neighboring businesses for cross-referrals and position your practice as part of a convenient one-stop visit' },
      { condition: (r) => r.competitorCount > 0 && r.competitorCount <= 8 && r.avgCompetitorRating != null && r.avgCompetitorRating >= 4.0, text: 'Well-rated competitors set a high bar \u2014 match their quality while offering something they don\'t, such as extended hours, same-day appointments, or sedation dentistry' },
    ],

    // ── 17. Next steps ─────────────────────────────────────────────────────
    nextSteps: {
      excellent: {
        immediate: (r) => {
          const items = [
            'Visit the location during peak hours to evaluate foot traffic, visibility, and parking access',
            'Photograph the site and surrounding signage opportunities from the street',
            'Walk the area to identify available retail or medical office space for lease',
          ];
          if (r.competitorCount > 0) {
            items.push(`Visit ${r.competitorCount <= 3 ? 'each' : '2\u20133'} nearby competitor${r.competitorCount === 1 ? '' : 's'} as a prospective patient to assess their operations firsthand`);
          }
          return items;
        },
        shortTerm: (r) => {
          const items = [
            'Research commercial lease availability and compare rental rates for the area',
            'Consult with a dental practice broker to validate patient volume projections',
            'Contact dental equipment suppliers for buildout estimates and financing options',
          ];
          if (r.popGrowth != null && r.popGrowth > 1) {
            items.push(`Research planned residential developments \u2014 ${r.popGrowth}% population growth may signal additional demand ahead`);
          } else {
            items.push('Request demographic reports from a commercial real estate broker to verify census data');
          }
          return items;
        },
        strategic: (r) => {
          const items = [];
          if (r.competitorCount <= 3) {
            items.push('Plan a general/family dentistry model to capture broad demand in this underserved market');
          } else {
            items.push('Identify specialty gaps (cosmetic, ortho, pediatric) among existing practices to differentiate');
          }
          if (r.medianIncome >= 65000) {
            items.push('Design a service menu that includes elective and cosmetic procedures \u2014 this income level supports higher-margin services');
          } else {
            items.push('Develop a competitive pricing strategy that balances affordability with profitability for this market');
          }
          items.push('Draft a first-year business plan with patient acquisition targets and a marketing launch strategy');
          items.push('Identify referral partnership opportunities with nearby general physicians, pediatricians, and orthodontists');
          return items;
        },
      },
      moderate: {
        immediate: (r) => {
          const items = [
            'Visit the area during peak business hours to assess real foot traffic and patient accessibility',
            'Evaluate street-level visibility and signage placement opportunities at candidate sites',
          ];
          if (r.competitorCount === 0) {
            items.push('Scout for available retail or medical office space \u2014 determine whether you\'d lease or need a ground-up buildout');
          } else {
            items.push('Visit 2\u20133 nearby competitors as a prospective patient to assess wait times, service quality, and experience');
          }
          items.push('Check parking availability and ease of access \u2014 these are critical patient conversion factors');
          return items;
        },
        shortTerm: (r) => {
          const items = [
            'Run ExpansionLens analyses on 2\u20133 nearby locations to compare opportunities before committing',
            'Analyze commercial lease availability and negotiate flexible terms (shorter initial term, renewal options)',
            'Develop a conservative financial model with break-even analysis for this location',
          ];
          if (r.competitorCount > 0 && r.avgCompetitorRating != null && r.avgCompetitorRating < 4.0) {
            items.push(`Research competitor reviews in detail \u2014 their ${r.avgCompetitorRating}-star average suggests patients are looking for a better experience`);
          } else {
            items.push('Speak with local dental suppliers about market conditions and practice density in the region');
          }
          return items;
        },
        strategic: (r) => {
          const items = [];
          if (r.competitorCount > 8) {
            items.push('Target underserved specialties like sedation dentistry, pediatric care, or orthodontics that existing practices may not emphasize');
          } else if (r.competitorCount > 0) {
            items.push('Analyze the specific services offered by nearby competitors and build your practice around gaps they don\'t cover');
          } else {
            items.push('Plan a broad-service general dentistry model to establish the first dental presence in this area');
          }
          items.push('Build a differentiation strategy focused on patient experience, technology, and convenience');
          items.push('Create a patient acquisition plan that leverages local partnerships, community events, and digital marketing');
          if (r.popGrowth != null && r.popGrowth > 1) {
            items.push(`Factor ${r.popGrowth}% population growth into your long-term projections \u2014 position for rising demand`);
          } else {
            items.push('Develop a dental membership or savings plan to attract uninsured patients and build recurring revenue');
          }
          return items;
        },
      },
      challenging: {
        immediate: (r) => {
          const items = [
            'Drive the area to assess real conditions \u2014 check for vacant storefronts, construction, and overall neighborhood trajectory',
          ];
          if (r.competitorCount > 0) {
            items.push('Visit nearby competitors as a prospective patient to gauge whether any are underperforming or may close');
          } else {
            items.push('Scout for available commercial space and assess whether the area can support a dental office');
          }
          items.push('Talk to nearby business owners about foot traffic patterns and the local customer base');
          items.push('Note the condition and occupancy of surrounding commercial properties as a market health indicator');
          return items;
        },
        shortTerm: (r) => {
          const items = [
            'Run ExpansionLens analyses on 2\u20133 alternative locations within a 10\u201315 mile radius for comparison',
            'Speak with local dental suppliers or labs about practice density and saturation in the region',
            'Consult with a dental CPA about the financial viability of this market before committing capital',
          ];
          if (r.competitorCount > 0) {
            items.push('Research whether any nearby competitors are retiring or selling \u2014 an acquisition may be less risky than starting fresh');
          } else {
            items.push('Investigate whether the area qualifies for Health Professional Shortage Area (HPSA) designations or loan repayment programs');
          }
          return items;
        },
        strategic: (r) => {
          const ws = r.walkScore?.walkScore ?? null;
          const items = [];
          if (ws != null && ws < 30) {
            items.push('If proceeding, prioritize high-visibility locations near major intersections or anchored retail centers');
          } else {
            items.push('Consider a shared-space or part-time model to test patient demand before a full buildout');
          }
          if (r.competitorCount > 8 && r.medianIncome < 65000) {
            items.push('Evaluate a membership-based dental savings plan \u2014 high competition with moderate income favors value positioning');
          } else {
            items.push('Develop a lean startup model with minimal overhead to reduce risk during the initial ramp-up period');
          }
          items.push('Explore community outreach and employer partnership programs to build a patient base in a tighter market');
          items.push('Plan a phased buildout \u2014 start with core services and expand offerings only after validating patient demand');
          return items;
        },
      },
      poor: {
        immediate: () => [
          'Explore adjacent zip codes and neighborhoods \u2014 run ExpansionLens on 3\u20134 alternative locations',
          'Drive the broader region to identify areas with visible growth, new construction, or underserved pockets',
          'Check whether this area qualifies as a dental Health Professional Shortage Area (HPSA)',
          'Talk to local residents or business owners to understand why dental services may be lacking',
        ],
        shortTerm: () => [
          'Consult with a dental practice consultant before investing further in this specific market',
          'Research mobile dental practice or tele-dentistry models that could serve the area with lower overhead',
          'Investigate community health center partnerships that could provide a referral base and shared infrastructure',
          'Analyze whether nearby communities within 10\u201315 miles have stronger fundamentals for a primary location',
        ],
        strategic: () => [
          'Consider a mobile or satellite model \u2014 serve this area part-time from a stronger primary location',
          'If this location has personal significance, explore grant programs or NHSC loan repayment for underserved areas',
          'Research employer-sponsored dental programs at nearby businesses to create a guaranteed patient pipeline',
          'Evaluate a low-overhead, high-efficiency practice model focused on preventive care and basic services',
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  BARS & NIGHTLIFE
  // ═══════════════════════════════════════════════════════════════════════════
  bars: {

    // ── 1. Basic info ──────────────────────────────────────────────────────
    slug: 'bars',
    label: 'Bar & Nightlife',
    sublabel: 'Location Analyzer',
    pageTitle: 'Bar & Nightlife Location Analyzer',
    pageSubtitle: 'Evaluate the potential of a location before opening a new bar or nightlife venue',
    competitorLabel: 'Bars & Nightlife Venues',
    fallbackName: 'Unnamed Bar',
    customerTerm: 'customers',
    businessTerm: 'venue',

    // ── 2. API config ──────────────────────────────────────────────────────
    overpassAmenities: ['bar', 'pub', 'nightclub', 'biergarten'],
    googlePlacesType: 'bar',
    userAgent: 'ExpansionLens/0.1 (nightlife-location-analyzer)',

    // ── 3. POI categories ──────────────────────────────────────────────────
    poiCategories: {
      'Restaurants & Dining': { tags: ['restaurant', 'fast_food'] },
      'Hotels & Lodging': { tags: ['hotel'] },
      'Entertainment': { tags: ['theatre', 'cinema'] },
      'Parking': { tags: ['parking'] },
      'Transit Stops': { tags: ['bus_stop'] },
    },

    // ── 4. Anchor icons ────────────────────────────────────────────────────
    anchorIcons: {
      'Restaurants & Dining': '\u{1F37D}\uFE0F',
      'Hotels & Lodging': '\u{1F3E8}',
      'Entertainment': '\u{1F3AD}',
      'Parking': '\u{1F17F}\uFE0F',
      'Transit Stops': '\u{1F68C}',
    },

    // ── 5. Scoring config ──────────────────────────────────────────────────
    scoring: {
      population: { max: 20, divisor: 5000 },
      income: { max: 15, divisor: 60000 },
      competition: { max: 15 },
      compQuality: { max: 10 },
      walkability: { max: 20 },
      education: { max: 5, divisor: 50 },
      employment: { max: 7, divisor: 95 },
      growth: { max: 8, divisor: 3 },
      compRatioUnderserved: 800,
      compRatioOversaturated: 150,
      areaMultiplier: 25 / 1.5,
    },

    // ── 6. Market capacity config ──────────────────────────────────────────
    marketCapacity: {
      utilizationBase: 0.40,
      revenuePerCustomer: {
        high: 2400,
        medium: 1800,
        low: 1200,
        veryLow: 800,
      },
      incomeThresholds: { high: 65000, medium: 45000, low: 30000 },
      customerCap: { min: 300, max: 3000 },
    },

    // ── 7. Loading steps ───────────────────────────────────────────────────
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

    // ── 8. Breakdown tooltips ──────────────────────────────────────────────
    breakdownTooltips: {
      'Population': 'More residents means a deeper well of potential customers for nightlife. Areas with 5,000+ people in the census tract provide the critical mass needed to fill a venue on weeknights \u2014 not just weekends.',
      'Income': 'Disposable income drives entertainment spending. Higher-income areas support craft cocktails, bottle service, and premium pricing. Areas near $60K+ median household income score highest for nightlife concepts.',
      'Competition': 'Based on the venue-to-resident ratio in your search area. Fewer bars competing for the same nightlife crowd means faster brand establishment and less pressure to discount drinks.',
      'Comp. Quality': 'When nearby bars and venues have lower Google ratings, patrons are hungry for a better experience. A quality gap in atmosphere, service, or drink selection is your fastest lane to becoming the neighborhood go-to spot.',
      'Walkability': 'This is the single most important factor for bars. Walkable neighborhoods drive pub crawls, spontaneous drop-ins, and \u2014 critically \u2014 eliminate DUI risk for your customers. High walkability is the lifeblood of a thriving nightlife scene.',
      'Education': 'College-educated and college-town demographics skew younger and are statistically more likely to frequent bars, attend events, and spend on nightlife. University proximity can be a powerful demand driver.',
      'Employment': 'Employed residents fuel the after-work happy hour crowd and have predictable disposable income for weekend outings. Higher employment rates translate to more consistent mid-week revenue.',
      'Growth': 'Population growth means new residents actively seeking social scenes and neighborhood hangouts. People who just moved to an area are the most likely to try new venues \u2014 and to become loyal regulars if you open at the right time.',
    },

    // ── 9. Demographic tooltips ────────────────────────────────────────────
    demoTooltips: {
      'Median Age': 'The core nightlife demographic is 21\u201335. Younger median ages signal a built-in customer base for bars and late-night venues. Areas with a median age above 45 may favor wine bars or upscale lounges over high-energy nightlife.',
      'College Educated': 'The percentage of adults with a bachelor\'s degree or higher. College-educated populations tend to be younger, more socially active, and more willing to spend on craft beverages, themed events, and premium nightlife experiences.',
      'Median Home Value': 'A proxy for neighborhood affluence and the kind of venue it can support. High home values signal demand for upscale cocktail bars and wine lounges; moderate values may favor sports bars, dive bars, or high-volume concepts.',
      'Vacancy Rate': 'The percentage of unoccupied housing units. High vacancy rates signal a declining neighborhood with fewer potential customers on the streets at night. Low vacancy means a dense, active population \u2014 exactly what nightlife needs.',
      'Drive to Work': 'The percentage of residents who commute by car. For bars, lower drive-to-work percentages are actually better \u2014 they indicate a walkable, transit-friendly area where customers can get home safely without driving, reducing DUI liability concerns.',
      'Transit Score': 'Measures access to public transportation on a 0\u2013100 scale. For bars, a high transit score is critical \u2014 it means customers can get home safely at 1 AM without a car. Transit access directly reduces DUI risk and removes the biggest barrier to late-night patronage.',
    },

    // ── 10. Metric card tooltips ───────────────────────────────────────────
    metricTooltips: {
      competitors: 'The number of existing bars and nightlife venues found within the analysis area. Some competition is actually healthy for bars \u2014 nightlife clusters attract more foot traffic than isolated venues. However, too many competitors fighting for the same crowd means thinner margins and higher customer acquisition costs.',
      population: 'The total number of residents living in the immediate area surrounding this address. A larger residential population provides the base of regular customers who will visit on weeknights, not just destination crowds on weekends. Look for areas where population supports consistent traffic.',
      income: 'The midpoint household income in the area. Higher income neighborhoods support premium concepts \u2014 craft cocktail bars, wine lounges, and bottle service venues. Lower income areas may favor high-volume, value-driven concepts like sports bars, dive bars, or beer-and-shot specials.',
      walkScore: 'A measure of how walkable the area is, scored from 0 to 100. For bars, this is arguably the most important metric. Walkable neighborhoods enable pub crawls, spontaneous visits, and safe trips home \u2014 the trifecta of nightlife success. Scores above 70 are ideal; below 30 is a significant challenge.',
      employment: 'The percentage of working-age adults in the area who are currently employed. Employed residents drive the critical after-work happy hour crowd and have the disposable income for weekend nightlife. Rates above 90% signal strong mid-week revenue potential.',
      growth: 'The annual population growth rate for the surrounding county. Growing areas bring new residents who are actively looking for their new favorite bar. People who just moved to an area are more open to trying new venues and becoming regulars \u2014 a powerful acquisition advantage for a new bar.',
    },

    // ── 11. Quality tip tiers ──────────────────────────────────────────────
    qualityTipTiers: {
      excellent: (rating) => ` Competing venues are highly rated (${rating} avg). To break in, you need a concept they can't replicate \u2014 think live music, a rooftop patio, a speakeasy theme, or a craft cocktail program that becomes the talk of the neighborhood.`,
      good: (rating) => ` Competing bars are well-reviewed (${rating} avg) but not dominant. Outperform them on atmosphere, service speed, and a signature experience \u2014 a killer happy hour, weekly trivia, or DJ nights can shift the crowd to your venue.`,
      average: (rating) => ` Most nearby venues have average ratings (${rating}), which means patrons are settling, not loyal. A bar that nails the vibe \u2014 great music, strong pours, and a welcoming atmosphere \u2014 will quickly become the new default for locals.`,
      poor: (rating) => ` Nearby venues are poorly reviewed (${rating} avg) \u2014 customers in this area are practically begging for a better option. Invest in ambiance, well-trained bartenders, and a thoughtful drink menu to capture the crowd overnight.`,
    },

    // ── 12. Score labels ───────────────────────────────────────────────────
    scoreLabels: {
      excellent: 'Strong Expansion Target',
      moderate: 'Conditional Opportunity',
      challenging: 'High Risk Location',
      poor: 'High Risk Location',
    },

    // ── 13. Summary templates ──────────────────────────────────────────────
    summary: {
      openers: {
        excellent: 'This location shows strong potential for a new bar or nightlife venue.',
        moderate: 'This area presents a reasonable opportunity for a new bar or nightlife venue, though some factors warrant consideration.',
        challenging: 'This location faces some headwinds that could make establishing a new bar or nightlife venue difficult.',
        poor: 'This area may not be well-suited for a new bar or nightlife venue based on current market conditions.',
      },
      compSentences: {
        minimal: (competitorCount) => `With only ${competitorCount} existing venue${competitorCount === 1 ? '' : 's'} within the analysis area, the nightlife scene is underdeveloped, leaving room for a new bar to define the social landscape.`,
        moderate: (competitorCount) => `There are ${competitorCount} bars and nightlife venues within the analysis area, representing a healthy competitive scene that a well-differentiated concept could thrive in.`,
        significant: (competitorCount) => `The area has ${competitorCount} existing bars and venues within the analysis area, indicating a saturated nightlife market where a strong concept and unique identity are essential to survival.`,
      },
      demoTemplates: {
        favorableBoth: (popLevel, incomeLevel, medianIncome) => `The demographic profile is favorable, with ${popLevel} population density and ${incomeLevel} household income ($${medianIncome.toLocaleString()}), suggesting a customer base with both volume and entertainment spending power.`,
        favorableIncome: (incomeLevel, medianIncome, popLevel) => `Household income in the area is ${incomeLevel} at $${medianIncome.toLocaleString()}, which supports premium drink pricing and upscale nightlife concepts, though population density is ${popLevel}.`,
        favorablePop: (popLevel, population, incomeLevel, medianIncome) => `Population density is ${popLevel} (${population.toLocaleString()} residents), providing a large potential customer base for nightlife, though household income is ${incomeLevel} at $${medianIncome.toLocaleString()}.`,
        unfavorable: (popLevel, population, incomeLevel, medianIncome) => `The area has ${popLevel} population density (${population.toLocaleString()} residents) with ${incomeLevel} household income ($${medianIncome.toLocaleString()}), which may limit the customer base for nightlife.`,
        educatedEmployed: (collegePercent, employmentRate) => `The area's educated (${collegePercent}% college-educated) and employed (${employmentRate}% employment rate) population is favorable for a venue targeting the after-work and social crowd.`,
        lowEducation: (collegePercent) => `Education levels are relatively low (${collegePercent}% college-educated), which may influence the type of nightlife concept that resonates \u2014 value-driven formats like sports bars or karaoke tend to perform well in these demographics.`,
        growthPositive: (popGrowth) => `Notably, the county is experiencing ${popGrowth}% year-over-year population growth, a strong signal for nightlife demand as new residents seek social scenes.`,
        growthNegative: (popGrowth) => `The county is experiencing population decline (${popGrowth}% YoY), which could limit the customer base for nightlife over time.`,
        compHighRating: (avgCompetitorRating, totalCompetitorReviews) => `Existing venues are well-regarded, averaging ${avgCompetitorRating} stars across ${totalCompetitorReviews.toLocaleString()} reviews \u2014 entering this market will require a unique concept and exceptional execution.`,
        compLowRating: (avgCompetitorRating, totalCompetitorReviews) => `Competing venues average just ${avgCompetitorRating} stars (${totalCompetitorReviews.toLocaleString()} reviews), suggesting a clear opportunity to win the crowd with better atmosphere, drinks, and service.`,
        walkHigh: (walkScore) => `High walkability (Walk Score: ${walkScore}) is a major asset for nightlife \u2014 it enables pub crawls, spontaneous visits, and safe trips home.`,
        walkLow: (walkScore) => `Low walkability (Walk Score: ${walkScore}) is a significant challenge for a bar \u2014 customers need safe ways to get home, so proximity to ride-share pickup zones and ample parking are essential.`,
      },
      closers: {
        excellent: (score) => `Overall, this location scores ${score}/100, indicating an excellent opportunity for a nightlife venue worth serious consideration.`,
        moderate: (score) => `With a score of ${score}/100, this location merits further investigation and a detailed business plan before signing a lease.`,
        challenging: (score) => `The opportunity score of ${score}/100 suggests proceeding with caution and validating demand through pop-up events before committing.`,
        poor: (score) => `At ${score}/100, we recommend exploring alternative locations with stronger nightlife fundamentals.`,
      },
      businessType: 'bar or nightlife venue',
      serviceTerms: {
        elective: 'premium drinks and bottle service',
        comprehensive: 'full-service nightlife entertainment',
      },
    },

    // ── 14. Recommendation templates ───────────────────────────────────────
    recommendation: {
      excellent: {
        opener: (score) => `This area warrants serious exploration for a new bar or nightlife venue. With a score of ${score}/100, the fundamentals \u2014 customer demand, spending power, and competitive landscape \u2014 align well.`,
        compMinimal: (competitorCount) => `The low number of existing venues (${competitorCount}) suggests an underserved nightlife scene. Consider a versatile concept \u2014 a bar with food service, live music, or a patio \u2014 to become the neighborhood anchor before competitors catch on.`,
        compModerate: (competitorCount) => `With ${competitorCount} existing venues, there is room for a new entrant, but differentiation is key. Consider a concept the area lacks \u2014 a craft cocktail bar, wine lounge, speakeasy, or live music venue \u2014 to carve out your niche.`,
        incomeAboveAvg: (medianIncome) => `Above-average household income ($${medianIncome.toLocaleString()}) supports a premium concept \u2014 craft cocktails, curated wine lists, and a polished atmosphere can command higher price points and stronger margins.`,
        closer: 'Suggested next steps: visit the area on a Friday and Saturday night to observe foot traffic and crowd behavior, research commercial lease availability and liquor license requirements, and consult with a nightlife industry consultant to validate revenue projections.',
      },
      moderate: {
        opener: (score) => `This location shows promise but requires careful planning. At ${score}/100, certain factors work in your favor while others need mitigation.`,
        compSignificant: (competitorCount) => `The competitive density (${competitorCount} venues) is the primary concern. If you proceed, a strong concept is essential \u2014 consider formats that existing bars aren't offering, such as a rooftop bar, craft brewery taproom, or themed cocktail lounge.`,
        popLow: 'Population density is a limiting factor. Consider whether the area draws visitors from outside the immediate neighborhood \u2014 entertainment districts, hotel zones, and areas near event venues can generate demand that residential population alone doesn\'t capture.',
        growthPositive: (popGrowth) => `The positive population growth trend (+${popGrowth}% YoY) is encouraging \u2014 new residents actively seek social scenes and nightlife, giving a new venue a natural audience eager to discover their new favorite spot.`,
        closer: 'Suggested next steps: visit the area during peak nightlife hours (Thursday\u2013Saturday, 9 PM\u20131 AM) to assess real crowd flow, analyze the concepts and price points of nearby competitors for positioning gaps, and develop a conservative financial model before committing to a lease.',
      },
      challenging: {
        opener: (score) => `This area presents meaningful challenges for a new bar or nightlife venue. At ${score}/100, we recommend exploring whether specific conditions could improve the outlook before investing further.`,
        compHighLowIncome: 'High competition combined with moderate-to-low income levels creates pressure on both customer acquisition and drink pricing. A high-volume, value-driven concept \u2014 like a sports bar with affordable pitchers and big-screen events \u2014 may be more viable than a premium lounge in this market.',
        lowWalkability: 'The car-dependent nature of this area is a serious challenge for a bar \u2014 DUI risk discourages drinking away from home. If proceeding, ensure the location has ride-share pickup zones, ample parking, and consider a food-forward concept that reduces alcohol-centric liability.',
        closer: 'Suggested next steps: before committing, evaluate 2\u20133 alternative locations within a 10\u201315 mile radius for comparison, speak with local bar owners about revenue trends and seasonality, and consider a pop-up event or temporary residency to test demand before a full buildout.',
      },
      poor: {
        opener: (compLevel, popLevel, incomeLevel) => `Based on current market conditions, this area is not recommended for a new bar or nightlife venue. The combination of factors \u2014 ${compLevel} competition, ${popLevel} population density, and ${incomeLevel} income \u2014 creates a difficult environment for a sustainable nightlife business.`,
        alternative: 'If you\'re committed to this general region, we recommend running analyses on adjacent areas that may have stronger fundamentals. Look for nearby neighborhoods with growing populations, active foot traffic corridors, or emerging entertainment districts.',
        creative: 'Alternative consideration: if this location has strategic significance, a pop-up bar, food truck with a liquor license, or event-based model (private parties, catering) could allow you to test the market with lower overhead and less risk than a permanent buildout.',
      },
    },

    // ── 15. Upside & Risks ─────────────────────────────────────────────────
    upsideRisks: {
      competition: {
        upside: {
          none: { text: 'No direct nightlife competition within the analysis area', detailFn: () => '0 venues found' },
          underserved: { text: 'Underserved nightlife scene \u2014 fewer venues per resident than average', detailFn: (ratio) => `1 : ${ratio.toLocaleString()} ratio (industry avg: 1 : 800)` },
        },
        risk: {
          oversaturated: { text: 'Oversaturated nightlife district \u2014 differentiation and a unique concept are essential', detailFn: (ratio) => `1 : ${ratio.toLocaleString()} ratio (industry avg: 1 : 800)` },
          tight: { text: 'Competitive nightlife market \u2014 venue-to-resident ratio is tight', detailFn: (ratio) => `1 : ${ratio.toLocaleString()} ratio (industry avg: 1 : 800)` },
        },
        thresholds: { noComp: 0, underservedRatio: 800, oversaturatedRatio: 300 },
      },
      income: {
        upside: {
          high: { text: 'High household income supports premium cocktails and upscale nightlife', detailFn: (income) => `$${income.toLocaleString()} median` },
          aboveAvg: { text: 'Above-average household income supports healthy entertainment spending', detailFn: (income) => `$${income.toLocaleString()} median` },
        },
        risk: {
          low: { text: 'Low household income may limit premium drink sales and cover charges', detailFn: (income) => `$${income.toLocaleString()} median` },
        },
        thresholds: { high: 65000, aboveAvg: 45000, low: 30000 },
      },
      population: {
        upside: {
          strong: { text: 'Strong population density \u2014 deep customer base for weeknight and weekend traffic', detailFn: (pop) => `${pop.toLocaleString()} residents` },
        },
        risk: {
          low: { text: 'Low population density limits the regular customer base', detailFn: (pop) => `${pop.toLocaleString()} residents` },
        },
        thresholds: { strong: 4000, low: 2000 },
      },
      employment: {
        upside: {
          high: { text: 'High employment rate \u2014 strong after-work happy hour and weekend crowd', detailFn: (rate) => `${rate}% employed` },
        },
        risk: {
          low: { text: 'Below-average employment reduces disposable entertainment income', detailFn: (rate) => `${rate}% employed` },
        },
        thresholds: { high: 92, low: 85 },
      },
      walkability: {
        upside: {
          high: { text: 'Highly walkable \u2014 strong foot traffic for walk-in customers and safe alternatives to driving', detailFn: (ws) => `Walk Score: ${ws}` },
        },
        risk: {
          low: { text: 'Extremely low walkability \u2014 DUI risk and lack of foot traffic are major barriers for nightlife', detailFn: (ws) => `Walk Score: ${ws}` },
        },
        thresholds: { high: 70, low: 25 },
      },
      growth: {
        upside: {
          growing: { text: 'Growing population \u2014 new residents actively seeking social scenes and nightlife', detailFn: (g) => `+${g}% year-over-year` },
        },
        risk: {
          declining: { text: 'Declining population \u2014 shrinking customer base for nightlife over time', detailFn: (g) => `${g}% year-over-year` },
        },
        thresholds: { growing: 1, declining: -0.5 },
      },
      compQuality: {
        upside: {
          poor: { text: 'Competitors are poorly reviewed \u2014 customers are ready for a better bar experience', detailFn: (rating) => `${rating} avg stars` },
        },
        risk: {
          excellent: { text: 'Competitors are highly rated \u2014 breaking into this scene requires a standout concept', detailFn: (rating) => `${rating} avg stars` },
        },
        thresholds: { poor: 3.5, excellent: 4.5 },
      },
      education: {
        upside: {
          high: { text: 'Highly educated population \u2014 younger demographics more likely to frequent bars', detailFn: (pct) => `${pct}% college-educated` },
        },
        risk: {
          low: { text: 'Lower education levels may shift demand toward value-driven nightlife concepts', detailFn: (pct) => `${pct}% college-educated` },
        },
        thresholds: { high: 40, low: 15 },
      },
      anchors: {
        upside: {
          strong: { text: 'Strong nearby anchors drive evening foot traffic to the area', detailFn: (count) => `${count} points of interest` },
        },
        risk: {
          limited: { text: 'Limited nearby anchors \u2014 you\'ll need to be a destination, not a convenience stop', detailFn: (count) => `${count} points of interest` },
        },
        thresholds: { strong: 15, limited: 3 },
      },
    },

    // ── 16. Win strategy rules ─────────────────────────────────────────────
    winStrategy: [
      { condition: (r) => r.competitorCount === 0, text: 'No existing nightlife venues nearby \u2014 be the first mover and define the social scene before competitors arrive' },
      { condition: (r) => r.competitorCount > 0 && r.competitorCount <= 3, text: 'Low competition gives you room to become the neighborhood bar \u2014 invest in community presence early with trivia nights, open mics, and local partnerships' },
      { condition: (r) => r.competitorCount > 15, text: (r) => `With ${r.competitorCount} venues in the area, you must bring a concept nobody else has \u2014 a rooftop lounge, speakeasy, or immersive themed bar can break through the noise` },
      { condition: (r) => r.competitorCount > 8 && r.competitorCount <= 15, text: 'Moderate-to-high competition means concept clarity is essential \u2014 find the nightlife niche this area is missing and own it completely' },
      { condition: (r) => r.avgCompetitorRating != null && r.competitorCount > 0 && r.avgCompetitorRating < 3.5, text: (r) => `Competing venues average just ${r.avgCompetitorRating} stars \u2014 atmosphere and service are your fastest path to becoming the area's top-rated bar` },
      { condition: (r) => r.avgCompetitorRating != null && r.competitorCount > 0 && r.avgCompetitorRating >= 3.5 && r.avgCompetitorRating < 4.2, text: (r) => `Competitor ratings are moderate (${r.avgCompetitorRating} stars) \u2014 match their atmosphere while offering something unique like live music, craft cocktails, or a signature food menu` },
      { condition: (r) => r.avgCompetitorRating != null && r.competitorCount > 0 && r.avgCompetitorRating >= 4.5, text: (r) => `Competitors are well-reviewed (${r.avgCompetitorRating} stars) \u2014 competing on vibe alone won't be enough; differentiate through a unique concept, exclusive events, or a beverage program that can't be found elsewhere` },
      { condition: (r) => r.medianIncome >= 85000, text: 'High-income area supports premium nightlife \u2014 invest in craft cocktails, a curated wine list, bottle service, and upscale ambiance to maximize spend per customer' },
      { condition: (r) => r.medianIncome >= 65000 && r.medianIncome < 85000, text: 'Above-average income supports a polished concept \u2014 blend quality drinks with an inviting atmosphere and a food menu that keeps customers spending longer' },
      { condition: (r) => r.medianIncome < 40000, text: 'Lower income area requires a high-volume model \u2014 think sports bar with affordable pitchers, daily specials, and big-screen events that pack the house' },
      { condition: (r) => r.medianIncome >= 40000 && r.medianIncome < 55000, text: 'Moderate income means value matters \u2014 a strong happy hour, daily specials, and a loyalty program will build a loyal regular base' },
      { condition: (r) => { const ws = r.walkScore?.walkScore ?? null; return ws != null && ws >= 70; }, text: 'High walkability is a nightlife goldmine \u2014 maximize your street presence with outdoor seating, visible signage, and a welcoming entrance that pulls in foot traffic' },
      { condition: (r) => { const ws = r.walkScore?.walkScore ?? null; return ws != null && ws < 25; }, text: 'Car-dependent area is challenging for bars \u2014 partner with ride-share services, ensure well-lit parking, and consider a food-forward concept that moderates alcohol-focused liability' },
      { condition: (r) => r.popGrowth != null && r.popGrowth > 2, text: (r) => `Rapid population growth (${r.popGrowth}% YoY) means new residents seeking social scenes \u2014 launch with a strong social media presence and grand opening events to become the spot everyone talks about` },
      { condition: (r) => r.popGrowth != null && r.popGrowth > 1 && r.popGrowth <= 2, text: 'Steady population growth means rising nightlife demand \u2014 target new residents through apartment complex partnerships, neighborhood Facebook groups, and welcome promotions' },
      { condition: (r) => r.popGrowth != null && r.popGrowth < -0.5, text: 'Declining population means a shrinking customer base \u2014 focus on becoming a destination venue that draws from a wider radius, not just the immediate neighborhood' },
      { condition: (r) => r.collegePercent != null && r.collegePercent >= 40, text: 'Highly educated, younger demographic responds to curated experiences \u2014 invest in a craft beverage program, themed nights, and Instagram-worthy aesthetics' },
      { condition: (r) => r.employmentRate != null && r.employmentRate >= 92, text: 'High employment rate fuels the after-work crowd \u2014 build a killer happy hour (4\u20137 PM) with drink specials and bar snacks to capture the weekday commuter wave' },
      { condition: (r) => r.employmentRate != null && r.employmentRate < 85, text: 'Below-average employment means less weekday traffic \u2014 focus on weekend programming, events, and entertainment to drive concentrated peak revenue' },
      { condition: (r) => r.competitorCount > 5 && r.medianIncome >= 55000, text: 'Consider a specialty concept \u2014 in competitive markets with spending power, wine bars, craft brewery taprooms, and cocktail lounges command premium pricing and clearer positioning' },
      { condition: (r) => { const total = r.anchors ? Object.values(r.anchors).reduce((sum, d) => sum + d.count, 0) : 0; return total >= 15; }, text: 'Strong nearby anchors (restaurants, hotels, entertainment) create natural pre- and post-event traffic \u2014 position your bar as the place to go before dinner or after the show' },
      { condition: (r) => r.competitorCount > 0 && r.competitorCount <= 8 && r.avgCompetitorRating != null && r.avgCompetitorRating >= 4.0, text: 'Well-rated competitors set a high bar \u2014 match their quality while offering something they don\'t, such as live entertainment, a rooftop space, or a signature cocktail menu' },
    ],

    // ── 17. Next steps ─────────────────────────────────────────────────────
    nextSteps: {
      excellent: {
        immediate: (r) => {
          const items = [
            'Visit the area on a Friday and Saturday night (10 PM\u20131 AM) to observe foot traffic, crowd demographics, and vibe',
            'Walk the block to identify available commercial spaces with street-level visibility and outdoor seating potential',
            'Research liquor license requirements and timeline for this jurisdiction \u2014 lead times can be 3\u20136 months',
          ];
          if (r.competitorCount > 0) {
            items.push(`Visit ${r.competitorCount <= 3 ? 'each' : '2\u20133'} nearby competitor${r.competitorCount === 1 ? '' : 's'} on a busy night to assess their crowd, pricing, and atmosphere firsthand`);
          }
          return items;
        },
        shortTerm: (r) => {
          const items = [
            'Research commercial lease availability and compare rental rates for the area',
            'Meet with beverage distributors to discuss product selection, pricing tiers, and delivery logistics',
            'Get entertainment permit information and check local noise ordinances for your target location',
          ];
          if (r.popGrowth != null && r.popGrowth > 1) {
            items.push(`Research planned residential and commercial developments \u2014 ${r.popGrowth}% population growth may signal an emerging nightlife district`);
          } else {
            items.push('Research food service requirements \u2014 many jurisdictions require food availability wherever alcohol is served');
          }
          return items;
        },
        strategic: (r) => {
          const items = [];
          if (r.competitorCount <= 3) {
            items.push('Develop a versatile concept that can anchor the neighborhood \u2014 a bar with food, patio, and event capability captures the widest audience');
          } else {
            items.push('Develop a unique concept (craft cocktails, wine bar, sports bar, live music venue) that fills a gap in the current nightlife scene');
          }
          if (r.medianIncome >= 65000) {
            items.push('Design a premium beverage program with craft cocktails, local spirits, and a curated beer and wine list to maximize revenue per customer');
          } else {
            items.push('Plan a value-driven drink menu with strong daily specials and a signature drink that becomes your calling card');
          }
          items.push('Build a social media presence pre-launch \u2014 create buzz with behind-the-scenes content, menu previews, and a grand opening event strategy');
          items.push('Plan a signature food menu that complements your drinks and keeps customers spending longer per visit');
          return items;
        },
      },
      moderate: {
        immediate: (r) => {
          const items = [
            'Visit the area on Thursday, Friday, and Saturday nights to assess real nightlife traffic patterns and crowd flow',
            'Evaluate street-level visibility, outdoor seating potential, and proximity to ride-share pickup zones',
          ];
          if (r.competitorCount === 0) {
            items.push('Scout for available commercial space \u2014 assess whether the neighborhood can support nightlife or needs a pioneer concept');
          } else {
            items.push('Visit 2\u20133 nearby competitors on their busiest nights to assess crowd size, pricing, drink quality, and service speed');
          }
          items.push('Check noise ordinances, last-call laws, and outdoor seating regulations for the area');
          return items;
        },
        shortTerm: (r) => {
          const items = [
            'Run ExpansionLens analyses on 2\u20133 nearby locations to compare nightlife potential before committing',
            'Research liquor license costs, timeline, and availability for the specific jurisdiction',
            'Develop a conservative financial model with break-even analysis factoring in seasonality and weeknight vs. weekend revenue',
          ];
          if (r.competitorCount > 0 && r.avgCompetitorRating != null && r.avgCompetitorRating < 4.0) {
            items.push(`Research competitor reviews in detail \u2014 their ${r.avgCompetitorRating}-star average reveals exactly what customers are unhappy about so you can nail those things from day one`);
          } else {
            items.push('Talk to local bar owners (outside the immediate area) about revenue trends, seasonality, and lessons learned');
          }
          return items;
        },
        strategic: (r) => {
          const items = [];
          if (r.competitorCount > 8) {
            items.push('Target an underserved format \u2014 if the area is full of sports bars, open a cocktail lounge; if it\'s all upscale, a great dive bar can thrive');
          } else if (r.competitorCount > 0) {
            items.push('Analyze competitor concepts and price points \u2014 build your venue around the gap they leave open');
          } else {
            items.push('Plan a versatile concept that can serve as the area\'s social anchor \u2014 food, drinks, and programming all in one');
          }
          items.push('Build a differentiation strategy focused on atmosphere, a signature beverage program, and weekly programming (trivia, live music, DJ nights)');
          items.push('Create a customer acquisition plan leveraging social media, local influencers, and strategic partnerships with nearby restaurants and hotels');
          if (r.popGrowth != null && r.popGrowth > 1) {
            items.push(`Factor ${r.popGrowth}% population growth into your long-term projections \u2014 position for rising nightlife demand`);
          } else {
            items.push('Develop a loyalty program and regular event calendar to drive repeat visits and build a dependable customer base');
          }
          return items;
        },
      },
      challenging: {
        immediate: (r) => {
          const items = [
            'Visit the area on a Friday and Saturday night to assess real conditions \u2014 check for empty streets, closed businesses, and overall neighborhood safety',
          ];
          if (r.competitorCount > 0) {
            items.push('Visit nearby competitors to gauge whether any are struggling or closing \u2014 a failing bar\'s customer base could be yours');
          } else {
            items.push('Scout for available commercial space and assess whether the area infrastructure supports nightlife (parking, transit, street lighting)');
          }
          items.push('Talk to nearby restaurant and business owners about evening foot traffic patterns and the local nightlife appetite');
          items.push('Research the area\'s history with nightlife \u2014 have bars opened and closed here before? Understanding why is critical');
          return items;
        },
        shortTerm: (r) => {
          const items = [
            'Run ExpansionLens analyses on 2\u20133 alternative locations within a 10\u201315 mile radius for comparison',
            'Talk to local bar owners and beverage distributors about market conditions and revenue expectations in the area',
            'Consult with a hospitality accountant about the financial viability of this market before committing capital',
          ];
          if (r.competitorCount > 0) {
            items.push('Research whether any nearby venues are for sale \u2014 acquiring an existing liquor license and buildout may be less risky than starting from scratch');
          } else {
            items.push('Investigate whether the area\'s zoning actually permits bars and nightlife \u2014 some areas restrict liquor licenses by district');
          }
          return items;
        },
        strategic: (r) => {
          const ws = r.walkScore?.walkScore ?? null;
          const items = [];
          if (ws != null && ws < 30) {
            items.push('If proceeding in this car-dependent area, a food-forward concept with a bar component (restaurant-bar hybrid) reduces DUI liability and broadens your customer base');
          } else {
            items.push('Consider a pop-up bar or event-based model to test demand before committing to a permanent buildout');
          }
          if (r.competitorCount > 8 && r.medianIncome < 65000) {
            items.push('Evaluate a high-volume, low-cost model \u2014 sports bar with affordable specials and big-screen events can work where premium concepts cannot');
          } else {
            items.push('Develop a lean startup model \u2014 minimal buildout, limited menu, and flexible staffing to reduce risk during the initial ramp-up');
          }
          items.push('Explore event-based revenue streams: private parties, corporate events, and ticketed entertainment can supplement inconsistent walk-in traffic');
          items.push('Plan a phased approach \u2014 start with weekend-only hours and expand to weeknights only after validating consistent demand');
          return items;
        },
      },
      poor: {
        immediate: () => [
          'Explore adjacent neighborhoods and districts \u2014 run ExpansionLens on 3\u20134 alternative locations with more nightlife potential',
          'Drive the broader region to identify emerging entertainment districts, new developments, or underserved nightlife pockets',
          'Check whether zoning in this area even permits new bar and nightlife establishments',
          'Talk to local residents about their nightlife habits \u2014 where do they go now, and what would bring them closer to home?',
        ],
        shortTerm: () => [
          'Consult with a hospitality industry consultant before investing further in this specific market',
          'Research pop-up bar, mobile bar, or event catering models that could serve the area with lower overhead',
          'Investigate partnerships with existing restaurants or event spaces that could host a bar-within-a-bar concept',
          'Analyze whether nearby communities within 10\u201315 miles have stronger nightlife fundamentals for a primary location',
        ],
        strategic: () => [
          'Consider a mobile bar or event-based model \u2014 serve this area through pop-ups and private events from a stronger primary location',
          'If this location has strategic significance, explore whether a restaurant-bar hybrid with limited nightlife hours could reduce risk',
          'Research event-based revenue opportunities \u2014 private parties, corporate events, and festivals can generate income without a permanent venue',
          'Evaluate a low-overhead model: a neighborhood pub with minimal staff, limited hours, and a focus on building a loyal regular base over time',
        ],
      },
    },
  },
};

const defaultScoring = {
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
};

export function calculateScore({ population, medianIncome, competitorCount, walkScore, collegePercent, employmentRate, popGrowth, avgCompetitorRating, config }) {
  const cfg = config?.scoring || defaultScoring;

  // Internal computation uses raw earned/max so the total matches the
  // weighted methodology. Only the percentage form is exposed to clients.
  const internal = [
    { label: 'Population', earned: Math.min(cfg.population.max, (population / cfg.population.divisor) * cfg.population.max), max: cfg.population.max },
    { label: 'Income', earned: Math.min(cfg.income.max, (medianIncome / cfg.income.divisor) * cfg.income.max), max: cfg.income.max },
    { label: 'Competition', earned: getCompetitionScore(population, competitorCount, cfg), max: cfg.competition.max },
    { label: 'Comp. Quality', earned: getCompQualityScore(avgCompetitorRating), max: cfg.compQuality.max },
    { label: 'Walkability', earned: walkScore != null ? (walkScore / 100) * cfg.walkability.max : cfg.walkability.max / 2, max: cfg.walkability.max },
    { label: 'Education', earned: collegePercent != null ? Math.min(cfg.education.max, (collegePercent / cfg.education.divisor) * cfg.education.max) : cfg.education.max / 2, max: cfg.education.max },
    { label: 'Employment', earned: employmentRate != null ? Math.min(cfg.employment.max, (employmentRate / cfg.employment.divisor) * cfg.employment.max) : cfg.employment.max / 2, max: cfg.employment.max },
    { label: 'Growth', earned: popGrowth != null ? Math.min(cfg.growth.max, Math.max(0, (popGrowth / cfg.growth.divisor) * cfg.growth.max)) : cfg.growth.max / 2, max: cfg.growth.max },
  ];

  const total = Math.round(internal.reduce((sum, b) => sum + b.earned, 0));

  // Public breakdown: only label + percent (rounded to 5%). The raw earned
  // and max values stay server-side so cloners can't reverse-engineer the
  // weight assigned to each factor.
  const breakdown = internal.map((b) => ({
    label: b.label,
    percent: Math.round((b.earned / b.max) * 20) * 5,
  }));

  return { score: total, breakdown };
}

// Competition score based on provider-to-population ratio
// Census tract population covers ~1-2 sq mi; our search covers ~25 sq mi.
// We estimate area population by scaling tract density across the search area.
function getCompetitionScore(population, competitorCount, cfg) {
  if (competitorCount === 0) return cfg.competition.max;
  const areaMultiplier = cfg.areaMultiplier || (25 / 1.5);
  const estimatedAreaPop = population * areaMultiplier;
  const ratio = estimatedAreaPop / (competitorCount + 1);
  const underserved = cfg.compRatioUnderserved;
  const oversaturated = cfg.compRatioOversaturated;
  return Math.min(cfg.competition.max, Math.max(0, ((ratio - oversaturated) / (underserved - oversaturated)) * cfg.competition.max));
}

// Lower competitor ratings = easier to differentiate = more opportunity points
function getCompQualityScore(avgRating) {
  if (avgRating == null) return 4; // default when no Google data
  if (avgRating >= 4.5) return 1;  // tough — very well-reviewed competitors
  if (avgRating >= 4.0) return 3;
  if (avgRating >= 3.5) return 5;
  return 8; // poorly-reviewed competitors = big quality gap opportunity
}

export function getScoreTier(score) {
  if (score >= 75) return 'excellent';
  if (score >= 50) return 'moderate';
  if (score >= 25) return 'challenging';
  return 'poor';
}

export function getScoreTierLabel(score) {
  if (score >= 75) return 'Strong Opportunity';
  if (score >= 50) return 'Moderate Opportunity';
  if (score >= 25) return 'Challenging Market';
  return 'Poor Fit';
}

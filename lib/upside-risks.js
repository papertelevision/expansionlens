// Upside / Risks evaluation logic. Pre-rendered server-side so the
// decision thresholds (which competitor ratio counts as "oversaturated",
// which median income counts as "high," etc.) never reach the client.
//
// The client just receives `{ upside: [{text, detail}], risks: [...] }`
// and renders the strings.

import 'server-only';

export function evaluateUpsideRisks(result, cfg) {
  const upside = [];
  const risks = [];
  const ur = cfg.upsideRisks;
  if (!ur) return { upside, risks };

  const ratio = result.competitorCount > 0
    ? Math.round(result.population / (result.competitorCount + 1))
    : null;

  // Competition
  if (ur.competition) {
    const t = ur.competition.thresholds;
    if (result.competitorCount === t.noComp) {
      upside.push({ text: ur.competition.upside.none.text, detail: ur.competition.upside.none.detailFn(ratio) });
    } else if (ratio > t.underservedRatio) {
      upside.push({ text: ur.competition.upside.underserved.text, detail: ur.competition.upside.underserved.detailFn(ratio) });
    } else if (ratio < t.oversaturatedRatio) {
      risks.push({ text: ur.competition.risk.oversaturated.text, detail: ur.competition.risk.oversaturated.detailFn(ratio) });
    } else {
      risks.push({ text: ur.competition.risk.tight.text, detail: ur.competition.risk.tight.detailFn(ratio) });
    }
  }

  // Income
  if (ur.income) {
    const t = ur.income.thresholds;
    if (result.medianIncome >= t.high) {
      upside.push({ text: ur.income.upside.high.text, detail: ur.income.upside.high.detailFn(result.medianIncome) });
    } else if (result.medianIncome >= t.aboveAvg) {
      upside.push({ text: ur.income.upside.aboveAvg.text, detail: ur.income.upside.aboveAvg.detailFn(result.medianIncome) });
    } else if (result.medianIncome < t.low) {
      risks.push({ text: ur.income.risk.low.text, detail: ur.income.risk.low.detailFn(result.medianIncome) });
    }
  }

  // Population
  if (ur.population) {
    const t = ur.population.thresholds;
    if (result.population >= t.strong) {
      upside.push({ text: ur.population.upside.strong.text, detail: ur.population.upside.strong.detailFn(result.population) });
    } else if (result.population < t.low) {
      risks.push({ text: ur.population.risk.low.text, detail: ur.population.risk.low.detailFn(result.population) });
    }
  }

  // Employment
  if (ur.employment && result.employmentRate != null) {
    const t = ur.employment.thresholds;
    if (result.employmentRate >= t.high) {
      upside.push({ text: ur.employment.upside.high.text, detail: ur.employment.upside.high.detailFn(result.employmentRate) });
    } else if (result.employmentRate < t.low) {
      risks.push({ text: ur.employment.risk.low.text, detail: ur.employment.risk.low.detailFn(result.employmentRate) });
    }
  }

  // Walkability
  const wsVal = result.walkScore?.walkScore ?? null;
  if (ur.walkability && wsVal != null) {
    const t = ur.walkability.thresholds;
    if (wsVal >= t.high) {
      upside.push({ text: ur.walkability.upside.high.text, detail: ur.walkability.upside.high.detailFn(wsVal) });
    } else if (wsVal < t.low) {
      risks.push({ text: ur.walkability.risk.low.text, detail: ur.walkability.risk.low.detailFn(wsVal) });
    }
  }

  // Growth
  if (ur.growth && result.popGrowth != null) {
    const t = ur.growth.thresholds;
    if (result.popGrowth > t.growing) {
      upside.push({ text: ur.growth.upside.growing.text, detail: ur.growth.upside.growing.detailFn(result.popGrowth) });
    } else if (result.popGrowth < t.declining) {
      risks.push({ text: ur.growth.risk.declining.text, detail: ur.growth.risk.declining.detailFn(result.popGrowth) });
    }
  }

  // Competitor Quality
  if (ur.compQuality && result.avgCompetitorRating != null && result.competitorCount > 0) {
    const t = ur.compQuality.thresholds;
    if (result.avgCompetitorRating < t.poor) {
      upside.push({ text: ur.compQuality.upside.poor.text, detail: ur.compQuality.upside.poor.detailFn(result.avgCompetitorRating) });
    } else if (result.avgCompetitorRating >= t.excellent) {
      risks.push({ text: ur.compQuality.risk.excellent.text, detail: ur.compQuality.risk.excellent.detailFn(result.avgCompetitorRating) });
    }
  }

  // Education
  if (ur.education && result.collegePercent != null) {
    const t = ur.education.thresholds;
    if (result.collegePercent >= t.high) {
      upside.push({ text: ur.education.upside.high.text, detail: ur.education.upside.high.detailFn(result.collegePercent) });
    } else if (result.collegePercent < t.low) {
      risks.push({ text: ur.education.risk.low.text, detail: ur.education.risk.low.detailFn(result.collegePercent) });
    }
  }

  // Anchors
  if (ur.anchors && result.anchors) {
    const totalAnchors = Object.values(result.anchors).reduce((sum, d) => sum + d.count, 0);
    const t = ur.anchors.thresholds;
    if (totalAnchors >= t.strong) {
      upside.push({ text: ur.anchors.upside.strong.text, detail: ur.anchors.upside.strong.detailFn(totalAnchors) });
    } else if (totalAnchors <= t.limited) {
      risks.push({ text: ur.anchors.risk.limited.text, detail: ur.anchors.risk.limited.detailFn(totalAnchors) });
    }
  }

  return { upside, risks };
}

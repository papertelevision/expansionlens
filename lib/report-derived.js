// Server-only derivation functions for report content.
//
// All three of these used to live in app/report/page.js (a 'use client'
// component), which meant the entire scoring/revenue/win-strategy
// methodology shipped to every visitor's browser. They now run server-side
// and the API returns pre-rendered strings the client just renders.

import 'server-only';

export function deriveWinStrategy(result, cfg) {
  const items = [];
  if (!cfg.winStrategy) return items;

  for (const rule of cfg.winStrategy) {
    if (rule.condition(result)) {
      items.push(typeof rule.text === 'function' ? rule.text(result) : rule.text);
    }
    if (items.length >= 4) break;
  }

  return items;
}

export function deriveMarketCapacity(result, cfg) {
  const mc = cfg.marketCapacity;
  if (!mc) return null;

  const pop = result.population;
  const compCount = result.competitorCount;
  const income = result.medianIncome;
  const growth = result.popGrowth;
  const avgRating = result.avgCompetitorRating;
  const employmentRate = result.employmentRate;

  const areaMultiplier = result.searchRadius?.areaMultiplier || (25 / 1.5);
  const areaPop = Math.round(pop * areaMultiplier);
  const patientsPerPractice = Math.round(areaPop / (compCount + 1));

  const incomeMultiplier = income >= mc.incomeThresholds.high ? 1.15 : income >= mc.incomeThresholds.medium ? 1.0 : income >= mc.incomeThresholds.low ? 0.85 : 0.7;
  const employmentMultiplier = employmentRate != null ? (employmentRate >= 92 ? 1.1 : employmentRate >= 85 ? 1.0 : 0.85) : 1.0;
  const utilization = Math.min(0.85, mc.utilizationBase * incomeMultiplier * employmentMultiplier);

  const rawCustomers = Math.round(patientsPerPractice * utilization);
  const customers = Math.max(mc.customerCap.min, Math.min(mc.customerCap.max, rawCustomers));
  const low = Math.round(customers * 0.85 / 50) * 50;
  const high = Math.round(customers * 1.15 / 50) * 50;

  const revenuePerCustomer = income >= mc.incomeThresholds.high ? mc.revenuePerCustomer.high
    : income >= mc.incomeThresholds.medium ? mc.revenuePerCustomer.medium
    : income >= mc.incomeThresholds.low ? mc.revenuePerCustomer.low
    : mc.revenuePerCustomer.veryLow;
  const revenueLow = low * revenuePerCustomer;
  const revenueHigh = high * revenuePerCustomer;

  let title, stat, detail;
  const customerTerm = cfg.customerTerm;
  const businessTerm = cfg.businessTerm;

  if (compCount === 0) {
    title = 'Untapped Market Potential';
    stat = `${low.toLocaleString()}–${high.toLocaleString()}`;
    detail = `This area has no direct competition. Based on the estimated ${areaPop.toLocaleString()} residents in the search area, a new ${businessTerm} could capture ${low.toLocaleString()}–${high.toLocaleString()} active ${customerTerm} annually.`;
  } else if (patientsPerPractice > (cfg.scoring?.compRatioUnderserved || 2000)) {
    title = 'Estimated Market Capacity';
    stat = `${low.toLocaleString()}–${high.toLocaleString()}`;
    detail = `This underserved area has approximately ${areaPop.toLocaleString()} residents shared among ${compCount} ${businessTerm}${compCount === 1 ? '' : 's'}. A new ${businessTerm} could support ${low.toLocaleString()}–${high.toLocaleString()} active ${customerTerm} annually.`;
  } else if (income >= mc.incomeThresholds.high) {
    title = 'Estimated Revenue Opportunity';
    const fmtLow = '$' + Math.round(revenueLow / 1000).toLocaleString() + 'K';
    const fmtHigh = '$' + Math.round(revenueHigh / 1000).toLocaleString() + 'K';
    stat = `${fmtLow}–${fmtHigh}`;
    detail = `High household income ($${income.toLocaleString()}) supports premium offerings. Based on ${low.toLocaleString()}–${high.toLocaleString()} estimated ${customerTerm} at ~$${revenuePerCustomer} per ${customerTerm.replace(/s$/, '')}, first-year revenue could reach ${fmtLow}–${fmtHigh}.`;
  } else if (avgRating != null && avgRating < 3.5 && compCount > 0) {
    title = 'Quality Gap Opportunity';
    stat = `${low.toLocaleString()}–${high.toLocaleString()}`;
    detail = `Competitors average just ${avgRating} stars — ${customerTerm} in this area are likely seeking better options. A quality-focused ${businessTerm} could capture ${low.toLocaleString()}–${high.toLocaleString()} ${customerTerm} from dissatisfied competitors.`;
  } else if (growth != null && growth > 1.5) {
    title = 'Growth Market Capacity';
    const futureCustomers = Math.round(high * (1 + growth / 100 * 3));
    stat = `${low.toLocaleString()}–${high.toLocaleString()}`;
    detail = `With ${growth}% annual population growth, the current capacity of ${low.toLocaleString()}–${high.toLocaleString()} ${customerTerm} could grow to ~${futureCustomers.toLocaleString()} within 3 years as new residents move in.`;
  } else {
    title = 'Estimated Market Capacity';
    stat = `${low.toLocaleString()}–${high.toLocaleString()}`;
    detail = `Based on ${areaPop.toLocaleString()} estimated residents and ${compCount} existing ${businessTerm}${compCount === 1 ? '' : 's'}, a new ${businessTerm} in this area could support approximately ${low.toLocaleString()}–${high.toLocaleString()} active ${customerTerm} annually.`;
  }

  return { title, stat, detail, unit: title.includes('Revenue') ? '/yr' : `${customerTerm}/yr` };
}

export function deriveNextSteps(result, cfg) {
  const score = result.score;
  const tier = score >= 75 ? 'excellent' : score >= 50 ? 'moderate' : score >= 25 ? 'challenging' : 'poor';
  const ctx = {
    competitorCount: result.competitorCount,
    compCount: result.competitorCount,
    medianIncome: result.medianIncome,
    income: result.medianIncome,
    population: result.population,
    pop: result.population,
    walkScore: result.walkScore,
    ws: result.walkScore?.walkScore ?? null,
    popGrowth: result.popGrowth,
    growth: result.popGrowth,
    avgCompetitorRating: result.avgCompetitorRating,
    avgRating: result.avgCompetitorRating,
    employmentRate: result.employmentRate,
  };

  const tierSteps = cfg.nextSteps?.[tier];
  if (tierSteps) {
    return {
      immediate: tierSteps.immediate(ctx),
      shortTerm: tierSteps.shortTerm(ctx),
      strategic: tierSteps.strategic(ctx),
    };
  }
  return { immediate: [], shortTerm: [], strategic: [] };
}

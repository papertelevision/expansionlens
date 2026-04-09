export function generateSummary({ score, competitorCount, population, medianIncome, walkScore, collegePercent, employmentRate, popGrowth, avgCompetitorRating, totalCompetitorReviews, config }) {
  const tier = score >= 75 ? 'excellent' : score >= 50 ? 'moderate' : score >= 25 ? 'challenging' : 'poor';

  const compLevel = competitorCount <= 3 ? 'minimal' : competitorCount <= 8 ? 'moderate' : 'significant';
  const incomeLevel = medianIncome >= 65000 ? 'above-average' : medianIncome >= 45000 ? 'average' : 'below-average';
  const popLevel = population >= 4000 ? 'strong' : population >= 2000 ? 'moderate' : 'low';

  const businessType = config?.summary?.businessType || 'dental practice';

  const openers = {
    excellent: config?.summary?.openers?.excellent || `This location shows strong potential for a new dental practice.`,
    moderate: config?.summary?.openers?.moderate || `This area presents a reasonable opportunity for a new dental practice, though some factors warrant consideration.`,
    challenging: config?.summary?.openers?.challenging || `This location faces some headwinds that could make establishing a new dental practice difficult.`,
    poor: config?.summary?.openers?.poor || `This area may not be well-suited for a new dental practice based on current market conditions.`,
  };

  const compSentences = {
    minimal: config?.summary?.compSentences?.minimal
      ? config.summary.compSentences.minimal(competitorCount)
      : `With only ${competitorCount} existing dental practice${competitorCount === 1 ? '' : 's'} within the analysis area, competition is minimal, leaving room for a new entrant to capture market share.`,
    moderate: config?.summary?.compSentences?.moderate
      ? config.summary.compSentences.moderate(competitorCount)
      : `There are ${competitorCount} dental practices within the analysis area, representing moderate competition that a well-positioned practice could navigate.`,
    significant: config?.summary?.compSentences?.significant
      ? config.summary.compSentences.significant(competitorCount)
      : `The area has ${competitorCount} existing dental practices within the analysis area, indicating a highly competitive market where differentiation will be critical.`,
  };

  const demoSentences = (() => {
    const parts = [];

    if (incomeLevel === 'above-average' && popLevel === 'strong') {
      parts.push(`The demographic profile is favorable, with ${popLevel} population density and ${incomeLevel} household income ($${medianIncome.toLocaleString()}), suggesting a patient base with both volume and purchasing power.`);
    } else if (incomeLevel === 'above-average') {
      parts.push(`Household income in the area is ${incomeLevel} at $${medianIncome.toLocaleString()}, which bodes well for elective and cosmetic ${businessType === 'dental practice' ? 'dental services' : businessType + ' services'}, though population density is ${popLevel}.`);
    } else if (popLevel === 'strong') {
      parts.push(`Population density is ${popLevel} (${population.toLocaleString()} residents), providing a solid potential patient base, though household income is ${incomeLevel} at $${medianIncome.toLocaleString()}.`);
    } else {
      parts.push(`The area has ${popLevel} population density (${population.toLocaleString()} residents) with ${incomeLevel} household income ($${medianIncome.toLocaleString()}), which may limit the addressable market.`);
    }

    // Add education/employment color if available
    if (collegePercent != null && employmentRate != null) {
      if (collegePercent >= 35 && employmentRate >= 90) {
        parts.push(`The area's educated (${collegePercent}% college-educated) and employed (${employmentRate}% employment rate) population is favorable for a practice offering comprehensive ${businessType === 'dental practice' ? 'dental services' : businessType + ' services'}.`);
      } else if (collegePercent < 20) {
        parts.push(`Education levels are relatively low (${collegePercent}% college-educated), which may influence demand for elective ${businessType === 'dental practice' ? 'dental procedures' : businessType + ' services'}.`);
      }
    }

    // Growth trend
    if (popGrowth != null) {
      if (popGrowth > 1) {
        parts.push(`Notably, the county is experiencing ${popGrowth}% year-over-year population growth, a positive signal for long-term demand.`);
      } else if (popGrowth < -0.5) {
        parts.push(`The county is experiencing population decline (${popGrowth}% YoY), which could limit future growth prospects.`);
      }
    }

    // Competitor quality
    if (avgCompetitorRating != null && totalCompetitorReviews > 0) {
      if (avgCompetitorRating >= 4.5) {
        parts.push(`Existing competitors are well-regarded, averaging ${avgCompetitorRating} stars across ${totalCompetitorReviews.toLocaleString()} reviews — entering this market will require a strong value proposition and exceptional patient experience.`);
      } else if (avgCompetitorRating < 3.5) {
        parts.push(`Competitors in the area average just ${avgCompetitorRating} stars (${totalCompetitorReviews.toLocaleString()} reviews), suggesting a clear opportunity to differentiate through quality of care and patient satisfaction.`);
      }
    }

    // Walk Score
    if (walkScore != null) {
      if (walkScore >= 70) {
        parts.push(`High walkability (Walk Score: ${walkScore}) means strong foot traffic and visibility for a street-level practice.`);
      } else if (walkScore < 30) {
        parts.push(`Low walkability (Walk Score: ${walkScore}) suggests a car-dependent area — ample parking and visibility from main roads will be important.`);
      }
    }

    return parts.join(' ');
  })();

  const closers = {
    excellent: config?.summary?.closers?.excellent
      ? config.summary.closers.excellent(score)
      : `Overall, this location scores ${score}/100, indicating an excellent opportunity worth serious consideration.`,
    moderate: config?.summary?.closers?.moderate
      ? config.summary.closers.moderate(score)
      : `With a score of ${score}/100, this location merits further investigation and a detailed business plan.`,
    challenging: config?.summary?.closers?.challenging
      ? config.summary.closers.challenging(score)
      : `The opportunity score of ${score}/100 suggests proceeding with caution and thorough market research.`,
    poor: config?.summary?.closers?.poor
      ? config.summary.closers.poor(score)
      : `At ${score}/100, we recommend exploring alternative locations with stronger fundamentals.`,
  };

  const summary = `${openers[tier]} ${compSentences[compLevel]} ${demoSentences} ${closers[tier]}`;

  // Generate recommendation — actionable next steps based on all factors
  const recommendation = generateRecommendation({ tier, compLevel, incomeLevel, popLevel, competitorCount, population, medianIncome, walkScore, popGrowth, score, avgCompetitorRating, totalCompetitorReviews, config });

  return { summary, recommendation };
}

function generateRecommendation({ tier, compLevel, incomeLevel, popLevel, competitorCount, population, medianIncome, walkScore, popGrowth, score, avgCompetitorRating, totalCompetitorReviews, config }) {
  // If config provides recommendation templates, build steps from them
  if (config?.recommendation?.[tier]) {
    const tmpl = config.recommendation[tier];
    const steps = [];

    if (tier === 'excellent') {
      if (tmpl.opener) steps.push(tmpl.opener(score));
      if (compLevel === 'minimal' && tmpl.compMinimal) steps.push(tmpl.compMinimal(competitorCount));
      else if (compLevel === 'moderate' && tmpl.compModerate) steps.push(tmpl.compModerate(competitorCount));
      if (incomeLevel === 'above-average' && tmpl.incomeAboveAvg) steps.push(tmpl.incomeAboveAvg(medianIncome));
      if (tmpl.closer) steps.push(tmpl.closer);
    } else if (tier === 'moderate') {
      if (tmpl.opener) steps.push(tmpl.opener(score));
      if (compLevel === 'significant' && tmpl.compSignificant) steps.push(tmpl.compSignificant(competitorCount));
      else if (popLevel === 'low' && tmpl.popLow) steps.push(tmpl.popLow);
      if (popGrowth != null && popGrowth > 1 && tmpl.growthPositive) steps.push(tmpl.growthPositive(popGrowth));
      if (tmpl.closer) steps.push(tmpl.closer);
    } else if (tier === 'challenging') {
      if (tmpl.opener) steps.push(tmpl.opener(score));
      if (compLevel === 'significant' && incomeLevel !== 'above-average' && tmpl.compHighLowIncome) steps.push(tmpl.compHighLowIncome);
      if (walkScore != null && walkScore < 30 && tmpl.lowWalkability) steps.push(tmpl.lowWalkability);
      if (tmpl.closer) steps.push(tmpl.closer);
    } else {
      if (tmpl.opener) steps.push(tmpl.opener(compLevel, popLevel, incomeLevel));
      if (tmpl.alternative) steps.push(tmpl.alternative);
      if (tmpl.creative) steps.push(tmpl.creative);
    }

    return steps;
  }

  const steps = [];

  if (tier === 'excellent') {
    steps.push(`This area warrants serious exploration for a new dental practice. With a score of ${score}/100, the fundamentals — patient demand, income levels, and competitive landscape — align well.`);

    if (compLevel === 'minimal') {
      steps.push(`The low number of existing practices (${competitorCount}) suggests an underserved market. Consider a general or family dentistry model to capture broad demand before competitors enter.`);
    } else if (compLevel === 'moderate') {
      steps.push(`With ${competitorCount} existing practices, there is room for a new entrant, but consider differentiating through specialty services (cosmetic, orthodontic, or pediatric dentistry) to stand out.`);
    }

    if (incomeLevel === 'above-average') {
      steps.push(`Above-average household income ($${medianIncome.toLocaleString()}) supports a practice model that includes elective and cosmetic procedures — these higher-margin services could accelerate profitability.`);
    }

    steps.push(`Suggested next steps: conduct a site visit to evaluate street-level visibility and foot traffic, research commercial lease availability and rates in the area, and consult with a dental practice broker or consultant to validate patient volume projections.`);

  } else if (tier === 'moderate') {
    steps.push(`This location shows promise but requires careful planning. At ${score}/100, certain factors work in your favor while others need mitigation.`);

    if (compLevel === 'significant') {
      steps.push(`The competitive density (${competitorCount} practices) is the primary concern. If you proceed, a clear differentiator will be essential — consider underserved specialties like pediatric dentistry, orthodontics, or sedation dentistry that existing practices may not emphasize.`);
    } else if (popLevel === 'low') {
      steps.push(`Population density is a limiting factor. Consider whether the area has daytime traffic (offices, retail, commuters) that could supplement the residential patient base, as this wouldn't be captured in residential population figures alone.`);
    }

    if (popGrowth != null && popGrowth > 1) {
      steps.push(`The positive population growth trend (+${popGrowth}% YoY) is encouraging — new residents will need to establish dental care relationships, giving a new practice a natural acquisition advantage.`);
    }

    steps.push(`Suggested next steps: visit the area during business hours to assess real foot traffic, analyze the specific services offered by nearby competitors for gaps you could fill, and develop a conservative financial model before committing to a lease.`);

  } else if (tier === 'challenging') {
    steps.push(`This area presents meaningful challenges for a new dental practice. At ${score}/100, we recommend exploring whether specific micro-conditions could improve the outlook before investing further.`);

    if (compLevel === 'significant' && incomeLevel !== 'above-average') {
      steps.push(`High competition combined with moderate-to-low income levels creates pressure on both patient acquisition and pricing. A discount or membership-based dental model (dental savings plans) may be more viable than a traditional fee-for-service approach in this market.`);
    }

    if (walkScore != null && walkScore < 30) {
      steps.push(`The car-dependent nature of this area means location selection is especially critical — prioritize high-visibility spots near major intersections or anchored retail centers where patients are already driving.`);
    }

    steps.push(`Suggested next steps: before committing, evaluate 2-3 alternative locations within a 10-15 mile radius for comparison, speak with local dental suppliers or labs about practice density in the region, and consider a part-time or shared-space model to test the market before a full buildout.`);

  } else {
    steps.push(`Based on current market conditions, this area is not recommended for a new dental practice. The combination of factors — ${compLevel} competition, ${popLevel} population density, and ${incomeLevel} income — creates a difficult environment for a sustainable practice.`);

    steps.push(`If you're committed to this general region, we recommend running analyses on adjacent areas that may have stronger fundamentals. Look for nearby communities with growing populations, fewer existing dental practices, or higher household income.`);

    steps.push(`Alternative consideration: if this location has personal or strategic significance, a mobile dental practice or tele-dentistry model could allow you to serve the area with lower overhead and less risk than a traditional brick-and-mortar buildout.`);
  }

  return steps;
}

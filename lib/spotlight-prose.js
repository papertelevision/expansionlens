// Generates contextual prose for spotlight articles from analyze API data.
// Shared between manual generation (admin panel) and auto-generation (cron).

function getTierLabel(score) {
  if (score >= 75) return 'Strong Opportunity';
  if (score >= 50) return 'Moderate Opportunity';
  if (score >= 25) return 'Challenging Market';
  return 'Poor Fit';
}

export function generateSpotlightProse(city, state, data) {
  const radius = data.searchRadius?.radiusMiles || 3.5;
  const pop = data.population;
  const income = data.medianIncome;
  const compCount = data.competitorCount;
  const ws = data.walkScore?.walkScore;
  const growth = data.popGrowth;
  const college = data.collegePercent;
  const avgRating = data.avgCompetitorRating;

  // Intro
  const growthClause = growth > 2 ? `with a ${growth}% annual population growth rate, ` : growth > 0 ? `with steady population growth, ` : '';
  const popClause = pop > 100000 ? `a major metro of ${pop.toLocaleString()} residents` : pop > 30000 ? `a mid-sized market of ${pop.toLocaleString()} residents` : `a smaller market of ${pop.toLocaleString()} residents`;
  const introText = `${city}, ${state} is ${popClause} ${growthClause}that has drawn increasing attention from dental entrepreneurs and DSOs evaluating new practice locations. We ran a full analysis of the downtown ${city} market using U.S. Census demographics, Google Places competitor data, federal NPI Registry records, and walkability metrics to determine whether this market supports a new dental practice.`;

  // City context
  const walkClause = ws >= 80 ? `With a Walk Score of ${ws}, ${city}'s downtown core offers strong pedestrian accessibility — a key driver of patient convenience and walk-in traffic for dental practices.` : ws >= 50 ? `${city} has a Walk Score of ${ws}, indicating moderate walkability. Practices in this market should plan for patients who primarily drive.` : ws ? `${city}'s Walk Score of ${ws} indicates a car-dependent market. Visibility from major roads and ample parking will be more important than foot traffic.` : '';
  const incomeClause = income >= 75000 ? `Median household income of $${income.toLocaleString()} places ${city} in a higher-income bracket, which correlates strongly with employer-sponsored dental insurance coverage and higher case acceptance for elective procedures like cosmetic dentistry, implants, and orthodontics.` : income >= 55000 ? `With a median household income of $${income.toLocaleString()}, ${city} supports a solid base of employer-insured patients, though premium elective procedures may require more targeted marketing.` : `Median household income of $${income.toLocaleString()} suggests a value-conscious market where insurance acceptance and transparent pricing will be key differentiators.`;
  const eduClause = college >= 50 ? ` The area's ${college}% college-educated population is a strong indicator for case acceptance — research consistently shows that higher education levels correlate with proactive dental care and willingness to invest in treatment plans.` : '';
  const cityContext = `${walkClause} ${incomeClause}${eduClause}`;

  // Competitive landscape
  const densityDesc = compCount > 30 ? `a highly competitive market with ${compCount} dental practices` : compCount > 15 ? `a moderately competitive market with ${compCount} dental practices` : compCount > 5 ? `a market with room to grow, currently served by ${compCount} dental practices` : `an underserved area with only ${compCount} dental practice${compCount === 1 ? '' : 's'}`;
  const qualityClause = avgRating != null && avgRating < 4.0 ? ` Notably, the average competitor rating is just ${avgRating} stars — indicating meaningful quality gaps that a well-run, patient-focused practice could exploit. When existing providers underperform on patient experience, new entrants with modern facilities and strong online reputations can capture market share quickly.` : avgRating != null && avgRating >= 4.5 ? ` Existing practices maintain a strong average rating of ${avgRating} stars, so differentiation will need to come from specialization, convenience, or underserved patient segments rather than simply offering better service.` : avgRating != null ? ` Competitors average ${avgRating} stars, suggesting a mix of quality — there may be opportunities to differentiate through superior patient experience or specialized services.` : '';
  const competitiveText = `Our analysis identified ${densityDesc} within a ${radius}-mile radius of the downtown core. The full report maps every competitor with Google ratings, review counts, and exact locations — but at a high level, ${city}'s dental market ${compCount > 20 ? 'rewards practices that find a clear positioning niche' : 'has capacity for a well-positioned new entrant'}.${qualityClause}`;

  // Summary / bottom line
  const tierWord = data.score >= 75 ? 'strong' : data.score >= 50 ? 'conditional' : 'challenging';
  const summaryText = `${city} presents a ${tierWord} opportunity for dental practice expansion. ${data.score >= 50 ? `The combination of ${pop > 30000 ? 'a sizable population base' : 'local demand'}${growth > 1 ? ', active population growth' : ''}${ws >= 70 ? ', and strong walkability' : ''} creates a foundation for patient acquisition — but the specifics matter.` : `While the overall score suggests caution, there may be micro-markets within ${city} that perform better than the downtown average.`} The full ExpansionLens report breaks down exactly which factors are working in this market's favor, which are headwinds, and what a winning practice model looks like for this specific location.`;

  return { introText, cityContext, competitiveText, summaryText };
}

export function slugify(city, state) {
  return `dental-market-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}-${state.toLowerCase()}`;
}

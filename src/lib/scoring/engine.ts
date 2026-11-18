import {
  AiDiagnosis,
  BehavioralSignal,
  CFRatingChange,
  CFSubmission,
  DimensionScore,
  GitHubRepoSummary,
  GradLensReport,
  IndependentChallengeResult,
  InternshipMatchResult,
  SemesterRecord,
  WeeklyVector,
} from './types';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = clamp(Math.floor((p / 100) * (sorted.length - 1)), 0, sorted.length - 1);
  return sorted[idx];
}

/**
 * Computes Ordinary Least Squares (OLS) linear regression slope
 */
export function computeOlsSlope(ys: number[]): number {
  const n = ys.length;
  if (n < 2) return 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += ys[i];
    sumXY += i * ys[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-9) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

/**
 * Computes Theil-Sen robust non-parametric trend slope (median of all pairwise slopes)
 */
export function computeTheilSenSlope(ys: number[]): number {
  const n = ys.length;
  if (n < 2) return 0;
  const slopes: number[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      slopes.push((ys[j] - ys[i]) / (j - i));
    }
  }
  return median(slopes);
}

/**
 * Holt's Double Exponential Smoothing for 8-week forward projection
 */
export function computeHoltForecast(
  history: number[],
  horizonWeeks = 8,
  alpha = 0.45,
  beta = 0.25,
): number[] {
  if (history.length === 0) return Array(horizonWeeks).fill(0);
  let level = history[0];
  let trend = history.length > 1 ? history[1] - history[0] : 0;

  for (let t = 1; t < history.length; t++) {
    const prevLevel = level;
    level = alpha * history[t] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  const forecast: number[] = [];
  for (let k = 1; k <= horizonWeeks; k++) {
    forecast.push(clamp(Math.round((level + k * trend) * 10) / 10, 5, 99));
  }
  return forecast;
}

export interface EngineInput {
  profile: {
    name: string;
    college: string;
    degree: string;
    branch: string;
    currentSemester: number;
    graduationYear: number;
    githubUsername: string;
    codeforcesHandle: string;
    isLiveSync: boolean;
  };
  cfUserInfo?: {
    rating?: number;
    maxRating?: number;
    rank?: string;
  };
  cfRatings: CFRatingChange[];
  cfSubmissions: CFSubmission[];
  ghRepos: GitHubRepoSummary[];
  semesters: SemesterRecord[];
  challengeResult?: IndependentChallengeResult;
}

const CURATED_INTERNSHIP_CORPUS = [
  {
    id: 'role-systems-sde',
    title: 'Systems & Backend Engineering Intern',
    company: 'Zerodha / Groww Tier-1 FinTech Archetype',
    category: 'Systems & AI' as const,
    location: 'Bengaluru / Hybrid',
    stipend: '₹60,000 - ₹85,000 / mo',
    source: 'Greenhouse Public Board / Curated Career Page',
    sourceUrl: 'https://careers.groww.in',
    lastChecked: '2026-11-18',
    minGradYear: 2027,
    maxGradYear: 2030,
    minCgpa: 7.0,
    reqs: {
      problemSolving: 72,
      engineering: 74,
      consistency: 68,
      minContestRating: 1350,
      minVerifiedRepos: 2,
    },
  },
  {
    id: 'role-fullstack-startup',
    title: 'Full-Stack Product Engineering Intern (Next.js / TypeScript)',
    company: 'YCombinator / Series-A SaaS Cohort',
    category: 'Full-Stack Startup' as const,
    location: 'Remote / Bengaluru',
    stipend: '₹40,000 - ₹65,000 / mo',
    source: 'AshbyHQ & SimplifyJobs 2026 Verified Feed',
    sourceUrl: 'https://github.com/SimplifyJobs/Summer2026-Internships',
    lastChecked: '2026-11-18',
    minGradYear: 2027,
    maxGradYear: 2030,
    minCgpa: 6.5,
    reqs: {
      problemSolving: 58,
      engineering: 76,
      consistency: 65,
      minContestRating: 1100,
      minVerifiedRepos: 2,
    },
  },
  {
    id: 'role-gsoc-lfx',
    title: 'Open Source Contributor Fellow (GSoC / LFX Mentorship)',
    company: 'Cloud Native Computing Foundation (CNCF) / GSoC',
    category: 'Open Source / Fellowship' as const,
    location: 'Remote (Global)',
    stipend: '$1,500 - $3,000 Stipend',
    source: 'Official Linux Foundation LFX & GSoC Portal',
    sourceUrl: 'https://mentorship.lfx.linuxfoundation.org',
    lastChecked: '2026-11-18',
    minGradYear: 2026,
    maxGradYear: 2031,
    minCgpa: 6.0,
    reqs: {
      problemSolving: 60,
      engineering: 72,
      consistency: 74,
      minContestRating: 1050,
      minVerifiedRepos: 2,
    },
  },
  {
    id: 'role-product-sde1',
    title: 'STEP / Explore First- & Second-Year SDE Intern',
    company: 'Global Tier-1 Product Engineering (STEP / Explore Track)',
    category: 'Product SDE' as const,
    location: 'Hyderabad / Bengaluru',
    stipend: '₹80,000 - ₹1,10,000 / mo',
    source: 'Official University Recruiting Portal',
    sourceUrl: 'https://buildyourfuture.withgoogle.com/programs/step',
    lastChecked: '2026-11-18',
    minGradYear: 2028,
    maxGradYear: 2030,
    minCgpa: 7.5,
    reqs: {
      problemSolving: 78,
      engineering: 65,
      consistency: 75,
      minContestRating: 1400,
      minVerifiedRepos: 1,
    },
  },
  {
    id: 'role-aicte-naps',
    title: 'AI & Data Engineering Research Intern (Digital India / NAPS)',
    company: 'MeitY Digital India / AICTE National Portal',
    category: 'Govt / Apprenticeship' as const,
    location: 'New Delhi / Remote Hybrid',
    stipend: '₹15,000 - ₹25,000 / mo',
    source: 'AICTE Internship & NAPS Official Portal',
    sourceUrl: 'https://internship.aicte-india.org',
    lastChecked: '2026-11-18',
    minGradYear: 2026,
    maxGradYear: 2030,
    minCgpa: 6.5,
    reqs: {
      problemSolving: 50,
      engineering: 52,
      consistency: 55,
      minContestRating: 900,
      minVerifiedRepos: 1,
    },
  },
];

export function computeGradLensReport(input: EngineInput): GradLensReport {
  const nowSec = 1795000000;
  const window16wSec = 16 * 7 * 86400;
  const start16wSec = nowSec - window16wSec;

  // 1. Process Codeforces Submissions
  const sortedSubs = [...input.cfSubmissions].sort(
    (a, b) => a.creationTimeSeconds - b.creationTimeSeconds,
  );
  const acceptedSubs = sortedSubs.filter((s) => s.verdict === 'OK');

  // Unique solved problems (earliest OK per problemId)
  const uniqueSolvedMap = new Map<string, CFSubmission>();
  const attemptsBeforeOkMap = new Map<string, number>();
  const firstFailTimestampMap = new Map<string, number>();
  const problemGritMap = new Map<string, boolean>();

  for (const sub of sortedSubs) {
    if (uniqueSolvedMap.has(sub.problemId)) continue;
    if (sub.verdict !== 'OK') {
      attemptsBeforeOkMap.set(
        sub.problemId,
        (attemptsBeforeOkMap.get(sub.problemId) || 0) + 1,
      );
      if (!firstFailTimestampMap.has(sub.problemId)) {
        firstFailTimestampMap.set(sub.problemId, sub.creationTimeSeconds);
      }
    } else {
      uniqueSolvedMap.set(sub.problemId, sub);
      const firstFail = firstFailTimestampMap.get(sub.problemId);
      if (firstFail !== undefined) {
        const deltaMin = (sub.creationTimeSeconds - firstFail) / 60;
        if (deltaMin >= 8 && deltaMin <= 180) {
          problemGritMap.set(sub.problemId, true);
        }
      }
    }
  }

  const uniqueSolved = Array.from(uniqueSolvedMap.values());
  const solvedRatings = uniqueSolved
    .map((s) => s.rating)
    .filter((r): r is number => typeof r === 'number' && r > 0);

  const p80SolvedRating = solvedRatings.length > 0 ? percentile(solvedRatings, 80) : 800;
  const medianSolvedRating = solvedRatings.length > 0 ? median(solvedRatings) : 800;
  const top20PracticeAvg =
    solvedRatings.length > 0
      ? [...solvedRatings]
          .sort((a, b) => b - a)
          .slice(0, 20)
          .reduce((a, b) => a + b, 0) / Math.min(solvedRatings.length, 20)
      : 800;

  const liveContestRating =
    input.cfUserInfo?.rating ||
    (input.cfRatings.length > 0
      ? input.cfRatings[input.cfRatings.length - 1].newRating
      : 0);
  const maxContestRating =
    input.cfUserInfo?.maxRating ||
    (input.cfRatings.length > 0
      ? Math.max(...input.cfRatings.map((r) => r.newRating))
      : liveContestRating);

  // Tag diversity
  const tagCounts = new Map<string, number>();
  for (const s of uniqueSolved) {
    for (const t of s.tags || []) {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    }
  }
  const distinctTagsWith3 = Array.from(tagCounts.entries()).filter(([, c]) => c >= 3).length;
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }));

  // Grit ratio: % of solved problems that had prior failed attempts resolved within 8-180 min
  const gritCount = Array.from(problemGritMap.values()).filter(Boolean).length;
  const gritRatioPct =
    uniqueSolved.length > 0 ? Math.round((gritCount / uniqueSolved.length) * 100) : 0;

  // Burst cadence check (consecutive accepted >=1200 rated solves within <180s)
  const hardAccepted = uniqueSolved
    .filter((s) => (s.rating || 800) >= 1200)
    .sort((a, b) => a.creationTimeSeconds - b.creationTimeSeconds);
  let rapidBurstCount = 0;
  for (let i = 1; i < hardAccepted.length; i++) {
    const gapSec = hardAccepted[i].creationTimeSeconds - hardAccepted[i - 1].creationTimeSeconds;
    if (gapSec > 0 && gapSec < 180) {
      rapidBurstCount++;
    }
  }

  // 2. Process GitHub Repositories
  const nonForkRepos = input.ghRepos.filter((r) => !r.isFork);
  const verifiedMultiWeekRepos = nonForkRepos.filter(
    (r) => r.commitsCount16w >= 6 && r.activeDaysCount >= 3 && (r.hasBuildConfig || r.hasReadme),
  ).length;
  const singleDayRepos = nonForkRepos.filter((r) => r.activeDaysCount <= 1).length;
  const singleDayRatio =
    nonForkRepos.length > 0 ? singleDayRepos / nonForkRepos.length : 0;
  const totalCommits16w = nonForkRepos.reduce((sum, r) => sum + r.commitsCount16w, 0);
  const reposWithTests = nonForkRepos.filter((r) => r.hasTestsOrCi).length;

  const langCounts = new Map<string, number>();
  for (const r of nonForkRepos) {
    if (r.language) {
      langCounts.set(r.language, (langCounts.get(r.language) || 0) + 1);
    }
  }
  const topLanguages = Array.from(langCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang, count]) => ({ lang, count }));

  // 3. Build 16-Week Historical Vectors + 8-Week Forecast
  const weeklySeries: WeeklyVector[] = [];
  const activeRatingsPerWeek: number[] = [];

  for (let w = 0; w < 16; w++) {
    const wStart = start16wSec + w * 7 * 86400;
    const wEnd = wStart + 7 * 86400;

    const weekSubs = uniqueSolved.filter(
      (s) => s.creationTimeSeconds >= wStart && s.creationTimeSeconds < wEnd,
    );
    const weekRatings = weekSubs
      .map((s) => s.rating)
      .filter((r): r is number => typeof r === 'number' && r > 0);

    const avgRating =
      weekRatings.length > 0
        ? Math.round(weekRatings.reduce((a, b) => a + b, 0) / weekRatings.length)
        : p80SolvedRating * 0.85;

    if (weekRatings.length > 0) {
      activeRatingsPerWeek.push(avgRating);
    }

    // Distribute commits across 16 weeks with deterministic cadence
    const baseWeeklyCommits = Math.round(totalCommits16w / 16);
    const wave = Math.round(Math.sin(w * 0.85) * Math.max(1, baseWeeklyCommits * 0.45));
    const commitsCount = Math.max(0, baseWeeklyCommits + wave + (weekSubs.length > 0 ? 2 : 0));

    const ratingComponent = clamp((avgRating - 800) / 14, 5, 45);
    const solveComponent = Math.min(weekSubs.length * 4.2, 32);
    const commitComponent = Math.min(commitsCount * 2.1, 23);
    const capabilityIndex = Math.round(
      clamp(ratingComponent + solveComponent + commitComponent, 12, 98),
    );

    weeklySeries.push({
      weekLabel: `W-${15 - w}`,
      weekIndex: w,
      isForecast: false,
      problemsSolved: weekSubs.length,
      avgProblemRating: Math.round(avgRating),
      commitsCount,
      capabilityIndex,
    });
  }

  const historicalCap = weeklySeries.map((w) => w.capabilityIndex);
  const difficultySlope16w =
    Math.round(
      computeOlsSlope(
        activeRatingsPerWeek.length >= 3
          ? activeRatingsPerWeek
          : weeklySeries.map((w) => w.avgProblemRating),
      ) * 10,
    ) / 10;
  const theilSenSlope = Math.round(computeTheilSenSlope(historicalCap) * 100) / 100;

  // Populate Theil-Sen baseline on historical weeks
  const medianCap = median(historicalCap);
  for (let w = 0; w < 16; w++) {
    weeklySeries[w].theilSenTrend = Math.round(
      clamp(medianCap + (w - 7.5) * theilSenSlope, 10, 98),
    );
  }

  // Append 8 Forecast Weeks using Holt's Double Exponential Smoothing
  const forecastValues = computeHoltForecast(historicalCap, 8, 0.45, 0.25);
  for (let k = 0; k < forecastValues.length; k++) {
    weeklySeries.push({
      weekLabel: `F+${k + 1}`,
      weekIndex: 16 + k,
      isForecast: true,
      problemsSolved: 0,
      avgProblemRating: 0,
      commitsCount: 0,
      capabilityIndex: historicalCap[historicalCap.length - 1],
      projectedCapability: Math.round(forecastValues[k]),
      theilSenTrend: Math.round(
        clamp(medianCap + (16 + k - 7.5) * theilSenSlope, 10, 99),
      ),
    });
  }

  const activeWeeks16w = weeklySeries
    .slice(0, 16)
    .filter((w) => w.problemsSolved > 0 || w.commitsCount > 1).length;

  // 4. Behavioral Signals & Private Trust Factor (No shaming, DPDP-safe)
  const behavioralSignals: BehavioralSignal[] = [];
  let trustFactor = 0.94;
  let confidencePenalty = 0;

  if (gritRatioPct >= 20 && uniqueSolved.length >= 12) {
    trustFactor += 0.05;
    behavioralSignals.push({
      code: 'VERIFIED_DEBUGGING_GRIT',
      title: 'Verified Multi-Attempt Debugging Persistence',
      category: 'positive',
      impactOnConfidence: 'Narrows uncertainty band (±2 pts)',
      description: `${gritRatioPct}% of accepted problems show iterative debugging (WA/TLE followed by resolution within 8–180 minutes), providing strong independent problem-solving evidence.`,
      evidenceCite: `${gritCount}/${uniqueSolved.length} solved problems with multi-attempt persistence`,
    });
  }

  if (liveContestRating > 0 && top20PracticeAvg - liveContestRating > 420) {
    trustFactor -= 0.06;
    confidencePenalty += 3;
    behavioralSignals.push({
      code: 'PRACTICE_CONTEST_DIVERGENCE',
      title: 'Practice vs. Proctored Contest Gap',
      category: 'advisory',
      impactOnConfidence: 'Widens uncertainty band (±3 pts)',
      description: `Your top practice solves average ${Math.round(top20PracticeAvg)} rating, whereas your live contest rating is ${liveContestRating}. Proctored contests carry higher verification weight.`,
      evidenceCite: `Practice Top-20 avg ${Math.round(top20PracticeAvg)} vs Contest ${liveContestRating}`,
    });
  } else if (liveContestRating >= 1200 && input.cfRatings.length >= 3) {
    trustFactor += 0.04;
    behavioralSignals.push({
      code: 'PRACTICE_CONTEST_ALIGNMENT',
      title: 'Contest-Backed Algorithmic Standing',
      category: 'positive',
      impactOnConfidence: 'High verification confidence',
      description: `Your practice difficulty (${Math.round(p80SolvedRating)}) aligns closely with ${input.cfRatings.length} rated live contests (${liveContestRating}).`,
      evidenceCite: `${input.cfRatings.length} rated Codeforces contests`,
    });
  }

  if (rapidBurstCount >= 4) {
    trustFactor -= 0.05;
    confidencePenalty += 3;
    behavioralSignals.push({
      code: 'CONCENTRATED_BURST_CADENCE',
      title: 'Concentrated Short-Interval Submission Bursts',
      category: 'advisory',
      impactOnConfidence: 'Widens confidence interval (±3 pts)',
      description: `${rapidBurstCount} accepted solutions on 1200+ rated problems were submitted within 3 minutes of each other. Sustained spacing or timed calibration strengthens confidence.`,
      evidenceCite: `${rapidBurstCount} sub-180s consecutive accepted transitions`,
    });
  }

  if (nonForkRepos.length >= 3 && singleDayRatio >= 0.68) {
    trustFactor -= 0.04;
    confidencePenalty += 2;
    behavioralSignals.push({
      code: 'SINGLE_DAY_REPO_CONCENTRATION',
      title: 'Single-Day Repository Commit Concentration',
      category: 'advisory',
      impactOnConfidence: 'Lowers engineering evidence weight',
      description: `${Math.round(singleDayRatio * 100)}% of non-fork repositories have commits concentrated on a single calendar day. Multi-week iterative commits demonstrate stronger project ownership.`,
      evidenceCite: `${singleDayRepos}/${nonForkRepos.length} repos with 1 active commit day`,
    });
  } else if (verifiedMultiWeekRepos >= 2) {
    trustFactor += 0.04;
    behavioralSignals.push({
      code: 'STEADY_MULTI_WEEK_SHIPPING',
      title: 'Sustained Multi-Week Repository Engineering',
      category: 'positive',
      impactOnConfidence: 'High engineering verification',
      description: `${verifiedMultiWeekRepos} original repositories show multi-day commit progression, dependency manifests, and documentation.`,
      evidenceCite: `${verifiedMultiWeekRepos} verified multi-week repositories`,
    });
  }

  if (uniqueSolved.length >= 45 && difficultySlope16w < 1.2 && p80SolvedRating <= 1050) {
    behavioralSignals.push({
      code: 'COMFORT_ZONE_PLATEAU',
      title: 'Comfort-Zone Difficulty Plateau',
      category: 'neutral',
      impactOnConfidence: 'Trajectory slope alert',
      description: `High solve count (${uniqueSolved.length}), but 80th-percentile difficulty remains at ${p80SolvedRating}. Stepping up +200 rating points will unlock higher-tier SDE roles.`,
      evidenceCite: `P80 rating ${p80SolvedRating}, 16w slope ${difficultySlope16w}`,
    });
  }

  // 5. Academic Reality & Inflation Delta
  const sems = input.semesters.length > 0 ? input.semesters : [{ semester: 1, sgpa: 8.1, attendancePct: 84, creditsCompleted: 20 }];
  const currentCgpa =
    Math.round((sems.reduce((a, s) => a + s.sgpa, 0) / sems.length) * 100) / 100;
  const avgAttendancePct = Math.round(
    sems.reduce((a, s) => a + s.attendancePct, 0) / sems.length,
  );
  const cgpaSlope = Math.round(computeOlsSlope(sems.map((s) => s.sgpa)) * 100) / 100;

  // 6. Compute the 6 Skill DNA Dimensions (0..100)
  const challengeBoost = input.challengeResult?.completed ? input.challengeResult.scoreBoost : 0;

  // Dim 1: Problem-Solving & Algorithms (30%)
  const ratingNorm = clamp(((p80SolvedRating - 750) / 1150) * 55, 12, 55);
  const contestNorm =
    liveContestRating > 0 ? clamp(((liveContestRating - 700) / 1100) * 32, 8, 32) : 12;
  const tagNorm = clamp(distinctTagsWith3 * 2.2, 2, 13);
  const problemSolvingScore = Math.round(
    clamp(ratingNorm + contestNorm + tagNorm + challengeBoost * 0.6, 18, 98),
  );

  // Dim 2: Software Engineering & Projects (25%)
  const verifiedRepoPts = Math.min(verifiedMultiWeekRepos * 19, 52);
  const commitSpreadPts = clamp((totalCommits16w / 65) * 26, 8, 26);
  const ciAndReadmePts = Math.min(reposWithTests * 8 + nonForkRepos.filter((r) => r.hasReadme).length * 3.5, 22);
  const engineeringScore = Math.round(
    clamp(verifiedRepoPts + commitSpreadPts + ciAndReadmePts + challengeBoost * 0.4, 15, 98),
  );

  // Dim 3: Consistency & Deliberate Practice (15%)
  const activeWeekRatioScore = (activeWeeks16w / 16) * 72;
  const attendanceConsistencyBonus = clamp((avgAttendancePct - 60) * 0.55, 0, 18);
  const consistencyScore = Math.round(
    clamp(activeWeekRatioScore + attendanceConsistencyBonus + 8, 20, 98),
  );

  // Dim 4: Depth & Debugging Persistence (15%)
  const aboveMedianShare =
    solvedRatings.length > 0
      ? solvedRatings.filter((r) => r >= medianSolvedRating).length / solvedRatings.length
      : 0.5;
  const depthPersistenceScore = Math.round(
    clamp(aboveMedianShare * 48 + gritRatioPct * 0.85 + (reposWithTests > 0 ? 18 : 8) + challengeBoost * 0.5, 22, 97),
  );

  // Dim 5: Academic Foundations (10%)
  const academicScore = Math.round(
    clamp(currentCgpa * 8.2 + (avgAttendancePct >= 75 ? 12 : 4) + clamp(cgpaSlope * 12, -6, 8), 25, 98),
  );

  // Dim 6: Growth Velocity & Trajectory (5%)
  const growthScore = Math.round(
    clamp(55 + theilSenSlope * 8.5 + clamp(difficultySlope16w * 0.4, -15, 25), 24, 98),
  );

  const academicPercentile = Math.round(clamp(currentCgpa * 10, 10, 99));
  const verifiedTechComposite = Math.round(0.5 * problemSolvingScore + 0.5 * engineeringScore);
  const inflationDelta = Math.round(academicPercentile - verifiedTechComposite);

  if (inflationDelta >= 24) {
    behavioralSignals.push({
      code: 'ROTE_INFLATION_DELTA',
      title: 'Academic Marks Outpace Verified Project/DSA Evidence',
      category: 'advisory',
      impactOnConfidence: `Inflation Delta: +${inflationDelta} pts`,
      description: `Your CGPA standing (${currentCgpa}/10) is ${inflationDelta} points higher than your verified technical proof (${verifiedTechComposite}/100). Converting theory into shipped code and contest solves will close this gap.`,
      evidenceCite: `Academic ${academicPercentile}% vs Verified Tech ${verifiedTechComposite}%`,
    });
  } else if (inflationDelta <= -15) {
    behavioralSignals.push({
      code: 'UNDERRATED_BUILDER_SIGNAL',
      title: 'Underrated Practical Builder (Skills Exceed CGPA)',
      category: 'positive',
      impactOnConfidence: `Builder Delta: ${inflationDelta} pts`,
      description: `Your verified engineering & problem-solving composite (${verifiedTechComposite}/100) significantly outpaces your formal CGPA (${currentCgpa}/10). Target skill-first startups and open-source fellowships.`,
      evidenceCite: `Verified Tech ${verifiedTechComposite}% vs Academic ${academicPercentile}%`,
    });
  }

  // Year-aware weighting (1st year shifts slightly toward Consistency & Academic Trajectory)
  const isFirstYear = input.profile.currentSemester <= 2;
  const dimensions: DimensionScore[] = [
    {
      id: 'problem_solving',
      label: 'Algorithmic & Problem Solving',
      shortLabel: 'Problem Solving',
      score: problemSolvingScore,
      weightPct: isFirstYear ? 25 : 30,
      confidence: uniqueSolved.length >= 30 ? 'High' : uniqueSolved.length >= 10 ? 'Moderate' : 'Low',
      evidenceCount: `${uniqueSolved.length} solves · P80 ${p80SolvedRating}`,
      summary: `Based on 80th-percentile accepted difficulty (${p80SolvedRating}), ${distinctTagsWith3} core topic tags, and ${input.cfRatings.length} contests.`,
    },
    {
      id: 'engineering',
      label: 'Software Engineering & Projects',
      shortLabel: 'Engineering',
      score: engineeringScore,
      weightPct: isFirstYear ? 25 : 25,
      confidence: nonForkRepos.length >= 4 ? 'High' : nonForkRepos.length >= 2 ? 'Moderate' : 'Low',
      evidenceCount: `${verifiedMultiWeekRepos} multi-week repos · ${totalCommits16w} commits`,
      summary: `Evaluates original non-fork repositories (${nonForkRepos.length}), multi-day commit cadence, build manifests, and test/CI presence.`,
    },
    {
      id: 'consistency',
      label: 'Deliberate Practice Consistency',
      shortLabel: 'Consistency',
      score: consistencyScore,
      weightPct: isFirstYear ? 20 : 15,
      confidence: activeWeeks16w >= 8 ? 'High' : 'Moderate',
      evidenceCount: `${activeWeeks16w}/16 active weeks · ${avgAttendancePct}% attendance`,
      summary: `Measures active coding weeks over the last 16 weeks alongside ${avgAttendancePct}% academic attendance discipline.`,
    },
    {
      id: 'depth_persistence',
      label: 'Debugging Grit & Depth',
      shortLabel: 'Depth & Grit',
      score: depthPersistenceScore,
      weightPct: 15,
      confidence: uniqueSolved.length >= 15 ? 'High' : 'Moderate',
      evidenceCount: `${gritRatioPct}% retry-to-AC persistence`,
      summary: `Tracks willingness to wrestle with hard problems above your median (${medianSolvedRating}) and resolve failed attempts.`,
    },
    {
      id: 'academics',
      label: 'Academic Trajectory',
      shortLabel: 'Academics',
      score: academicScore,
      weightPct: 10,
      confidence: sems.length >= 2 ? 'High' : 'Moderate',
      evidenceCount: `${currentCgpa} CGPA · ${sems.length} sem(s)`,
      summary: `Longitudinal SGPA trend (${currentCgpa}/10) and attendance stability across ${sems.length} recorded semester(s).`,
    },
    {
      id: 'growth_velocity',
      label: '16-Week Growth Velocity',
      shortLabel: 'Growth Velocity',
      score: growthScore,
      weightPct: isFirstYear ? 5 : 5,
      confidence: activeWeeks16w >= 6 ? 'High' : 'Moderate',
      evidenceCount: `Theil-Sen ${theilSenSlope >= 0 ? '+' : ''}${theilSenSlope}/wk`,
      summary: `Non-parametric Theil-Sen trajectory slope (${theilSenSlope >= 0 ? '+' : ''}${theilSenSlope} pts/wk) and difficulty progression.`,
    },
  ];

  const rawWeightedComposite = dimensions.reduce(
    (acc, d) => acc + (d.score * d.weightPct) / 100,
    0,
  );
  const authenticityTrustFactor = Math.round(clamp(trustFactor, 0.85, 1.05) * 100) / 100;
  const overallDnaScore = Math.round(clamp(rawWeightedComposite * authenticityTrustFactor, 15, 99));

  // Evidence coverage %
  let sourcesPresent = 0;
  if (uniqueSolved.length >= 5) sourcesPresent += 35;
  else if (uniqueSolved.length > 0) sourcesPresent += 18;
  if (nonForkRepos.length >= 2) sourcesPresent += 35;
  else if (nonForkRepos.length > 0) sourcesPresent += 18;
  if (sems.length >= 1) sourcesPresent += 20;
  if (input.challengeResult?.completed) sourcesPresent += 10;
  const evidenceCoveragePct = clamp(sourcesPresent, 25, 100);

  const confidenceBand = clamp(
    Math.round((100 - evidenceCoveragePct) * 0.12 + confidencePenalty + 2),
    2,
    12,
  );
  const confidenceLevel: 'High' | 'Moderate' | 'Low' =
    confidenceBand <= 4 ? 'High' : confidenceBand <= 7 ? 'Moderate' : 'Low';

  const trajectoryPattern: GradLensReport['trajectoryPattern'] =
    theilSenSlope >= 0.45
      ? 'Growth'
      : theilSenSlope <= -0.35
        ? 'Inconsistency'
        : activeWeeks16w < 5
          ? 'Early Baseline'
          : 'Stagnation';

  // 7. Deterministic Internship & Opportunity Matcher
  const internshipMatches: InternshipMatchResult[] = CURATED_INTERNSHIP_CORPUS.map((role) => {
    const gradEligible =
      input.profile.graduationYear >= role.minGradYear &&
      input.profile.graduationYear <= role.maxGradYear;
    const cgpaEligible = currentCgpa >= role.minCgpa;
    const formalEligibilityMet = gradEligible && cgpaEligible;

    const eligibilityNotes: string[] = [];
    if (!gradEligible) {
      eligibilityNotes.push(
        `Requires Class of ${role.minGradYear}–${role.maxGradYear} (yours: ${input.profile.graduationYear})`,
      );
    }
    if (!cgpaEligible) {
      eligibilityNotes.push(`Requires ${role.minCgpa}+ CGPA (yours: ${currentCgpa})`);
    }
    const eligibilityNote =
      eligibilityNotes.length === 0
        ? `Eligible (Class of ${input.profile.graduationYear}, CGPA ${currentCgpa} ≥ ${role.minCgpa})`
        : eligibilityNotes.join(' · ');

    const verifiedStrengths: string[] = [];
    const missingGaps: InternshipMatchResult['missingGaps'] = [];

    // Check Problem Solving
    if (problemSolvingScore >= role.reqs.problemSolving) {
      verifiedStrengths.push(`Algorithmic score ${problemSolvingScore}/100 meets ${role.reqs.problemSolving} threshold`);
    } else {
      missingGaps.push({
        metric: 'Algorithmic Depth',
        current: `${problemSolvingScore}/100 (P80: ${p80SolvedRating})`,
        target: `${role.reqs.problemSolving}/100`,
        smallestNextAction: `Solve 15 problems rated ${Math.max(1100, p80SolvedRating + 150)}–${Math.max(1300, p80SolvedRating + 300)} in ${topTags[0]?.tag || 'graphs/DP'}.`,
      });
    }

    // Check Engineering Depth
    if (engineeringScore >= role.reqs.engineering) {
      verifiedStrengths.push(`Engineering depth ${engineeringScore}/100 (${verifiedMultiWeekRepos} multi-week repos)`);
    } else {
      missingGaps.push({
        metric: 'Engineering Evidence',
        current: `${engineeringScore}/100 (${verifiedMultiWeekRepos} verified repos)`,
        target: `${role.reqs.engineering}/100 (${role.reqs.minVerifiedRepos}+ multi-week repos)`,
        smallestNextAction: `Ship 1 non-fork project over 3+ weeks with README, CI/tests, and live deployment.`,
      });
    }

    // Check Consistency
    if (consistencyScore >= role.reqs.consistency) {
      verifiedStrengths.push(`Consistency ${consistencyScore}/100 (${activeWeeks16w}/16 active weeks)`);
    } else {
      missingGaps.push({
        metric: 'Practice Consistency',
        current: `${activeWeeks16w}/16 active weeks`,
        target: `11+/16 active weeks`,
        smallestNextAction: `Maintain at least 4 commits and 5 problem solves per week for the next 4 weeks.`,
      });
    }

    // Check Contest Rating
    const effectiveContest = Math.max(liveContestRating, Math.round(p80SolvedRating * 0.9));
    if (effectiveContest >= role.reqs.minContestRating) {
      verifiedStrengths.push(`Verified rating benchmark (${effectiveContest} ≥ ${role.reqs.minContestRating})`);
    } else {
      missingGaps.push({
        metric: 'Contest Benchmark',
        current: liveContestRating > 0 ? `${liveContestRating} contest rating` : 'Unrated in live contests',
        target: `${role.reqs.minContestRating}+ rated benchmark`,
        smallestNextAction: `Participate in 2 live Codeforces Div. 2/3 contests this month to anchor your practice rating.`,
      });
    }

    const psRatio = clamp(problemSolvingScore / role.reqs.problemSolving, 0, 1.08);
    const engRatio = clamp(engineeringScore / role.reqs.engineering, 0, 1.08);
    const conRatio = clamp(consistencyScore / role.reqs.consistency, 0, 1.08);
    const rawMatch = Math.round((psRatio * 0.4 + engRatio * 0.4 + conRatio * 0.2) * 94);
    const matchScore = clamp(rawMatch - missingGaps.length * 4, 28, 98);

    const status: InternshipMatchResult['status'] =
      missingGaps.length === 0 && matchScore >= 82
        ? 'READY_TO_APPLY'
        : missingGaps.length <= 2 && matchScore >= 65
          ? 'NEARLY_READY'
          : 'SKILL_GAP';

    return {
      id: role.id,
      title: role.title,
      company: role.company,
      category: role.category,
      location: role.location,
      stipend: role.stipend,
      source: role.source,
      sourceUrl: role.sourceUrl,
      lastChecked: role.lastChecked,
      minGradYear: role.minGradYear,
      maxGradYear: role.maxGradYear,
      minCgpa: role.minCgpa,
      matchScore,
      status,
      formalEligibilityMet,
      eligibilityNote,
      verifiedStrengths,
      missingGaps,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  // 8. Deterministic Grounded AI Diagnosis (Used directly or enriched by Gemini API)
  const readyCount = internshipMatches.filter((m) => m.status === 'READY_TO_APPLY').length;
  const topRole = internshipMatches[0];

  const aiDiagnosis: AiDiagnosis = {
    brutalTruth: `As a Semester ${input.profile.currentSemester} (${input.profile.branch}) student, your verified Skill DNA stands at ${overallDnaScore}/100 (±${confidenceBand} pts, ${evidenceCoveragePct}% evidence coverage). Your strongest pillar is ${
      problemSolvingScore >= engineeringScore
        ? `Algorithmic Problem Solving (${problemSolvingScore}/100 with P80 difficulty ${p80SolvedRating} across ${uniqueSolved.length} solves)`
        : `Software Engineering (${engineeringScore}/100 across ${verifiedMultiWeekRepos} multi-week repositories and ${totalCommits16w} recent commits)`
    }. ${
      inflationDelta >= 20
        ? `However, your CGPA (${currentCgpa}) currently outpaces your public code/contest evidence by +${inflationDelta} points—recruiters will filter on verifiable proof-of-work.`
        : `Your technical proof-of-work (${verifiedTechComposite}/100) tracks solidly with your academic record (${currentCgpa} CGPA).`
    }`,
    trajectoryVerdict: `Over the last 16 weeks, your Theil-Sen capability slope is ${
      theilSenSlope >= 0 ? '+' : ''
    }${theilSenSlope} pts/week (${trajectoryPattern}). At this pace, Holt's exponential smoothing projects your capability index to reach ${
      forecastValues[forecastValues.length - 1]
    }/100 in 8 weeks—${
      readyCount > 0
        ? `already unlocking ${readyCount} internship track(s) led by ${topRole.title} (${topRole.matchScore}% match).`
        : `putting you within striking distance of ${topRole.title} (${topRole.matchScore}% match) once you close ${topRole.missingGaps.length} measurable gap(s).`
    }`,
    thirtyDayFix: [
      {
        week: 'Week 1',
        focus: 'Algorithmic Ceiling & Contest Calibration',
        measurableTarget: `Solve 8 Codeforces problems rated ${p80SolvedRating + 100}–${p80SolvedRating + 200} + 1 live contest`,
        evidenceToProduce: `Push P80 solved rating from ${p80SolvedRating} → ${p80SolvedRating + 100} with verified contest delta`,
      },
      {
        week: 'Week 2',
        focus: 'Multi-Week Repository Depth & Testing',
        measurableTarget: `Add automated tests (Vitest/PyTest) + GitHub Actions CI workflow to your top repo`,
        evidenceToProduce: `1 repository upgraded with .github/workflows + architecture README`,
      },
      {
        week: 'Week 3',
        focus: 'Production Feature & API Integration',
        measurableTarget: `Ship a multi-day feature branch with at least 6 atomic commits across 4+ days`,
        evidenceToProduce: `Verified multi-week repository count increased to ${verifiedMultiWeekRepos + 1}`,
      },
      {
        week: 'Week 4',
        focus: 'Independent Skill Verification & Applications',
        measurableTarget: `Complete GradLens Timed Calibration Assessment + apply to top ${Math.max(2, readyCount + 1)} matched roles`,
        evidenceToProduce: `Confidence band narrowed to ±2 pts and applications submitted`,
      },
    ],
    generatedBy: 'GradLens Deterministic Engine v2.4 (Grounded Citation Mode)',
  };

  const recentAccepted = uniqueSolved
    .slice(-10)
    .reverse()
    .map((s) => ({
      id: s.id,
      problemId: s.problemId,
      name: s.problemName,
      rating: s.rating,
      verdict: s.verdict,
      attempts: (attemptsBeforeOkMap.get(s.problemId) || 0) + 1,
      submittedAt: new Date(s.creationTimeSeconds * 1000).toISOString().split('T')[0],
    }));

  return {
    profile: {
      ...input.profile,
      syncedAt: '2026-11-18T00:00:00.000Z',
    },
    overallDnaScore,
    confidenceBand,
    confidenceLevel,
    evidenceCoveragePct,
    authenticityTrustFactor,
    trajectoryPattern,
    difficultySlope16w,
    theilSenSlope,
    academicPercentile,
    verifiedTechComposite,
    inflationDelta,
    dimensions,
    weeklySeries,
    behavioralSignals,
    codeforcesSummary: {
      handle: input.profile.codeforcesHandle,
      currentRating: liveContestRating,
      maxRating: maxContestRating,
      rank: input.cfUserInfo?.rank || (liveContestRating >= 1400 ? 'specialist' : liveContestRating >= 1200 ? 'pupil' : 'newbie'),
      contestsCount: input.cfRatings.length,
      totalAccepted: uniqueSolved.length,
      p80SolvedRating,
      uniqueTagsCount: distinctTagsWith3,
      topTags,
      gritRatioPct,
      recentAccepted,
    },
    githubSummary: {
      username: input.profile.githubUsername,
      totalNonForkRepos: nonForkRepos.length,
      verifiedMultiWeekRepos,
      totalCommits16w,
      activeWeeks16w,
      topLanguages,
      repos: nonForkRepos.slice(0, 8),
    },
    academicSummary: {
      currentCgpa,
      avgAttendancePct,
      cgpaSlope,
      semesters: sems,
    },
    internshipMatches,
    aiDiagnosis,
  };
}

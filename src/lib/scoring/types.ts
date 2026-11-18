export interface SemesterRecord {
  semester: number; // 1..8
  sgpa: number; // 0..10
  attendancePct: number; // 0..100
  creditsCompleted: number;
  highlightSubject?: string;
}

export interface CFSubmission {
  id: number;
  problemId: string;
  problemName: string;
  rating: number | null;
  tags: string[];
  verdict: string;
  language: string;
  creationTimeSeconds: number;
  timeConsumedMillis: number;
  authorParticipantType?: string; // CONTESTANT, PRACTICE, etc.
}

export interface CFRatingChange {
  contestId: number;
  contestName: string;
  rank: number;
  oldRating: number;
  newRating: number;
  ratingUpdateTimeSeconds: number;
}

export interface GitHubRepoSummary {
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  isFork: boolean;
  updatedAt: string;
  createdAt: string;
  sizeKb: number;
  commitsCount16w: number;
  activeDaysCount: number;
  hasBuildConfig: boolean;
  hasTestsOrCi: boolean;
  hasReadme: boolean;
  htmlUrl: string;
}

export interface WeeklyVector {
  weekLabel: string; // e.g. "W-15" .. "W-0", and "F+1" .. "F+8"
  weekIndex: number; // 0..15 historical, 16..23 forecast
  isForecast: boolean;
  problemsSolved: number;
  avgProblemRating: number;
  commitsCount: number;
  capabilityIndex: number; // 0..100 historical
  projectedCapability?: number; // 0..100 forecast
  theilSenTrend?: number; // deterministic trend line
}

export interface BehavioralSignal {
  code:
    | 'VERIFIED_DEBUGGING_GRIT'
    | 'PRACTICE_CONTEST_ALIGNMENT'
    | 'PRACTICE_CONTEST_DIVERGENCE'
    | 'CONCENTRATED_BURST_CADENCE'
    | 'SINGLE_DAY_REPO_CONCENTRATION'
    | 'COMFORT_ZONE_PLATEAU'
    | 'STEADY_MULTI_WEEK_SHIPPING'
    | 'ROTE_INFLATION_DELTA'
    | 'UNDERRATED_BUILDER_SIGNAL';
  title: string;
  category: 'positive' | 'neutral' | 'advisory';
  impactOnConfidence: string;
  description: string;
  evidenceCite: string;
}

export interface DimensionScore {
  id:
    | 'problem_solving'
    | 'engineering'
    | 'consistency'
    | 'depth_persistence'
    | 'academics'
    | 'growth_velocity';
  label: string;
  shortLabel: string;
  score: number; // 0..100
  weightPct: number;
  confidence: 'High' | 'Moderate' | 'Low';
  evidenceCount: string;
  summary: string;
}

export interface InternshipMatchResult {
  id: string;
  title: string;
  company: string;
  category: 'Product SDE' | 'Full-Stack Startup' | 'Open Source / Fellowship' | 'Systems & AI' | 'Govt / Apprenticeship';
  location: string;
  stipend: string;
  source: string;
  sourceUrl: string;
  lastChecked: string;
  minGradYear: number;
  maxGradYear: number;
  minCgpa: number;
  matchScore: number; // 0..100
  status: 'READY_TO_APPLY' | 'NEARLY_READY' | 'SKILL_GAP';
  formalEligibilityMet: boolean;
  eligibilityNote: string;
  verifiedStrengths: string[];
  missingGaps: {
    metric: string;
    current: string;
    target: string;
    smallestNextAction: string;
  }[];
}

export interface AiDiagnosis {
  brutalTruth: string;
  trajectoryVerdict: string;
  thirtyDayFix: {
    week: string;
    focus: string;
    measurableTarget: string;
    evidenceToProduce: string;
  }[];
  generatedBy: string;
}

export interface IndependentChallengeResult {
  completed: boolean;
  challengeId: string;
  scoreBoost: number;
  timeTakenSec: number;
  verifiedAt?: string;
}

export interface GradLensReport {
  profile: {
    name: string;
    college: string;
    degree: string;
    branch: string;
    currentSemester: number;
    graduationYear: number;
    githubUsername: string;
    codeforcesHandle: string;
    syncedAt: string;
    isLiveSync: boolean;
  };
  overallDnaScore: number; // 0..100
  confidenceBand: number; // ± points (e.g. ±4)
  confidenceLevel: 'High' | 'Moderate' | 'Low';
  evidenceCoveragePct: number; // 0..100
  authenticityTrustFactor: number; // 0.85 .. 1.05
  trajectoryPattern: 'Growth' | 'Stagnation' | 'Inconsistency' | 'Early Baseline';
  difficultySlope16w: number;
  theilSenSlope: number;
  academicPercentile: number;
  verifiedTechComposite: number;
  inflationDelta: number;
  dimensions: DimensionScore[];
  weeklySeries: WeeklyVector[];
  behavioralSignals: BehavioralSignal[];
  codeforcesSummary: {
    handle: string;
    currentRating: number;
    maxRating: number;
    rank: string;
    contestsCount: number;
    totalAccepted: number;
    p80SolvedRating: number;
    uniqueTagsCount: number;
    topTags: { tag: string; count: number }[];
    gritRatioPct: number;
    recentAccepted: {
      id: number;
      problemId: string;
      name: string;
      rating: number | null;
      verdict: string;
      attempts: number;
      submittedAt: string;
    }[];
  };
  githubSummary: {
    username: string;
    totalNonForkRepos: number;
    verifiedMultiWeekRepos: number;
    totalCommits16w: number;
    activeWeeks16w: number;
    topLanguages: { lang: string; count: number }[];
    repos: GitHubRepoSummary[];
  };
  academicSummary: {
    currentCgpa: number;
    avgAttendancePct: number;
    cgpaSlope: number;
    semesters: SemesterRecord[];
  };
  internshipMatches: InternshipMatchResult[];
  aiDiagnosis: AiDiagnosis;
}

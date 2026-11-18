import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { computeGradLensReport } from '@/lib/scoring/engine';
import { getDefaultFirstYearCohortInput } from '@/lib/scoring/sampleData';
import {
  CFRatingChange,
  CFSubmission,
  GitHubRepoSummary,
  IndependentChallengeResult,
  SemesterRecord,
} from '@/lib/scoring/types';

async function fetchCodeforcesLive(handle: string): Promise<{
  userInfo?: { rating?: number; maxRating?: number; rank?: string };
  ratings: CFRatingChange[];
  submissions: CFSubmission[];
} | null> {
  if (!handle || !handle.trim()) return null;
  const cleanHandle = encodeURIComponent(handle.trim());
  try {
    const [infoRes, ratingRes, statusRes] = await Promise.all([
      fetch(`https://codeforces.com/api/user.info?handles=${cleanHandle}`, {
        next: { revalidate: 300 },
      }),
      fetch(`https://codeforces.com/api/user.rating?handle=${cleanHandle}`, {
        next: { revalidate: 300 },
      }),
      fetch(`https://codeforces.com/api/user.status?handle=${cleanHandle}&from=1&count=400`, {
        next: { revalidate: 300 },
      }),
    ]);

    if (!infoRes.ok || !statusRes.ok) return null;
    const infoJson = await infoRes.json();
    const statusJson = await statusRes.json();
    const ratingJson = ratingRes.ok ? await ratingRes.json() : { status: 'OK', result: [] };

    if (infoJson.status !== 'OK' || statusJson.status !== 'OK') return null;

    const userObj = infoJson.result?.[0] || {};
    const rawSubs = statusJson.result || [];
    const rawRatings = ratingJson.result || [];

    const submissions: CFSubmission[] = rawSubs.map((s: Record<string, unknown>) => {
      const prob = (s.problem || {}) as Record<string, unknown>;
      const author = (s.author || {}) as Record<string, unknown>;
      return {
        id: Number(s.id || 0),
        problemId: `${prob.contestId || ''}${prob.index || ''}`,
        problemName: String(prob.name || 'Problem'),
        rating: typeof prob.rating === 'number' ? prob.rating : null,
        tags: Array.isArray(prob.tags) ? (prob.tags as string[]) : [],
        verdict: String(s.verdict || 'UNKNOWN'),
        language: String(s.programmingLanguage || 'C++'),
        creationTimeSeconds: Number(s.creationTimeSeconds || 0),
        timeConsumedMillis: Number(s.timeConsumedMillis || 0),
        authorParticipantType: String(author.participantType || 'PRACTICE'),
      };
    });

    const ratings: CFRatingChange[] = rawRatings.map((r: Record<string, unknown>) => ({
      contestId: Number(r.contestId || 0),
      contestName: String(r.contestName || 'Codeforces Round'),
      rank: Number(r.rank || 0),
      oldRating: Number(r.oldRating || 0),
      newRating: Number(r.newRating || 0),
      ratingUpdateTimeSeconds: Number(r.ratingUpdateTimeSeconds || 0),
    }));

    return {
      userInfo: {
        rating: typeof userObj.rating === 'number' ? userObj.rating : undefined,
        maxRating: typeof userObj.maxRating === 'number' ? userObj.maxRating : undefined,
        rank: typeof userObj.rank === 'string' ? userObj.rank : undefined,
      },
      ratings,
      submissions,
    };
  } catch {
    return null;
  }
}

async function fetchGitHubLive(username: string): Promise<GitHubRepoSummary[] | null> {
  if (!username || !username.trim()) return null;
  const cleanUser = encodeURIComponent(username.trim());
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'GradLens-Career-Intelligence',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const reposRes = await fetch(
      `https://api.github.com/users/${cleanUser}/repos?per_page=12&sort=updated`,
      { headers, next: { revalidate: 300 } },
    );
    if (!reposRes.ok) return null;
    const rawRepos = await reposRes.json();
    if (!Array.isArray(rawRepos)) return null;

    const nonForks = rawRepos.filter((r: Record<string, unknown>) => !r.fork).slice(0, 8);
    const summaries: GitHubRepoSummary[] = await Promise.all(
      nonForks.map(async (r: Record<string, unknown>) => {
        const name = String(r.name || '');
        const fullName = String(r.full_name || `${cleanUser}/${name}`);
        let commitsCount16w = 8;
        let activeDaysCount = 3;

        try {
          const commitsRes = await fetch(
            `https://api.github.com/repos/${fullName}/commits?per_page=35`,
            { headers, next: { revalidate: 300 } },
          );
          if (commitsRes.ok) {
            const commitsJson = await commitsRes.json();
            if (Array.isArray(commitsJson)) {
              commitsCount16w = commitsJson.length;
              const days = new Set<string>();
              for (const c of commitsJson) {
                const dateStr = c?.commit?.author?.date;
                if (typeof dateStr === 'string') {
                  days.add(dateStr.slice(0, 10));
                }
              }
              activeDaysCount = Math.max(1, days.size);
            }
          }
        } catch {
          // fallback to conservative estimate if rate-limited
        }

        const sizeKb = Number(r.size || 250);
        return {
          name,
          fullName,
          description: typeof r.description === 'string' ? r.description : null,
          language: typeof r.language === 'string' ? r.language : 'TypeScript',
          stargazersCount: Number(r.stargazers_count || 0),
          forksCount: Number(r.forks_count || 0),
          isFork: Boolean(r.fork),
          updatedAt: String(r.updated_at || new Date().toISOString()),
          createdAt: String(r.created_at || new Date().toISOString()),
          sizeKb,
          commitsCount16w,
          activeDaysCount,
          hasBuildConfig: sizeKb > 80,
          hasTestsOrCi: sizeKb > 900 || commitsCount16w >= 18,
          hasReadme: sizeKb > 20,
          htmlUrl: String(r.html_url || `https://github.com/${fullName}`),
        };
      }),
    );

    return summaries.length > 0 ? summaries : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const defaultInput = getDefaultFirstYearCohortInput();

    const githubUsername =
      typeof body.githubUsername === 'string' && body.githubUsername.trim()
        ? body.githubUsername.trim()
        : defaultInput.profile.githubUsername;
    const codeforcesHandle =
      typeof body.codeforcesHandle === 'string' && body.codeforcesHandle.trim()
        ? body.codeforcesHandle.trim()
        : defaultInput.profile.codeforcesHandle;
    const name =
      typeof body.name === 'string' && body.name.trim()
        ? body.name.trim()
        : defaultInput.profile.name;
    const college =
      typeof body.college === 'string' && body.college.trim()
        ? body.college.trim()
        : defaultInput.profile.college;
    const currentSemester = Number(body.currentSemester) || defaultInput.profile.currentSemester;
    const graduationYear = Number(body.graduationYear) || defaultInput.profile.graduationYear;
    const semesters: SemesterRecord[] =
      Array.isArray(body.semesters) && body.semesters.length > 0
        ? body.semesters
        : defaultInput.semesters;
    const challengeResult: IndependentChallengeResult | undefined = body.challengeResult;

    const [cfLive, ghLive] = await Promise.all([
      fetchCodeforcesLive(codeforcesHandle),
      fetchGitHubLive(githubUsername),
    ]);

    const isLiveSync = Boolean(cfLive || ghLive);

    const report = computeGradLensReport({
      profile: {
        name,
        college,
        degree: 'B.Tech',
        branch: 'Computer Science & Engineering',
        currentSemester,
        graduationYear,
        githubUsername,
        codeforcesHandle,
        isLiveSync,
      },
      cfUserInfo: cfLive?.userInfo || defaultInput.cfUserInfo,
      cfRatings: cfLive && cfLive.ratings.length > 0 ? cfLive.ratings : defaultInput.cfRatings,
      cfSubmissions:
        cfLive && cfLive.submissions.length > 0 ? cfLive.submissions : defaultInput.cfSubmissions,
      ghRepos: ghLive && ghLive.length > 0 ? ghLive : defaultInput.ghRepos,
      semesters,
      challengeResult,
    });

    // Optional Gemini Synthesis enrichment if GEMINI_API_KEY is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        const res = await ai.models.generateContent({
          model: modelName,
          contents: `You are GradLens, an evidence-backed career intelligence engine for engineering students.
Never accuse a student of cheating. Cite only the exact numbers provided below.
Scorecard JSON:
${JSON.stringify({
  overallDnaScore: report.overallDnaScore,
  confidenceBand: report.confidenceBand,
  evidenceCoveragePct: report.evidenceCoveragePct,
  p80SolvedRating: report.codeforcesSummary.p80SolvedRating,
  totalAccepted: report.codeforcesSummary.totalAccepted,
  verifiedMultiWeekRepos: report.githubSummary.verifiedMultiWeekRepos,
  totalCommits16w: report.githubSummary.totalCommits16w,
  currentCgpa: report.academicSummary.currentCgpa,
  inflationDelta: report.inflationDelta,
  theilSenSlope: report.theilSenSlope,
})}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                brutalTruth: { type: Type.STRING },
                trajectoryVerdict: { type: Type.STRING },
              },
              required: ['brutalTruth', 'trajectoryVerdict'],
            },
          },
        });

        if (res.text) {
          const parsed = JSON.parse(res.text);
          if (parsed.brutalTruth && parsed.trajectoryVerdict) {
            report.aiDiagnosis.brutalTruth = parsed.brutalTruth;
            report.aiDiagnosis.trajectoryVerdict = parsed.trajectoryVerdict;
            report.aiDiagnosis.generatedBy = `Google Gemini (${modelName}) + Deterministic Rubric`;
          }
        }
      } catch {
        // Keep deterministic diagnosis fallback
      }
    }

    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to compute GradLens intelligence report', detail: String(err) },
      { status: 500 },
    );
  }
}

export async function GET() {
  const defaultInput = getDefaultFirstYearCohortInput();
  const report = computeGradLensReport(defaultInput);
  return NextResponse.json(report);
}

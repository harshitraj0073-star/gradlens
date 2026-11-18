import { EngineInput } from './engine';

export function getDefaultFirstYearCohortInput(): EngineInput {
  const nowSec = Math.floor(Date.now() / 1000);
  const daySec = 86400;

  // Generate realistic 16-week Codeforces submission history for a 1st-year CSE student (64 problems solved)
  const tagsPool = [
    ['implementation', 'math'],
    ['greedy', 'sortings'],
    ['binary search', 'two pointers'],
    ['dp', 'greedy'],
    ['graphs', 'dfs and similar'],
    ['data structures', 'trees'],
    ['strings', 'constructive algorithms'],
  ];

  const cfSubmissions: EngineInput['cfSubmissions'] = [];
  let subId = 290100100;

  for (let i = 0; i < 64; i++) {
    const weeksAgo = Math.floor((63 - i) / 4); // spread across 16 weeks
    const daysOffset = (i % 5) + 1;
    const solveTime = nowSec - weeksAgo * 7 * daySec - daysOffset * daySec;
    // Progressive difficulty from 800 in early weeks up to 1400-1600 in recent weeks
    const baseRating = 800 + Math.floor((i / 64) * 600) + ((i % 3) * 100);
    const rating = Math.min(1600, Math.round(baseRating / 100) * 100);
    const problemId = `${1850 + i}${['A', 'B', 'C', 'D'][i % 4]}`;
    const problemName = [
      'Balanced Subarray',
      'Telemetry Routing',
      'Lexicographical Grid',
      'Binary Tree Reconstruction',
      'Modular Congruence',
      'Optimal Partition',
      'Dynamic Latency Bounds',
      'Graph Reachability',
    ][i % 8];

    // Add realistic prior debugging attempt (WA/TLE 25 mins earlier) on ~38% of problems
    if (i % 3 === 0) {
      cfSubmissions.push({
        id: subId++,
        problemId,
        problemName,
        rating,
        tags: tagsPool[i % tagsPool.length],
        verdict: i % 6 === 0 ? 'TIME_LIMIT_EXCEEDED' : 'WRONG_ANSWER',
        language: 'C++20 (GCC 13-64)',
        creationTimeSeconds: solveTime - 24 * 60,
        timeConsumedMillis: 124,
        authorParticipantType: i % 5 === 0 ? 'CONTESTANT' : 'PRACTICE',
      });
    }

    cfSubmissions.push({
      id: subId++,
      problemId,
      problemName,
      rating,
      tags: tagsPool[i % tagsPool.length],
      verdict: 'OK',
      language: 'C++20 (GCC 13-64)',
      creationTimeSeconds: solveTime,
      timeConsumedMillis: 46 + (i % 9) * 15,
      authorParticipantType: i % 5 === 0 ? 'CONTESTANT' : 'PRACTICE',
    });
  }

  return {
    profile: {
      name: 'Harshit Raj',
      college: 'B.Tech CSE · 1st Year Cohort',
      degree: 'B.Tech',
      branch: 'Computer Science & Engineering',
      currentSemester: 2,
      graduationYear: 2029,
      githubUsername: 'harshitraj0073-star',
      codeforcesHandle: 'tourist',
      isLiveSync: false,
    },
    cfUserInfo: {
      rating: 1385,
      maxRating: 1420,
      rank: 'specialist',
    },
    cfRatings: [
      {
        contestId: 1990,
        contestName: 'Codeforces Round 960 (Div. 2)',
        rank: 3420,
        oldRating: 950,
        newRating: 1085,
        ratingUpdateTimeSeconds: nowSec - 90 * daySec,
      },
      {
        contestId: 2004,
        contestName: 'Educational Codeforces Round 169',
        rank: 2180,
        oldRating: 1085,
        newRating: 1210,
        ratingUpdateTimeSeconds: nowSec - 62 * daySec,
      },
      {
        contestId: 2014,
        contestName: 'Codeforces Round 974 (Div. 3)',
        rank: 1240,
        oldRating: 1210,
        newRating: 1315,
        ratingUpdateTimeSeconds: nowSec - 34 * daySec,
      },
      {
        contestId: 2025,
        contestName: 'Codeforces Round 981 (Div. 2)',
        rank: 980,
        oldRating: 1315,
        newRating: 1385,
        ratingUpdateTimeSeconds: nowSec - 9 * daySec,
      },
    ],
    cfSubmissions,
    ghRepos: [
      {
        name: 'RESQVANTA',
        fullName: 'harshitraj0073-star/RESQVANTA',
        description:
          'Societal Benefit Emergency Bridge — transforming multimodal panic into grounded safety protocols, 3D WGS84 geodesic Earth flyovers, and 1-click 112 telecom dispatch packets in <2s.',
        language: 'TypeScript',
        stargazersCount: 4,
        forksCount: 1,
        isFork: false,
        updatedAt: '2026-10-24T07:06:16Z',
        createdAt: '2026-10-02T10:12:00Z',
        sizeKb: 1840,
        commitsCount16w: 28,
        activeDaysCount: 9,
        hasBuildConfig: true,
        hasTestsOrCi: true,
        hasReadme: true,
        htmlUrl: 'https://github.com/harshitraj0073-star/RESQVANTA',
      },
      {
        name: 'AURAIS',
        fullName: 'harshitraj0073-star/AURAIS',
        description:
          'Autonomous Sentient Emotional Resilience & Distress Triage System. Features acoustic vocal biomarker analysis, 10 ambient canvas shader engines, multi-role clinical telemetries, and 4-7-8 haptic breathing therapy.',
        language: 'TypeScript',
        stargazersCount: 3,
        forksCount: 0,
        isFork: false,
        updatedAt: '2026-10-23T15:39:02Z',
        createdAt: '2026-09-28T14:20:00Z',
        sizeKb: 1420,
        commitsCount16w: 22,
        activeDaysCount: 7,
        hasBuildConfig: true,
        hasTestsOrCi: true,
        hasReadme: true,
        htmlUrl: 'https://github.com/harshitraj0073-star/AURAIS',
      },
      {
        name: 'CENSUS-2027',
        fullName: 'harshitraj0073-star/CENSUS-2027',
        description:
          'Official Digital Enumeration & Civic Portal prototype for Census 2027. Features multi-phase household mapping, 11-digit SE-ID generation, GIS boundary visualization, and offline-first form validation.',
        language: 'TypeScript',
        stargazersCount: 2,
        forksCount: 0,
        isFork: false,
        updatedAt: '2026-10-23T15:28:32Z',
        createdAt: '2026-10-05T09:00:00Z',
        sizeKb: 980,
        commitsCount16w: 16,
        activeDaysCount: 5,
        hasBuildConfig: true,
        hasTestsOrCi: false,
        hasReadme: true,
        htmlUrl: 'https://github.com/harshitraj0073-star/CENSUS-2027',
      },
      {
        name: 'urban-cafe',
        fullName: 'harshitraj0073-star/urban-cafe',
        description: 'Modern responsive web experience and ordering flow for Urban Cafe.',
        language: 'JavaScript',
        stargazersCount: 1,
        forksCount: 0,
        isFork: false,
        updatedAt: '2026-11-17T03:47:08Z',
        createdAt: '2026-11-10T08:00:00Z',
        sizeKb: 620,
        commitsCount16w: 11,
        activeDaysCount: 4,
        hasBuildConfig: true,
        hasTestsOrCi: false,
        hasReadme: true,
        htmlUrl: 'https://github.com/harshitraj0073-star/urban-cafe',
      },
    ],
    semesters: [
      {
        semester: 1,
        sgpa: 8.42,
        attendancePct: 86,
        creditsCompleted: 22,
        highlightSubject: 'Programming in C & Data Structures (A+)',
      },
      {
        semester: 2,
        sgpa: 8.76,
        attendancePct: 89,
        creditsCompleted: 24,
        highlightSubject: 'Object-Oriented Systems & Discrete Math (O)',
      },
    ],
  };
}

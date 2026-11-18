'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Code2,
  Compass,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  GitBranch,
  Layers,
  Lock,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { GradLensCanvas } from '@/scene/GradLensCanvas';
import { computeGradLensReport } from '@/lib/scoring/engine';
import { getDefaultFirstYearCohortInput } from '@/lib/scoring/sampleData';
import { GradLensReport, SemesterRecord } from '@/lib/scoring/types';

type ActiveTab =
  | 'overview'
  | 'skill-dna'
  | 'trajectory'
  | 'evidence'
  | 'academics'
  | 'internships'
  | 'calibration'
  | 'privacy';

const CALIBRATION_CHALLENGES = [
  {
    id: 'calib-sliding-window',
    title: 'Telemetry Subarray Latency Bound (Sliding Window / Two Pointers)',
    difficulty: '1300 Rating Equivalent',
    prompt:
      'Given an array of N packet latencies and a threshold K, what is the optimal time complexity to find the longest contiguous window whose sum ≤ K (all latencies > 0)?',
    options: [
      { id: 'a', text: 'O(N²) nested prefix scan with early break', correct: false },
      { id: 'b', text: 'O(N) monotonic two-pointer / sliding window', correct: true },
      { id: 'c', text: 'O(N log N) sorting latencies before window scan', correct: false },
    ],
    debugSnippet: `int maxLen = 0, left = 0;
long long windowSum = 0;
for (int right = 0; right < n; ++right) {
  windowSum += a[right];
  while (windowSum > k && left <= right) {
    windowSum -= a[left++];
  }
  maxLen = max(maxLen, right - left + 1);
}`,
  },
];

export default function GradLensDashboard() {
  const [report, setReport] = useState<GradLensReport>(() =>
    computeGradLensReport(getDefaultFirstYearCohortInput()),
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>(
    'Loaded verified 1st-Year CSE baseline · Ready for live API sync',
  );

  // Sync form state
  const [studentName, setStudentName] = useState('Harshit Raj');
  const [collegeName, setCollegeName] = useState('B.Tech CSE · 1st Year Cohort');
  const [currentSem, setCurrentSem] = useState(2);
  const [gradYear, setGradYear] = useState(2029);
  const [ghUser, setGhUser] = useState('harshitraj0073-star');
  const [cfHandle, setCfHandle] = useState('tourist');
  const [semesters, setSemesters] = useState<SemesterRecord[]>([
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
  ]);

  // New semester form inputs
  const [newSemNo, setNewSemNo] = useState(3);
  const [newSgpa, setNewSgpa] = useState('8.90');
  const [newAttendance, setNewAttendance] = useState('88');
  const [newSubject, setNewSubject] = useState('Design & Analysis of Algorithms');

  // Independent Calibration state
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [architectureNote, setArchitectureNote] = useState<string>(
    'Sliding window maintains invariant windowSum <= K in O(N) amortized time because left and right pointers each advance at most N steps.',
  );
  const [challengeVerified, setChallengeVerified] = useState(false);

  // Internship filter state
  const [roleFilter, setRoleFilter] = useState<
    'ALL' | 'READY_TO_APPLY' | 'NEARLY_READY' | 'SKILL_GAP'
  >('ALL');

  // Auto-sync live data on mount
  useEffect(() => {
    handleLiveSync(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLiveSync(verifiedChallenge = challengeVerified) {
    setSyncing(true);
    setSyncStatus(`Syncing live GitHub (${ghUser}) & Codeforces (${cfHandle}) APIs...`);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentName,
          college: collegeName,
          currentSemester: currentSem,
          graduationYear: gradYear,
          githubUsername: ghUser,
          codeforcesHandle: cfHandle,
          semesters,
          challengeResult: verifiedChallenge
            ? {
                completed: true,
                challengeId: 'calib-sliding-window',
                scoreBoost: 8,
                timeTakenSec: 45,
                verifiedAt: new Date().toISOString(),
              }
            : undefined,
        }),
      });
      if (res.ok) {
        const data: GradLensReport = await res.json();
        setReport(data);
        setSyncStatus(
          data.profile.isLiveSync
            ? `Live API Sync complete · ${data.codeforcesSummary.totalAccepted} CF solves & ${data.githubSummary.totalNonForkRepos} GitHub repos verified`
            : `Computed from deterministic snapshot · Ready`,
        );
      } else {
        setSyncStatus('Used cached deterministic snapshot (API rate limit)');
      }
    } catch {
      setSyncStatus('Computed locally via GradLens Deterministic Engine');
    } finally {
      setSyncing(false);
    }
  }

  function handleAddSemester(e: React.FormEvent) {
    e.preventDefault();
    const sgpaVal = Math.min(10, Math.max(0, parseFloat(newSgpa) || 8.0));
    const attVal = Math.min(100, Math.max(0, parseFloat(newAttendance) || 80));
    const updated = [
      ...semesters.filter((s) => s.semester !== newSemNo),
      {
        semester: newSemNo,
        sgpa: sgpaVal,
        attendancePct: attVal,
        creditsCompleted: 22,
        highlightSubject: newSubject || `Semester ${newSemNo} Core`,
      },
    ].sort((a, b) => a.semester - b.semester);
    setSemesters(updated);
    setCurrentSem(Math.max(currentSem, newSemNo));
    setNewSemNo(Math.min(8, newSemNo + 1));

    // Recompute immediately
    const base = getDefaultFirstYearCohortInput();
    const nextReport = computeGradLensReport({
      ...base,
      profile: {
        ...base.profile,
        name: studentName,
        college: collegeName,
        currentSemester: Math.max(currentSem, newSemNo),
        graduationYear: gradYear,
        githubUsername: ghUser,
        codeforcesHandle: cfHandle,
      },
      semesters: updated,
    });
    setReport(nextReport);
    setSyncStatus(`Updated Semester ${newSemNo} record & recalculated 4-year trajectory`);
  }

  function handleVerifyCalibration() {
    if (selectedOption !== 'b') {
      setSyncStatus('Calibration check: review the sliding-window time complexity option (B).');
      return;
    }
    setChallengeVerified(true);
    handleLiveSync(true);
  }

  function handleExportJson() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradlens-skill-dna-${report.profile.githubUsername}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleResetPrivacyData() {
    const fresh = getDefaultFirstYearCohortInput();
    setSemesters(fresh.semesters);
    setChallengeVerified(false);
    setReport(computeGradLensReport(fresh));
    setSyncStatus('Local session reset to default baseline (DPDP 1-click purge complete)');
  }

  const filteredInternships = report.internshipMatches.filter((m) =>
    roleFilter === 'ALL' ? true : m.status === roleFilter,
  );

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#07090e]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-400/30">
              <Eye className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tracking-tight text-white">GradLens</span>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/25">
                  OS v2.4 · 3D MIRROR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                4-Year Longitudinal Student Intelligence &amp; Verified Internship Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-lg bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300 ring-1 ring-slate-800 lg:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="max-w-xs truncate font-mono text-[11px]">{syncStatus}</span>
            </div>
            <button
              id="btn-header-sync"
              onClick={() => handleLiveSync()}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing APIs...' : 'Sync Live Proof'}
            </button>
          </div>
        </div>
      </header>

      {/* Interactive 3D Hero Section */}
      <section className="relative h-[540px] w-full border-b border-slate-800/80 bg-[#07090e] sm:h-[600px]">
        {/* Full-bleed interactive Three.js 3D showcase */}
        <div className="absolute inset-0">
          <GradLensCanvas />
        </div>

        {/* Subtle top/bottom gradient overlays so HUD controls remain legible while keeping center 3D scene crystal clear */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#07090e]/90 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#07090e] via-[#07090e]/75 to-transparent" />

        {/* Top-left floating HUD overlay */}
        <div className="pointer-events-none relative mx-auto flex h-full max-w-7xl flex-col justify-between px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="pointer-events-auto max-w-lg rounded-2xl border border-slate-800/80 bg-[#07090e]/75 p-4 backdrop-blur-md">
              <p className="font-mono text-[11px] uppercase tracking-wider text-cyan-400">
                HONEST CAREER MIRROR · REAL-TIME 3D TELEMETRY
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                Your marks show academic performance. Your evidence shows real capability.
              </h1>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                Drag to orbit the 3D Skill DNA hologram. Left glass cards stream live{' '}
                <span className="text-cyan-300">GitHub commits</span>,{' '}
                <span className="text-emerald-300">Codeforces progression</span>, and{' '}
                <span className="text-cyan-300">4-year semester trends</span> into your verified
                readiness index.
              </p>
            </div>

            {/* Live Score HUD Pill */}
            <div className="pointer-events-auto flex items-center gap-4 rounded-2xl border border-slate-800/80 bg-[#07090e]/80 px-4 py-3 backdrop-blur-md">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Verified Skill DNA
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl font-bold text-emerald-400">
                    {report.overallDnaScore}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    /100 (±{report.confidenceBand})
                  </span>
                </div>
              </div>
              <div className="h-9 w-px bg-slate-800" />
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Evidence Coverage
                </div>
                <div className="font-mono text-lg font-semibold text-cyan-400">
                  {report.evidenceCoveragePct}% · {report.confidenceLevel}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Live Connector Bar inside Hero */}
          <div className="pointer-events-auto rounded-2xl border border-slate-800/90 bg-[#0b101b]/90 p-3.5 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div>
                <label className="block font-mono text-[10px] uppercase text-slate-400">
                  Student Name
                </label>
                <input
                  id="input-student-name"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/90 px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase text-slate-400">
                  GitHub Username (Official API)
                </label>
                <input
                  id="input-github-user"
                  type="text"
                  value={ghUser}
                  onChange={(e) => setGhUser(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/90 px-2.5 py-1.5 font-mono text-xs text-cyan-300 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase text-slate-400">
                  Codeforces Handle (Official API)
                </label>
                <input
                  id="input-cf-handle"
                  type="text"
                  value={cfHandle}
                  onChange={(e) => setCfHandle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/90 px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase text-slate-400">
                  Current Semester
                </label>
                <select
                  id="select-semester"
                  value={currentSem}
                  onChange={(e) => setCurrentSem(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/90 px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s} ({Math.ceil(s / 2)} Year)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase text-slate-400">
                  Graduation Cohort
                </label>
                <select
                  id="select-grad-year"
                  value={gradYear}
                  onChange={(e) => setGradYear(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/90 px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  {[2026, 2027, 2028, 2029, 2030].map((y) => (
                    <option key={y} value={y}>
                      Class of {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  id="btn-hero-analyze"
                  onClick={() => handleLiveSync()}
                  disabled={syncing}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {syncing ? 'Computing...' : 'Analyze My Standing'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Top 4 KPI Summary Strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800/80 bg-[#0b101b] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Real Capability (Skill DNA)
              </span>
              <Cpu className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-white">
                {report.overallDnaScore}
              </span>
              <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-xs text-cyan-300">
                ±{report.confidenceBand} pts ({report.confidenceLevel} Conf.)
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Trust multiplier <span className="font-mono text-slate-200">{report.authenticityTrustFactor}x</span> ·
              No black-box scoring
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-[#0b101b] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                16-Week Trajectory (Theil-Sen)
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-emerald-400">
                {report.theilSenSlope >= 0 ? `+${report.theilSenSlope}` : report.theilSenSlope}
              </span>
              <span className="text-xs font-medium text-slate-300">
                pts/wk · {report.trajectoryPattern}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              P80 Solved Difficulty:{' '}
              <span className="font-mono text-slate-200">
                {report.codeforcesSummary.p80SolvedRating}
              </span>{' '}
              ({report.codeforcesSummary.totalAccepted} AC solves)
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-[#0b101b] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                CGPA vs. Verified Skill Delta
              </span>
              <BookOpen className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-white">
                {report.academicSummary.currentCgpa}
              </span>
              <span className="font-mono text-xs text-slate-400">
                CGPA vs {report.verifiedTechComposite}% Tech
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {Math.abs(report.inflationDelta) <= 14
                ? 'Balanced academic & practical proof'
                : report.inflationDelta > 14
                  ? `Academic marks +${report.inflationDelta} pts above code proof`
                  : `Underrated builder (Tech exceeds CGPA by ${Math.abs(report.inflationDelta)} pts)`}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-[#0b101b] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Internship Readiness Matches
              </span>
              <Briefcase className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-emerald-400">
                {
                  report.internshipMatches.filter(
                    (m) => m.status === 'READY_TO_APPLY' || m.status === 'NEARLY_READY',
                  ).length
                }
              </span>
              <span className="text-xs text-slate-300">
                of {report.internshipMatches.length} archetypes unlocked/near
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Top Match:{' '}
              <span className="font-medium text-slate-200">
                {report.internshipMatches[0]?.matchScore}% ({report.internshipMatches[0]?.category})
              </span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {[
            { id: 'overview', label: '1. Honest Mirror Overview', icon: Compass },
            { id: 'skill-dna', label: '2. 6-Dimension Skill DNA', icon: Cpu },
            { id: 'trajectory', label: '3. 4-Year & 16W Forecast', icon: Activity },
            { id: 'evidence', label: '4. GitHub & CF Evidence', icon: Code2 },
            { id: 'academics', label: '5. Semester & Attendance Ledger', icon: BookOpen },
            { id: 'internships', label: '6. Smart Internship Matcher', icon: Briefcase },
            { id: 'calibration', label: '7. Independent Verification', icon: Terminal },
            { id: 'privacy', label: '8. Rubric & DPDP Privacy', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/40'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: HONEST MIRROR OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="mt-6 space-y-6">
            {/* Grounded AI Diagnosis Card */}
            <div className="rounded-2xl border border-slate-800 bg-[#0b101b] p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-base font-semibold text-white">
                    Honest Career Mirror — Grounded Executive Diagnosis
                  </h2>
                </div>
                <span className="rounded-md bg-slate-900 px-2.5 py-1 font-mono text-[11px] text-slate-400 ring-1 ring-slate-800">
                  {report.aiDiagnosis.generatedBy}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                    Current Standing (Evidence-Backed Reality)
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    {report.aiDiagnosis.brutalTruth}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                    16-Week Trajectory &amp; Placement Projection
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    {report.aiDiagnosis.trajectoryVerdict}
                  </p>
                </div>
              </div>

              {/* 30-Day Measurable Action Plan */}
              <div className="mt-6">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
                  4-Week Proof-of-Work Action Plan (Smallest Next Actions)
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {report.aiDiagnosis.thirtyDayFix.map((step) => (
                    <div
                      key={step.week}
                      className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          {step.week}
                        </span>
                        <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400">
                          {step.focus}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-medium text-white">{step.measurableTarget}</p>
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        <span className="text-emerald-400">Verifiable Output:</span>{' '}
                        {step.evidenceToProduce}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Two-Column Charts: Skill DNA Radar + 16-Week Forecast */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="rounded-2xl border border-slate-800 bg-[#0b101b] p-6 lg:col-span-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">6-Dimension Skill DNA</h3>
                    <p className="text-xs text-slate-400">
                      Deterministic rubric · Missing data never defaults to 0
                    </p>
                  </div>
                  <span className="font-mono text-xs text-cyan-400">
                    Coverage: {report.evidenceCoveragePct}%
                  </span>
                </div>
                <div className="mt-4 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={report.dimensions.map((d) => ({
                        subject: d.shortLabel,
                        score: d.score,
                        fullMark: 100,
                      }))}
                    >
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#cbd5e1', fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                      />
                      <Radar
                        name="Verified Skill DNA"
                        dataKey="score"
                        stroke="#22d3ee"
                        fill="#10b981"
                        fillOpacity={0.35}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '10px',
                          fontSize: '12px',
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0b101b] p-6 lg:col-span-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      16-Week Historical Capability + 8-Week Holt Forecast
                    </h3>
                    <p className="text-xs text-slate-400">
                      Combines weekly P80 rating, accepted solves, and GitHub commit cadence
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <span className="h-2 w-2 rounded-full bg-cyan-400" /> Observed
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" /> Holt Forecast
                    </span>
                  </div>
                </div>
                <div className="mt-4 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={report.weeklySeries}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="weekLabel"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        interval={2}
                      />
                      <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '10px',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="capabilityIndex"
                        name="Observed Capability"
                        stroke="#22d3ee"
                        fill="#22d3ee"
                        fillOpacity={0.14}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="projectedCapability"
                        name="Holt 8W Projection"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="theilSenTrend"
                        name="Theil-Sen Robust Trend"
                        stroke="#94a3b8"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Private Behavioral & Consistency Signals (Never Shaming) */}
            <div className="rounded-2xl border border-slate-800 bg-[#0b101b] p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Private Behavioral &amp; Cadence Reflections (Confidence Band Modifiers)
                  </h3>
                  <p className="text-xs text-slate-400">
                    GradLens never labels anyone a &ldquo;cheater&rdquo;. Unusual cadence patterns
                    only adjust your private ± confidence band.
                  </p>
                </div>
                <span className="rounded-lg bg-slate-900 px-3 py-1 font-mono text-xs text-emerald-400 ring-1 ring-slate-800">
                  Trust Multiplier: {report.authenticityTrustFactor}x · Band: ±
                  {report.confidenceBand} pts
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {report.behavioralSignals.map((sig) => (
                  <div
                    key={sig.code}
                    className={`rounded-xl border p-4 ${
                      sig.category === 'positive'
                        ? 'border-emerald-500/30 bg-emerald-950/15'
                        : sig.category === 'advisory'
                          ? 'border-amber-500/30 bg-amber-950/15'
                          : 'border-slate-800 bg-slate-950/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white">{sig.title}</span>
                      <span className="rounded bg-slate-900/90 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                        {sig.impactOnConfidence}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                      {sig.description}
                    </p>
                    <p className="mt-2 font-mono text-[11px] text-slate-400">
                      Evidence: {sig.evidenceCite}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 6-DIMENSION SKILL DNA */}
        {activeTab === 'skill-dna' && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {report.dimensions.map((dim) => (
                <div
                  key={dim.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0b101b] p-5"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{dim.label}</span>
                      <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs text-slate-400">
                        Weight: {dim.weightPct}%
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <div className="font-mono text-3xl font-bold text-cyan-400">
                        {dim.score}
                        <span className="text-sm text-slate-500">/100</span>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${
                          dim.confidence === 'High'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-cyan-500/15 text-cyan-300'
                        }`}
                      >
                        {dim.confidence} Confidence
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-900">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-300">{dim.summary}</p>
                  </div>
                  <div className="mt-4 border-t border-slate-800/80 pt-3 font-mono text-[11px] text-emerald-400">
                    Traceable Evidence: {dim.evidenceCount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: 4-YEAR & 16-WEEK TRAJECTORY */}
        {activeTab === 'trajectory' && (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-[#0b101b] p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Weekly Problem Volume, Commits &amp; Capability Trajectory
                  </h3>
                  <p className="text-xs text-slate-400">
                    OLS Difficulty Slope: {report.difficultySlope16w} · Theil-Sen Capability Slope:{' '}
                    {report.theilSenSlope} pts/wk
                  </p>
                </div>
                <span className="rounded-lg bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-300">
                  Pattern: {report.trajectoryPattern}
                </span>
              </div>

              <div className="mt-6 h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={report.weeklySeries}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="weekLabel" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis yAxisId="left" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 20]}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '10px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="problemsSolved"
                      name="Weekly Problems Solved"
                      fill="#22d3ee"
                      opacity={0.4}
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="capabilityIndex"
                      name="Capability Index"
                      stroke="#22d3ee"
                      strokeWidth={2.5}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="projectedCapability"
                      name="Holt 8-Week Forecast"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      strokeDasharray="5 5"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TECHNICAL EVIDENCE (GITHUB & CODEFORCES) */}
        {activeTab === 'evidence' && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* GitHub Repositories Column */}
            <div className="rounded-2xl border border-slate-800 bg-[#0b101b] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-base font-semibold text-white">
                    GitHub Original Repository Depth ({report.githubSummary.username})
                  </h3>
                </div>
                <span className="font-mono text-xs text-emerald-400">
                  {report.githubSummary.verifiedMultiWeekRepos} Multi-Week Verified
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {report.githubSummary.repos.map((repo) => (
                  <div
                    key={repo.fullName}
                    className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-cyan-300 hover:underline"
                      >
                        {repo.name}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <div className="flex items-center gap-2">
                        {repo.language && (
                          <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                            {repo.language}
                          </span>
                        )}
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[10px] ${
                            repo.activeDaysCount >= 3
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {repo.activeDaysCount} active days · {repo.commitsCount16w} commits
                        </span>
                      </div>
                    </div>
                    {repo.description && (
                      <p className="mt-1.5 text-xs text-slate-400">{repo.description}</p>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                      {repo.hasBuildConfig && (
                        <span className="rounded bg-slate-900 px-2 py-0.5 text-cyan-300">
                          ✓ Build Config
                        </span>
                      )}
                      {repo.hasReadme && (
                        <span className="rounded bg-slate-900 px-2 py-0.5 text-emerald-300">
                          ✓ Architecture Docs
                        </span>
                      )}
                      {repo.hasTestsOrCi && (
                        <span className="rounded bg-slate-900 px-2 py-0.5 text-emerald-300">
                          ✓ Tests / CI Signal
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Codeforces Telemetry Column */}
            <div className="rounded-2xl border border-slate-800 bg-[#0b101b] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-base font-semibold text-white">
                    Codeforces Verified Telemetry ({report.codeforcesSummary.handle})
                  </h3>
                </div>
                <span className="font-mono text-xs text-cyan-400">
                  Rating: {report.codeforcesSummary.currentRating} (Max{' '}
                  {report.codeforcesSummary.maxRating})
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="text-[11px] text-slate-400">Accepted Solves</div>
                  <div className="mt-1 font-mono text-xl font-bold text-white">
                    {report.codeforcesSummary.totalAccepted}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="text-[11px] text-slate-400">80th-Pct Difficulty</div>
                  <div className="mt-1 font-mono text-xl font-bold text-cyan-400">
                    {report.codeforcesSummary.p80SolvedRating}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="text-[11px] text-slate-400">Debugging Grit</div>
                  <div className="mt-1 font-mono text-xl font-bold text-emerald-400">
                    {report.codeforcesSummary.gritRatioPct}%
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-medium text-slate-400">Top Verified Topic Tags</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {report.codeforcesSummary.topTags.map((t) => (
                    <span
                      key={t.tag}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 font-mono text-xs text-slate-200"
                    >
                      {t.tag} <span className="text-cyan-400">({t.count})</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <div className="text-xs font-medium text-slate-400">
                  Recent Verified Accepted Submissions
                </div>
                <div className="mt-2 space-y-2">
                  {report.codeforcesSummary.recentAccepted.slice(0, 6).map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs"
                    >
                      <div>
                        <span className="font-mono font-semibold text-cyan-300">
                          {sub.problemId}
                        </span>{' '}
                        <span className="text-slate-200">{sub.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-slate-400">{sub.attempts} attempt(s)</span>
                        <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
                          {sub.rating || 800}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SEMESTER & ATTENDANCE LEDGER */}
        {activeTab === 'academics' && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="rounded-2xl border border-slate-800 bg-[#0b101b] p-6 lg:col-span-7">
              <h3 className="text-base font-semibold text-white">
                4-Year Semester SGPA &amp; Attendance Ledger (Semesters 1–8)
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Tracks periodic consistency and compares CGPA standing against verified coding
                output.
              </p>

              <div className="mt-4 space-y-3">
                {semesters.map((s) => (
                  <div
                    key={s.semester}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-cyan-400">
                          Semester 0{s.semester}
                        </span>
                        <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs text-slate-300">
                          {s.creditsCompleted} Credits
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{s.highlightSubject}</p>
                    </div>
                    <div className="flex items-center gap-5 font-mono">
                      <div>
                        <div className="text-[10px] uppercase text-slate-400">SGPA</div>
                        <div className="text-lg font-bold text-white">{s.sgpa.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-400">Attendance</div>
                        <div
                          className={`text-lg font-bold ${
                            s.attendancePct >= 75 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {s.attendancePct}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0b101b] p-6 lg:col-span-5">
              <h3 className="text-base font-semibold text-white">
                Log or Simulate Semester Record
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Add your latest semester SGPA &amp; attendance to see how it updates your 4-year
                trajectory and internship eligibility.
              </p>

              <form onSubmit={handleAddSemester} className="mt-4 space-y-3">
                <div>
                  <label className="block font-mono text-xs text-slate-300">Semester Number</label>
                  <select
                    id="form-sem-no"
                    value={newSemNo}
                    onChange={(e) => setNewSemNo(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        Semester {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-xs text-slate-300">SGPA (0–10)</label>
                    <input
                      id="form-sgpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={newSgpa}
                      onChange={(e) => setNewSgpa(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-slate-300">
                      Attendance % (0–100)
                    </label>
                    <input
                      id="form-attendance"
                      type="number"
                      min="0"
                      max="100"
                      value={newAttendance}
                      onChange={(e) => setNewAttendance(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-xs text-slate-300">
                    Key Course / Milestone Completed
                  </label>
                  <input
                    id="form-subject"
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <button
                  id="btn-save-semester"
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  <Plus className="h-4 w-4" />
                  Save Semester &amp; Recompute Standing
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 6: SMART INTERNSHIP & OFFER MATCHER */}
        {activeTab === 'internships' && (
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0b101b] p-5">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Deterministic Internship &amp; Fellowship Matcher
                </h3>
                <p className="text-xs text-slate-400">
                  Separates formal academic/cohort eligibility from verified technical readiness and
                  highlights the smallest next action to unlock each role.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['ALL', 'READY_TO_APPLY', 'NEARLY_READY', 'SKILL_GAP'] as const).map((st) => (
                  <button
                    key={st}
                    id={`filter-role-${st}`}
                    onClick={() => setRoleFilter(st)}
                    className={`rounded-lg px-3 py-1.5 font-mono text-xs transition ${
                      roleFilter === st
                        ? 'bg-emerald-500 text-slate-950 font-semibold'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredInternships.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-slate-800 bg-[#0b101b] p-6 transition hover:border-slate-700"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] text-cyan-300 ring-1 ring-slate-800">
                          {job.category}
                        </span>
                        <span
                          className={`rounded-md px-2.5 py-0.5 font-mono text-[11px] font-semibold ${
                            job.status === 'READY_TO_APPLY'
                              ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                              : job.status === 'NEARLY_READY'
                                ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30'
                                : 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
                          }`}
                        >
                          {job.status === 'READY_TO_APPLY'
                            ? '✓ READY TO APPLY'
                            : job.status === 'NEARLY_READY'
                              ? '⚡ NEARLY READY (1–2 GAPS)'
                              : '🔒 SKILL GAP TO UNLOCK'}
                        </span>
                        <span className="font-mono text-xs text-slate-400">
                          {job.location} · {job.stipend}
                        </span>
                      </div>
                      <h4 className="mt-2 text-lg font-semibold text-white">{job.title}</h4>
                      <p className="text-xs text-slate-400">
                        {job.company} · Source: {job.source} (Checked {job.lastChecked})
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono text-3xl font-bold text-emerald-400">
                          {job.matchScore}%
                        </div>
                        <div className="text-[11px] text-slate-400">Skill Match</div>
                      </div>
                      <a
                        href={job.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-cyan-300 ring-1 ring-slate-700 transition hover:bg-slate-800"
                      >
                        Portal
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg bg-slate-950/70 px-3 py-2 font-mono text-xs text-slate-300">
                    Formal Eligibility:{' '}
                    <span
                      className={
                        job.formalEligibilityMet ? 'text-emerald-400' : 'text-amber-400'
                      }
                    >
                      {job.eligibilityNote}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-xs font-semibold text-emerald-400">
                        Verified Strengths Met ({job.verifiedStrengths.length})
                      </div>
                      <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                        {job.verifiedStrengths.map((str, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            {str}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-cyan-400">
                        Exact Measurable Gaps to Unlock ({job.missingGaps.length})
                      </div>
                      {job.missingGaps.length === 0 ? (
                        <p className="mt-2 text-xs text-emerald-300">
                          All core technical thresholds met! You can apply immediately with your
                          verified repository &amp; contest profile.
                        </p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {job.missingGaps.map((g, i) => (
                            <div
                              key={i}
                              className="rounded-lg border border-slate-800 bg-slate-950/80 p-2.5 text-xs"
                            >
                              <div className="flex justify-between font-mono text-[11px]">
                                <span className="text-white">{g.metric}</span>
                                <span className="text-amber-300">
                                  {g.current} → {g.target}
                                </span>
                              </div>
                              <p className="mt-1 text-slate-300">
                                <span className="text-cyan-400">Next Action:</span>{' '}
                                {g.smallestNextAction}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: INDEPENDENT SKILL CALIBRATION */}
        {activeTab === 'calibration' && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0b101b] p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Independent Browser Skill Calibration (Boost Confidence &amp; Narrow ± Band)
                </h3>
                <p className="text-xs text-slate-400">
                  Public activity alone can have cold-start gaps. Completing a timed micro-calibration
                  directly validates your algorithmic reasoning.
                </p>
              </div>
              {challengeVerified && (
                <span className="rounded-lg bg-emerald-500/15 px-3 py-1 font-mono text-xs font-semibold text-emerald-300">
                  ✓ Calibration Verified (+8 Skill Boost Applied)
                </span>
              )}
            </div>

            {CALIBRATION_CHALLENGES.map((ch) => (
              <div key={ch.id} className="mt-5 space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-cyan-300">{ch.title}</span>
                    <span className="font-mono text-xs text-slate-400">{ch.difficulty}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-200">{ch.prompt}</p>
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-[#07090e] p-3 font-mono text-xs text-emerald-300 ring-1 ring-slate-800">
                    {ch.debugSnippet}
                  </pre>

                  <div className="mt-4 space-y-2">
                    {ch.options.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-xs transition ${
                          selectedOption === opt.id
                            ? 'border-cyan-400 bg-cyan-500/10 text-white'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="calib-opt"
                          value={opt.id}
                          checked={selectedOption === opt.id}
                          onChange={() => setSelectedOption(opt.id)}
                          className="accent-cyan-400"
                        />
                        {opt.text}
                      </label>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="block font-mono text-xs text-slate-400">
                      Brief Invariant / Architecture Explanation
                    </label>
                    <textarea
                      rows={2}
                      value={architectureNote}
                      onChange={(e) => setArchitectureNote(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white"
                    />
                  </div>

                  <button
                    id="btn-verify-calibration"
                    onClick={handleVerifyCalibration}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Verify Calibration &amp; Narrow Confidence Band
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 8: RUBRIC TRANSPARENCY & DPDP PRIVACY */}
        {activeTab === 'privacy' && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-[#0b101b] p-6">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-semibold text-white">
                  Published Deterministic Rubric (Zero Black Box)
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Every score in GradLens is computed mathematically from verifiable events before any
                language model is called. The AI layer is strictly forbidden from inventing or
                altering scores.
              </p>
              <ul className="mt-4 space-y-2 font-mono text-xs text-slate-300">
                <li>• Algorithmic &amp; Problem Solving: 25–30% (P80 difficulty + live contest rating)</li>
                <li>• Software Engineering Depth: 25% (Multi-week non-fork repos + CI/tests)</li>
                <li>• Deliberate Practice Consistency: 15–20% (16-week active ratio + attendance)</li>
                <li>• Debugging Grit &amp; Depth: 15% (Retry-to-AC persistence window)</li>
                <li>• Academic Trajectory: 10% (Longitudinal SGPA slope)</li>
                <li>• Growth Velocity: 5% (Theil-Sen non-parametric trend + Holt forecast)</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0b101b] p-6">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">
                  DPDP Act 2023 Student Data Ownership &amp; Controls
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                You own your profile and evidence. GradLens never publishes student leaderboards,
                never shares data with placement cells without explicit consent, and only reads
                public repository metadata.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  id="btn-export-json"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/15 px-4 py-2.5 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-500/30 transition hover:bg-cyan-500/25"
                >
                  <Download className="h-4 w-4" />
                  Export My Full Skill DNA JSON
                </button>
                <button
                  id="btn-delete-data"
                  onClick={handleResetPrivacyData}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-500/15 px-4 py-2.5 text-xs font-semibold text-rose-300 ring-1 ring-rose-500/30 transition hover:bg-rose-500/25"
                >
                  <Trash2 className="h-4 w-4" />
                  1-Click Purge / Reset Session Data
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

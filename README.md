# GradLens — 4-Year Longitudinal Student Intelligence & 3D Skill DNA Engine

> *"Your marks show your academic performance. Your evidence shows your development."*

**GradLens** (Honest Career Mirror) is a 100% web-based, zero-download student career intelligence platform built for engineering students. It replaces fakeable, one-off exam metrics with longitudinal, verifiable proof-of-work across **GitHub**, **Codeforces**, **Semester Academics/Attendance**, and **Independent Calibration Assessments**.

---

## ✨ Core Architecture & Features

1. **Interactive 60fps 3D Product Showcase (`src/scene/`)**
   - **Left 3D Glass Cards**: Floating dark-glass cards with custom shader rim borders and instanced 3D relief meshes (`GitHub Commits`, `Codeforces Rating`, `4-Semester Academic Trend`).
   - **Central 3D Skill DNA Hologram**: Concentric hexagonal radar hologram with custom GLSL scanlines, 6-second lock-in pulse waves, and traveling data packets along 4 luminous Catmull-Rom splines.
   - **Right 3D Internship Match Card**: Glassmorphic card with a 3D glowing emerald readiness torus ring (`94%`) and luminous role bars.

2. **Deterministic 6-Dimension Skill DNA Engine (`src/lib/scoring/engine.ts`)**
   - **Algorithmic & Problem Solving (25–30%)**: 80th-percentile solved difficulty (`P80`), topic tag breadth, and live contest rating.
   - **Software Engineering & Projects (25%)**: Multi-week non-fork GitHub repositories, commit spread across active days, build configs, and CI/test presence.
   - **Deliberate Practice Consistency (15–20%)**: 16-week active coding ratio + semester attendance discipline.
   - **Debugging Grit & Depth (15%)**: Retry-to-accept persistence window (resolving `WA`/`TLE` attempts within 8–180 minutes).
   - **Academic Trajectory (10%)**: Longitudinal SGPA slope across semesters 1–8 and CGPA vs. Tech Inflation Delta.
   - **Growth Velocity (5%)**: Non-parametric **Theil–Sen estimator** slope + **Holt's Double Exponential Smoothing** 8-week forward forecast.

3. **Ethical, DPDP-Safe Behavioral Signals (Never Shaming)**
   - Never labels a student a "cheater." Instead, cadence signals (such as practice-vs-contest gap, single-day repository dumps, or verified debugging grit) adjust a private **± Confidence Band** and **Trust Multiplier** (`0.85x–1.05x`).

4. **Deterministic Internship & Fellowship Matcher**
   - Separates **formal academic eligibility** (Graduation Cohort & minimum CGPA) from **verified technical readiness** (`READY_TO_APPLY`, `NEARLY_READY`, `SKILL_GAP`) and outputs the **smallest next action** to unlock each role.

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to interact with the 3D Skill DNA Hologram and sync live GitHub & Codeforces profiles.

### Optional Environment Variables (`.env.local`)
- `GEMINI_API_KEY`: Optional Google AI Studio API key (`gemini-2.5-flash`) to enrich the executive narrative diagnosis (falls back automatically to the deterministic citation engine if omitted).
- `GITHUB_TOKEN`: Optional personal access token to raise GitHub API rate limits from 60 req/hr to 5,000 req/hr.

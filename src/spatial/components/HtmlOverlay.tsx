'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Cpu, Activity, Code2, BookOpen, Briefcase, Terminal, ShieldCheck,
  Eye, Sparkles, RefreshCw, Download, ExternalLink, ChevronRight, X,
  Settings, Layers, Info, Zap
} from 'lucide-react';
import { useQuality, useQualitySelector } from '@/spatial/hooks/useQuality';
import { SCROLL_SECTIONS } from '@/spatial/hooks/useScrollController';

const SECTIONS = [
  { id: 'hero', label: 'Honest Mirror', icon: Compass, href: '#hero' },
  { id: 'dna', label: 'Skill DNA', icon: Cpu, href: '#dna' },
  { id: 'trajectory', label: 'Trajectory', icon: Activity, href: '#trajectory' },
  { id: 'evidence', label: 'Evidence', icon: Code2, href: '#evidence' },
  { id: 'academics', label: 'Academics', icon: BookOpen, href: '#academics' },
  { id: 'internships', label: 'Internships', icon: Briefcase, href: '#internships' },
  { id: 'ai', label: 'AI Mirror', icon: Sparkles, href: '#ai' },
  { id: 'calib', label: 'Calibration', icon: Terminal, href: '#calib' },
];

export function HtmlOverlay({ 
  currentSection, 
  onSectionClick,
  studentName,
  setStudentName,
  ghUser,
  setGhUser,
  cfHandle,
  setCfHandle,
  currentSem,
  setCurrentSem,
  gradYear,
  setGradYear,
  onSync,
  syncing,
  syncStatus,
}: {
  currentSection: string;
  onSectionClick: (section: string) => void;
  studentName: string;
  setStudentName: (name: string) => void;
  ghUser: string;
  setGhUser: (user: string) => void;
  cfHandle: string;
  setCfHandle: (handle: string) => void;
  currentSem: number;
  setCurrentSem: (sem: number) => void;
  gradYear: number;
  setGradYear: (year: number) => void;
  onSync: () => void;
  syncing: boolean;
  syncStatus: string;
}) {
  const { tier, config, setTier, resetToAuto, isAuto, options } = useQualitySelector();
  const [qualityOpen, setQualityOpen] = useState(false);
  const [inputsOpen, setInputsOpen] = useState(true);
  const qualityRef = useRef<HTMLDivElement>(null);
  const inputsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (qualityRef.current && !qualityRef.current.contains(e.target as Node)) {
        setQualityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40" style={{ perspective: '1000px' }}>
      {/* Top Navigation HUD */}
      <div className="pointer-events-auto fixed top-0 left-0 right-0 z-50 px-4 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-400/30"
            >
              <Eye className="h-5 w-5 text-cyan-400" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tracking-tight text-white">GradLens</span>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/25">
                  OS v2.4 · 3D MIRROR
                </span>
              </div>
              <p className="text-xs text-slate-400">4-Year Longitudinal Student Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quality Selector */}
            <div className="relative" ref={qualityRef}>
              <button
                onClick={() => setQualityOpen(!qualityOpen)}
                className="flex items-center gap-2 rounded-lg bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-300 ring-1 ring-slate-800 hover:bg-slate-800 transition-all"
              >
                <Settings className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden sm:inline">
                  Quality: <span className="font-mono text-cyan-400 capitalize">{tier}</span>
                </span>
                <Zap className={`h-3.5 w-3.5 ${tier === 'high' ? 'text-emerald-400' : tier === 'medium' ? 'text-amber-400' : 'text-slate-400'}`} />
              </button>
              
              <AnimatePresence>
                {qualityOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-800 bg-[#0b101b]/95 backdrop-blur-md p-3 shadow-2xl ring-1 ring-slate-800"
                  >
                    <div className="flex items-center justify-between mb-2 px-2">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Render Quality</span>
                      {isAuto && <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">Auto</span>}
                    </div>
                    <div className="space-y-1">
                      {options.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setTier(opt.value)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                            tier === opt.value
                              ? 'bg-cyan-500/15 text-cyan-300'
                              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                          }`}
                        >
                          <span className="font-medium capitalize">{opt.label}</span>
                          <span className="text-[10px] text-slate-500">{opt.description}</span>
                        </button>
                      ))}
                      <button
                        onClick={resetToAuto}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all mt-1"
                      >
                        <Info className="h-3.5 w-3.5" />
                        <span>Auto-detect ({detectQualityLabel()})</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status & Sync */}
            <div className="hidden lg:flex items-center gap-3 rounded-lg bg-slate-900/90 px-3 py-2 text-xs text-slate-300 ring-1 ring-slate-800">
              <span className={`h-2 w-2 rounded-full ${syncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="max-w-xs truncate font-mono text-[11px]">{syncStatus}</span>
            </div>

            <button
              onClick={onSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Live Proof'}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Navigation Dock */}
      <div className="pointer-events-auto fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 rounded-2xl bg-[#07090e]/90 backdrop-blur-xl p-1.5 ring-1 ring-slate-800/50 shadow-2xl"
        >
          {SECTIONS.map((section, i) => {
            const Icon = section.icon;
            const isActive = currentSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onSectionClick(section.id)}
                className={`relative flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/40'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
                style={{ zIndex: 10 - i }}
              >
                <Icon className="h-4 w-4" />
                <span className="font-mono text-[10px] hidden sm:block">{section.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-3/4 rounded-full bg-cyan-400"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* Collapsible Input Panel */}
      <AnimatePresence>
        {inputsOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="pointer-events-auto fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl"
            ref={inputsRef}
          >
            <div className="rounded-2xl border border-slate-800/90 bg-[#0b101b]/90 p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Live Connector</span>
                <button
                  onClick={() => setInputsOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-slate-400">Student Name</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/90 px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase text-slate-400">GitHub Username</label>
                  <input
                    type="text"
                    value={ghUser}
                    onChange={(e) => setGhUser(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/90 px-2.5 py-1.5 font-mono text-xs text-cyan-300 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase text-slate-400">Codeforces Handle</label>
                  <input
                    type="text"
                    value={cfHandle}
                    onChange={(e) => setCfHandle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/90 px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase text-slate-400">Current Semester</label>
                  <select
                    value={currentSem}
                    onChange={(e) => setCurrentSem(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/90 px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <option key={s} value={s}>Semester {s} ({Math.ceil(s/2)} Year)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase text-slate-400">Graduation Cohort</label>
                  <select
                    value={gradYear}
                    onChange={(e) => setGradYear(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/90 px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {[2026,2027,2028,2029,2030].map(y => (
                      <option key={y} value={y}>Class of {y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={onSync}
                    disabled={syncing}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {syncing ? 'Computing...' : 'Analyze My Standing'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Indicator */}
      <div className="pointer-events-none fixed right-6 top-1/2 -translate-y-1/2 z-40">
        <div className="flex flex-col items-end gap-2">
          {SECTIONS.map((section) => {
            const isActive = currentSection === section.id;
            const isPassed = SCROLL_SECTIONS.findIndex(s => s.name === section.id) <= SCROLL_SECTIONS.findIndex(s => s.name === currentSection);
            return (
              <motion.div
                key={section.id}
                layout
                className={`flex items-center gap-2 pr-3 py-1.5 rounded-r-xl transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/40'
                    : isPassed
                      ? 'bg-emerald-500/10 text-emerald-400/60'
                      : 'bg-slate-900/60 text-slate-500/60'
                }`}
              >
                <span className="font-mono text-xs">{section.label}</span>
                <motion.div
                  className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-cyan-400' : isPassed ? 'bg-emerald-400' : 'bg-slate-600'}`}
                  animate={{ scale: isActive ? 1.5 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom Right Actions */}
      <div className="pointer-events-auto fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <button className="rounded-xl bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-300 ring-1 ring-slate-800 hover:bg-slate-800 transition flex items-center gap-2">
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export JSON</span>
        </button>
        <button className="rounded-xl bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-300 ring-1 ring-slate-800 hover:bg-slate-800 transition flex items-center gap-2">
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">View on GitHub</span>
        </button>
      </div>
    </div>
  );
}

function detectQualityLabel(): string {
  if (typeof window === 'undefined') return 'medium';
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  if (isMobile || deviceMemory < 4 || cores < 4) return 'low';
  if (deviceMemory >= 8 && cores >= 8 && !isMobile) return 'high';
  return 'medium';
}
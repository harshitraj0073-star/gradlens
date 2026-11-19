'use client';

import { SpatialApp } from '@/spatial/components/SpatialApp';
import { computeGradLensReport } from '@/lib/scoring/engine';
import { getDefaultFirstYearCohortInput } from '@/lib/scoring/sampleData';

export default function HomePage() {
  const initialReport = computeGradLensReport(getDefaultFirstYearCohortInput());
  
  return <SpatialApp initialReport={initialReport} />;
}
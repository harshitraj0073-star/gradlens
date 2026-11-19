'use client';

import { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ScrollSection {
  name: string;
  y: number;
  camera: [number, number, number];
  lookAt: [number, number, number];
  duration?: number;
  ease?: string;
}

export const SCROLL_SECTIONS: ScrollSection[] = [
  { name: 'hero', y: 0, camera: [0, 0, 30], lookAt: [0, 0, 0], duration: 2.5, ease: 'power3.inOut' },
  { name: 'dna', y: 1, camera: [0, 6, 26], lookAt: [0, 0, 0], duration: 2.5, ease: 'power3.inOut' },
  { name: 'trajectory', y: 2, camera: [16, 10, 20], lookAt: [0, 0, -10], duration: 2.8, ease: 'power3.inOut' },
  { name: 'evidence', y: 3, camera: [0, 20, 30], lookAt: [0, 5, -20], duration: 3, ease: 'power3.inOut' },
  { name: 'academics', y: 4, camera: [0, 30, 16], lookAt: [0, 15, -10], duration: 2.8, ease: 'power3.inOut' },
  { name: 'internships', y: 5, camera: [-20, 10, 22], lookAt: [0, 0, -30], duration: 3, ease: 'power3.inOut' },
  { name: 'ai', y: 6, camera: [0, 0, 12], lookAt: [0, 0, 0], duration: 2.5, ease: 'power3.inOut' },
  { name: 'calib', y: 7, camera: [0, 2, 8], lookAt: [0, 1.6, 0], duration: 2, ease: 'power2.out' },
];

export interface CameraTarget {
  position: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
}

/**
 * Drives camera targets from scroll position.
 * Renders one 100vh scroll spacer per section so the document can scroll
 * while the canvas stays fixed behind it.
 */
export function useScrollController(
  onSectionChange?: (section: ScrollSection, progress: number) => void
) {
  const currentSectionRef = useRef<ScrollSection>(SCROLL_SECTIONS[0]);
  const triggersRef = useRef<ScrollTrigger[]>([]);
  const spacersRef = useRef<HTMLDivElement[]>([]);

  const setSection = useCallback(
    (section: ScrollSection, progress: number) => {
      if (currentSectionRef.current.name !== section.name) {
        currentSectionRef.current = section;
      }
      onSectionChange?.(section, progress);
    },
    [onSectionChange]
  );

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Create one scroll spacer per section, stacked vertically.
    const container = document.createElement('div');
    container.setAttribute('data-scroll-spacers', 'true');
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.zIndex = '-1';
    container.style.pointerEvents = 'none';

    SCROLL_SECTIONS.forEach((section) => {
      const spacer = document.createElement('div');
      spacer.style.height = '100vh';
      spacer.style.width = '100%';
      spacer.setAttribute('data-section', section.name);
      container.appendChild(spacer);
      spacersRef.current.push(spacer);
    });

    document.body.appendChild(container);

    SCROLL_SECTIONS.forEach((section, index) => {
      const trigger = ScrollTrigger.create({
        id: `section-${section.name}`,
        trigger: spacersRef.current[index],
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setSection(section, 0),
        onEnterBack: () => setSection(section, 1),
        onUpdate: (self) => setSection(section, self.progress),
      });
      triggersRef.current.push(trigger);
    });

    // Jump to the section matching the initial scroll position.
    const initialIndex = Math.min(
      SCROLL_SECTIONS.length - 1,
      Math.floor(window.scrollY / window.innerHeight)
    );
    setSection(SCROLL_SECTIONS[Math.max(0, initialIndex)], 0);

    ScrollTrigger.refresh();

    return () => {
      triggersRef.current.forEach((t) => t.kill());
      triggersRef.current = [];
      container.remove();
      spacersRef.current = [];
      ScrollTrigger.refresh();
    };
  }, [setSection]);

  const scrollToSection = useCallback((sectionName: string) => {
    const index = SCROLL_SECTIONS.findIndex((s) => s.name === sectionName);
    if (index < 0) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: index * window.innerHeight,
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, []);

  return {
    sections: SCROLL_SECTIONS,
    currentSection: currentSectionRef.current,
    scrollToSection,
  };
}
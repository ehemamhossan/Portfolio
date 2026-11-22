import type { CaseStudyItem, ExperienceCategory, ExperienceItem } from '../data/portfolioData';

export type CameraPreset = 'overview' | 'network' | 'precision';

export interface ScrollCameraState {
  cameraPosition: [number, number, number];
  lookAtTarget: [number, number, number];
  sculptureRotationY: number;
  sculptureTiltX: number;
  ringSpread: number;
  activeSectionIndex: number;
}

export interface ContactFormInput {
  name: string;
  email: string;
  company: string;
  inquiryType: string;
  message: string;
}

export interface ContactValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ContactFormInput, string>>;
}

export function filterExperiences(
  items: ExperienceItem[],
  category: ExperienceCategory,
): ExperienceItem[] {
  if (category === 'all') return items;
  return items.filter((item) => item.category === category);
}

export function filterCaseStudies(
  items: CaseStudyItem[],
  category: ExperienceCategory,
): CaseStudyItem[] {
  if (category === 'all') return items;
  return items.filter((item) => item.category === category);
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function computeScrollCameraState(
  scrollProgress: number,
  preset: CameraPreset = 'overview',
): ScrollCameraState {
  const p = clamp01(scrollProgress);

  let baseX = 1.95;
  let baseY = 0.7;
  let baseZ = 7.4;
  let targetX = -1.45;
  let targetY = 0.05;

  if (preset === 'network') {
    baseX = -1.55;
    baseY = 2.25;
    baseZ = 6.5;
    targetX = -0.35;
    targetY = 0.1;
  } else if (preset === 'precision') {
    baseX = 0.65;
    baseY = 0.35;
    baseZ = 5.05;
    targetX = -0.65;
    targetY = 0.05;
  }

  // Smooth orbital trajectory driven by scroll progress
  const angle = p * Math.PI * 0.9;
  const camX = baseX * Math.cos(angle * 0.55) + Math.sin(p * Math.PI) * 1.35;
  const camY = baseY + Math.sin(p * Math.PI * 1.2) * 0.85 - p * 0.25;
  const camZ = baseZ - Math.sin(p * Math.PI) * 0.9;

  // Ring expansion reveals internal precision geometry mid-scroll
  const ringSpread = Math.sin(p * Math.PI) * 0.62;

  const activeSectionIndex = Math.min(4, Math.floor(p * 4.99));

  return {
    cameraPosition: [
      Number(camX.toFixed(4)),
      Number(camY.toFixed(4)),
      Number(camZ.toFixed(4)),
    ],
    lookAtTarget: [
      Number((targetX * (1 - p * 0.45)).toFixed(4)),
      Number(targetY.toFixed(4)),
      0,
    ],
    sculptureRotationY: Number((p * Math.PI * 1.45).toFixed(4)),
    sculptureTiltX: Number((0.18 + Math.sin(p * Math.PI) * 0.22).toFixed(4)),
    ringSpread: Number(ringSpread.toFixed(4)),
    activeSectionIndex,
  };
}

export function validateContactForm(input: ContactFormInput): ContactValidationResult {
  const errors: Partial<Record<keyof ContactFormInput, string>> = {};

  if (!input.name.trim() || input.name.trim().length < 2) {
    errors.name = 'Please enter your full name (at least 2 characters).';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email.trim() || !emailPattern.test(input.email.trim())) {
    errors.email = 'Please provide a valid work or personal email address.';
  }

  if (!input.message.trim() || input.message.trim().length < 12) {
    errors.message = 'Please include a brief note about the role or project (at least 12 characters).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

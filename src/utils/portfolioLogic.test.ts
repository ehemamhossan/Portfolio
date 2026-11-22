import test from 'node:test';
import assert from 'node:assert/strict';
import { CASE_STUDIES, EXPERIENCES } from '../data/portfolioData';
import {
  clamp01,
  computeScrollCameraState,
  filterCaseStudies,
  filterExperiences,
  validateContactForm,
} from './portfolioLogic';

test('filterExperiences returns all items for all category and narrows per domain', () => {
  assert.equal(filterExperiences(EXPERIENCES, 'all').length, EXPERIENCES.length);
  const sales = filterExperiences(EXPERIENCES, 'sales');
  assert.equal(sales.length, 1);
  assert.equal(sales[0].company, 'Tribune Training Academy');

  const hr = filterExperiences(EXPERIENCES, 'hr');
  assert.equal(hr.length, 3);
  assert.ok(hr.every((item) => item.category === 'hr'));
});

test('filterCaseStudies filters correctly by category', () => {
  assert.equal(filterCaseStudies(CASE_STUDIES, 'all').length, CASE_STUDIES.length);
  const digital = filterCaseStudies(CASE_STUDIES, 'digital');
  assert.equal(digital.length, 1);
  assert.equal(digital[0].organization, 'Career Hive Dot Com');
});

test('clamp01 clamps out-of-range and non-finite inputs safely', () => {
  assert.equal(clamp01(-0.5), 0);
  assert.equal(clamp01(1.8), 1);
  assert.equal(clamp01(Number.NaN), 0);
  assert.equal(clamp01(0.42), 0.42);
});

test('computeScrollCameraState responds smoothly to scroll progress and presets', () => {
  const start = computeScrollCameraState(0, 'overview');
  const mid = computeScrollCameraState(0.5, 'overview');
  const end = computeScrollCameraState(1, 'overview');

  assert.equal(start.activeSectionIndex, 0);
  assert.equal(end.activeSectionIndex, 4);
  assert.ok(mid.ringSpread > start.ringSpread);
  assert.ok(end.sculptureRotationY > start.sculptureRotationY);

  const precision = computeScrollCameraState(0, 'precision');
  assert.ok(precision.cameraPosition[2] < start.cameraPosition[2]);
});

test('validateContactForm rejects empty/invalid input and accepts valid inquiries', () => {
  const invalid = validateContactForm({
    name: 'A',
    email: 'not-an-email',
    company: '',
    inquiryType: 'Full-Time Role',
    message: 'Hi',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.message);

  const valid = validateContactForm({
    name: 'Sarah Jenkins',
    email: 'sarah@acmecorp.com',
    company: 'Acme Global',
    inquiryType: 'B2B Sales Specialist',
    message: 'We would love to discuss a remote B2B outreach role with our US team.',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

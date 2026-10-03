import { firstName, formatFeePerHour, formatMemberSince, formatRating } from '../format';

describe('formatFeePerHour', () => {
  it('shows rupees from paise', () => {
    expect(formatFeePerHour(80000)).toBe('₹800/hr');
    expect(formatFeePerHour(1250000)).toBe('₹12,500/hr');
  });
  it('falls back when no fee is set', () => {
    expect(formatFeePerHour(null)).toBe('Fee on request');
    expect(formatFeePerHour(undefined)).toBe('Fee on request');
  });
});

describe('formatRating', () => {
  it('formats average and count', () => {
    expect(formatRating(4.8, 62)).toBe('4.8 (62)');
    expect(formatRating(4, 0)).toBe('4.0');
    expect(formatRating(null, 5)).toBeNull();
  });
});

describe('firstName', () => {
  it('takes the first word', () => {
    expect(firstName('Lakshmi Venkatesh')).toBe('Lakshmi');
    expect(firstName('  ')).toBe('');
    expect(firstName(undefined)).toBe('');
  });
});

describe('formatMemberSince', () => {
  it('handles bad input', () => {
    expect(formatMemberSince(undefined)).toBeNull();
    expect(formatMemberSince('nope')).toBeNull();
    expect(formatMemberSince('2026-03-14T00:00:00Z')).toMatch(/2026/);
  });
});

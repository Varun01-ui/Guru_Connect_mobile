import { diffProfile, validateFullName } from '../rules';

describe('validateFullName', () => {
  it('accepts normal names', () => {
    expect(validateFullName('Lakshmi Venkatesh')).toBeUndefined();
    expect(validateFullName('Dr. Anna-Marie')).toBeUndefined();
    expect(validateFullName('लक्ष्मी')).toBeUndefined();
  });
  it('rejects too short, digits and symbols', () => {
    expect(validateFullName('A')).toBe('Enter your full name.');
    expect(validateFullName('Lakshmi 2')).toBe('Enter your full name.');
    expect(validateFullName('a@b')).toBe('Enter your full name.');
    expect(validateFullName('x'.repeat(101))).toBe('Enter your full name.');
  });
});

describe('diffProfile', () => {
  const original = { fullName: 'Lakshmi V', cityId: 'blr', areaId: 'kor' };

  it('is empty when nothing changed (trimming ignored)', () => {
    expect(diffProfile(original, { ...original, fullName: ' Lakshmi V ' })).toEqual({});
  });
  it('sends only the changed name', () => {
    expect(diffProfile(original, { ...original, fullName: 'Lakshmi Venkatesh' })).toEqual({ fullName: 'Lakshmi Venkatesh' });
  });
  it('sends the area alone when only the area changed', () => {
    expect(diffProfile(original, { ...original, areaId: 'ind' })).toEqual({ areaId: 'ind' });
  });
  it('clears the area when the city changes without a new area', () => {
    expect(diffProfile(original, { ...original, cityId: 'mum', areaId: '' })).toEqual({ cityId: 'mum', areaId: null });
  });
  it('sends city and area together when both change', () => {
    expect(diffProfile(original, { ...original, cityId: 'mum', areaId: 'and' })).toEqual({ cityId: 'mum', areaId: 'and' });
  });
  it('allows removing just the area', () => {
    expect(diffProfile(original, { ...original, areaId: '' })).toEqual({ areaId: null });
  });
});

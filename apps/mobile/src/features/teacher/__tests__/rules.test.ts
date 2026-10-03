import { isAdultDateOfBirth, isValidAadhaar, isValidPan, maskAadhaar, maskPan, windowsOverlap, containsContactInfo } from '../rules';

describe('isAdultDateOfBirth', () => {
  it('accepts someone who is exactly 18', () => {
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    const dob = eighteenYearsAgo.toISOString().slice(0, 10);
    expect(isAdultDateOfBirth(dob)).toBe(true);
  });

  it('rejects someone who turns 18 tomorrow', () => {
    const almost = new Date();
    almost.setFullYear(almost.getFullYear() - 18);
    almost.setDate(almost.getDate() + 1);
    const dob = almost.toISOString().slice(0, 10);
    expect(isAdultDateOfBirth(dob)).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(isAdultDateOfBirth('not-a-date')).toBe(false);
  });
});

describe('isValidAadhaar', () => {
  it('accepts a Verhoeff-valid 12-digit number', () => {
    // 234123412346 is a known-valid Verhoeff test vector for an 11-digit base of 23412341234.
    expect(isValidAadhaar('234123412346')).toBe(true);
    expect(isValidAadhaar('2341 2341 2346')).toBe(true);
  });

  it('rejects an invalid checksum', () => {
    expect(isValidAadhaar('491234567890')).toBe(false);
  });

  it('rejects the wrong digit count', () => {
    expect(isValidAadhaar('12345')).toBe(false);
  });
});

describe('isValidPan', () => {
  it('accepts the standard PAN shape', () => {
    expect(isValidPan('ABCDE1234F')).toBe(true);
  });
  it('rejects a bad shape', () => {
    expect(isValidPan('ABCDE12F')).toBe(false);
  });
});

describe('masking', () => {
  it('masks Aadhaar to only the last 4 digits', () => {
    expect(maskAadhaar('234123412346')).toBe('XXXX XXXX 2346');
  });
  it('masks PAN to first char + last 4', () => {
    expect(maskPan('abcde1234f')).toBe('AXXXXX234F');
  });
});

describe('windowsOverlap', () => {
  it('detects overlapping windows', () => {
    expect(windowsOverlap({ startTime: '16:00', endTime: '19:00' }, { startTime: '18:00', endTime: '20:00' })).toBe(true);
  });
  it('allows back-to-back windows', () => {
    expect(windowsOverlap({ startTime: '16:00', endTime: '18:00' }, { startTime: '18:00', endTime: '20:00' })).toBe(false);
  });
});

describe('containsContactInfo', () => {
  it('flags a phone number', () => {
    expect(containsContactInfo('Call me at 9876543210')).toBe(true);
  });
  it('flags an email', () => {
    expect(containsContactInfo('reach me at foo@bar.com')).toBe(true);
  });
  it('allows plain text', () => {
    expect(containsContactInfo('I teach Physics and Maths for 10 years.')).toBe(false);
  });
});

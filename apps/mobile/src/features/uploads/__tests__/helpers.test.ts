import { uploadErrorMessage } from '../helpers';

describe('uploadErrorMessage', () => {
  it('maps known codes', () => {
    expect(uploadErrorMessage({ code: 'FILE_TOO_LARGE' })).toMatch(/under 5 MB/);
    expect(uploadErrorMessage({ code: 'FILE_TYPE_NOT_ALLOWED' })).toMatch(/JPG, PNG or WebP/);
  });
  it('falls back to a generic message', () => {
    expect(uploadErrorMessage(new Error('boom'))).toBe("That photo didn't upload. Try again.");
    expect(uploadErrorMessage(undefined)).toBe("That photo didn't upload. Try again.");
  });
});

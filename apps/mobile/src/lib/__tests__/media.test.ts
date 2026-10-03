jest.mock('../api', () => ({ API_BASE_URL: 'http://192.168.1.28:4000/api/v1/app/' }));
import { mediaUrl, rewriteLoopbackHost } from '../media';

const API = 'http://192.168.1.28:4000/api/v1/app/';

describe('rewriteLoopbackHost', () => {
  it('points a localhost upload URL at the API host', () => {
    expect(rewriteLoopbackHost('http://localhost:4000/api/v1/app/dev-storage/gc-public/a.jpg?sig=1', API)).toBe(
      'http://192.168.1.28:4000/api/v1/app/dev-storage/gc-public/a.jpg?sig=1',
    );
  });
  it('handles 127.0.0.1 and the Android emulator alias', () => {
    expect(rewriteLoopbackHost('http://127.0.0.1:4000/x?y=1', API)).toBe('http://192.168.1.28:4000/x?y=1');
    expect(rewriteLoopbackHost('http://10.0.2.2:4000/x', API)).toBe('http://192.168.1.28:4000/x');
  });
  it('leaves real storage URLs alone', () => {
    const r2 = 'https://acct.r2.cloudflarestorage.com/gc-public/avatars/a.jpg?X-Amz-Signature=abc';
    expect(rewriteLoopbackHost(r2, API)).toBe(r2);
  });
  it('does not touch a host that merely starts with localhost', () => {
    const other = 'https://localhost.example.com/a.jpg';
    expect(rewriteLoopbackHost(other, API)).toBe(other);
  });
});


describe('mediaUrl', () => {
  it('rewrites a localhost image URL and passes null through', () => {
    expect(mediaUrl('http://localhost:4000/cdn/avatars/a.jpg')).toBe('http://192.168.1.28:4000/cdn/avatars/a.jpg');
    expect(mediaUrl(null)).toBeNull();
    expect(mediaUrl(undefined)).toBeNull();
    expect(mediaUrl('')).toBeNull();
  });
});

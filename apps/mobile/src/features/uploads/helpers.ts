export function uploadErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string } | undefined;
  switch (e?.code) {
    case 'FILE_TOO_LARGE':
      return 'That photo is too large. Choose one under 5 MB.';
    case 'FILE_TYPE_NOT_ALLOWED':
      return 'Use a JPG, PNG or WebP photo.';
    case 'UPLOAD_LIMIT_REACHED':
      return 'Too many unfinished uploads. Try again in a little while.';
    case 'NETWORK_OFFLINE':
      return "You're offline. Try again when you're back online.";
    default:
      return "That photo didn't upload. Try again.";
  }
}

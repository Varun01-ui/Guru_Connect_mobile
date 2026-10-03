// Fees are stored in paise; show whole rupees with Indian digit grouping.
export function formatFeePerHour(paise: number | null | undefined): string {
  if (paise == null) return 'Fee on request';
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}/hr`;
}

export function firstName(fullName: string | null | undefined): string {
  return (fullName ?? '').trim().split(/\s+/)[0] ?? '';
}

export function formatRating(avg: number | null | undefined, count: number | null | undefined): string | null {
  if (avg == null) return null;
  return count ? `${avg.toFixed(1)} (${count})` : avg.toFixed(1);
}

export function formatMemberSince(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

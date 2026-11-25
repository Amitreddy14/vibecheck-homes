/**
 * 18+ rule, written to match the database CHECK exactly:
 *   date_of_birth <= (current_date - interval '18 years')
 * Postgres clamps to the month's last day (29 Feb 2026 - 18 years = 28 Feb 2008),
 * so we do the same. "Today" is the UTC date, because Supabase runs in UTC.
 */

export const MINIMUM_AGE = 18;

/** Today's date as YYYY-MM-DD in UTC (the database's current_date). */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** The latest date of birth that is still 18+ on `today` (YYYY-MM-DD). */
export function latestAdultBirthDate(today: string): string {
  const [year, month, day] = today.split("-").map(Number) as [number, number, number];
  const targetYear = year - MINIMUM_AGE;
  // Day 0 of the next month = last day of this month.
  const lastDayOfMonth = new Date(Date.UTC(targetYear, month, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfMonth);
  return `${targetYear}-${pad(month)}-${pad(clampedDay)}`;
}

/** True if someone born on `dateOfBirth` is 18 or older on `today` (both YYYY-MM-DD). */
export function isAdult(dateOfBirth: string, today: string = todayUtc()): boolean {
  // ISO dates compare correctly as strings.
  return dateOfBirth <= latestAdultBirthDate(today);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

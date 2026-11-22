/** Estado de él según su humillación: 0 Tranquilo … 4 Quebrado. */
export function stage(humiliation: number): number {
  if (humiliation < 15) return 0;
  if (humiliation < 35) return 1;
  if (humiliation < 60) return 2;
  if (humiliation < 85) return 3;
  return 4;
}

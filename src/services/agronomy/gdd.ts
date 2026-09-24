/**
 * Growing Degree Days (GDD).
 * GDD = max(0, ((T_max + T_min) / 2) - T_base)
 *
 * @param tMax Maximum daily temperature in Celsius
 * @param tMin Minimum daily temperature in Celsius
 * @param tBase Base temperature threshold for crop development (default 10°C)
 */
export function calculateDailyGDD(tMax: number, tMin: number, tBase = 10): number {
  const tMean = (tMax + tMin) / 2;
  const gdd = Math.max(0, tMean - tBase);
  return Math.round(gdd * 100) / 100;
}

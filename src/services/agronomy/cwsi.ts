/**
 * Crop Water Stress Index (CWSI).
 *
 * CWSI = normalized canopy temperature depression:
 * canopyTemp - airTemp normalized against empirical upper and lower baseline limits.
 *
 * Simplified empirical formulation:
 * Delta T = canopyTemp - airTemp
 * Normal range typically between -3.0°C (well-watered non-stressed) and +5.0°C (severely stressed).
 *
 * CWSI = (Delta T - lowerBaseline) / (upperBaseline - lowerBaseline)
 * Clamped between 0 (no stress) and 1 (extreme stress).
 *
 * @param canopyTemp Surface canopy temperature in Celsius (infrared sensor)
 * @param airTemp Ambient air temperature in Celsius
 * @param lowerBaseline Lowest expected Delta T for non-stressed crop (default -3.0)
 * @param upperBaseline Highest expected Delta T for stressed crop (default +5.0)
 * @returns CWSI index between 0.00 and 1.00
 */
export function calculateCWSI(
  canopyTemp: number,
  airTemp: number,
  lowerBaseline = -3.0,
  upperBaseline = 5.0
): number {
  const deltaT = canopyTemp - airTemp;
  const range = upperBaseline - lowerBaseline;
  
  if (range <= 0) return 0;

  const rawCWSI = (deltaT - lowerBaseline) / range;
  const clampedCWSI = Math.min(1.0, Math.max(0.0, rawCWSI));

  return Math.round(clampedCWSI * 100) / 100;
}

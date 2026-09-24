/**
 * Level 4: Fungal Disease Risk (Wallin / Mills Model).
 *
 * NOTE: Unlike purely instantaneous formulas, fungal spore germination requires
 * extended continuous leaf wetness hours at favourable temperatures.
 * The pure evaluation helper takes aggregated wetness hours and average temperature.
 *
 * @param leafWetnessHours Number of consecutive hours leaf wetness > 0 (or > threshold)
 * @param avgTempC Average temperature during the leaf wetness period
 * @returns Risk score from 0.0 (None) to 1.0 (Critical infection risk)
 */
export function calculateFungalRiskScore(leafWetnessHours: number, avgTempC: number): number {
  // Spore germination thrives between 15°C and 28°C
  if (avgTempC < 10 || avgTempC > 32 || leafWetnessHours < 3) {
    return 0.0;
  }

  let tempFactor = 0;
  if (avgTempC >= 18 && avgTempC <= 25) {
    tempFactor = 1.0; // Optimum incubation range
  } else if (avgTempC >= 15 && avgTempC < 18) {
    tempFactor = 0.7;
  } else {
    tempFactor = 0.4;
  }

  // Risk increases with consecutive wetness hours
  // >= 12 hours is high risk, >= 20 hours is critical
  const wetnessFactor = Math.min(1.0, leafWetnessHours / 16);
  const risk = tempFactor * wetnessFactor;

  return Math.round(risk * 100) / 100;
}

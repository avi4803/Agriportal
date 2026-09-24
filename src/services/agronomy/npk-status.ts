export interface CropNPKBaseline {
  targetN: number; // ppm or mg/kg
  targetP: number;
  targetK: number;
}

export const DEFAULT_CROP_BASELINES: Record<string, CropNPKBaseline> = {
  DEFAULT: { targetN: 140, targetP: 50, targetK: 200 },
  WHEAT: { targetN: 160, targetP: 45, targetK: 180 },
  CORN: { targetN: 200, targetP: 60, targetK: 220 },
  SOYBEAN: { targetN: 120, targetP: 50, targetK: 160 },
  VINEYARD: { targetN: 100, targetP: 35, targetK: 150 },
};

/**
 * Level 5: NPK Status & Fertilizer Depletion Index.
 * Computes overall nutrient adequacy score from 0% (critical deficit) to 100% (optimal).
 */
export function calculateNPKStatus(
  npkN: number,
  npkP: number,
  npkK: number,
  cropType = 'DEFAULT'
): number {
  const baseline = DEFAULT_CROP_BASELINES[cropType.toUpperCase()] || DEFAULT_CROP_BASELINES.DEFAULT;

  const ratioN = Math.min(1.0, npkN / baseline.targetN);
  const ratioP = Math.min(1.0, npkP / baseline.targetP);
  const ratioK = Math.min(1.0, npkK / baseline.targetK);

  // Overall NPK health index (0 to 100)
  const healthScore = ((ratioN + ratioP + ratioK) / 3) * 100;
  return Math.round(healthScore * 10) / 10;
}

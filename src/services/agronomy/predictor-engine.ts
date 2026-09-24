import { calculateVPD } from './vpd.js';
import { calculateCWSI } from './cwsi.js';
import { calculateIrrigationNeed } from './soil-hydrology.js';
import { calculateNPKStatus } from './npk-status.js';
import { calculateFungalRiskScore } from './fungal-risk.js';

export interface PredictorLevel {
  type: 'VPD' | 'IRRIGATION_NEED' | 'CWSI' | 'FUNGAL_RISK' | 'NPK_STATUS';
  keys: string[];
  run: (payload: Record<string, any>) => { value: number; meta?: Record<string, any> } | null;
}

/**
 * Single source of truth for all agronomic prediction capabilities.
 * Shared between ingestion real-time processing and device capabilities checks.
 */
export const LEVELS: PredictorLevel[] = [
  {
    type: 'VPD',
    keys: ['temp', 'humidity'],
    run: (p) => {
      const vpd = calculateVPD(Number(p.temp), Number(p.humidity));
      return { value: vpd, meta: { formula: 'Tetens', unit: 'kPa' } };
    },
  },
  {
    type: 'IRRIGATION_NEED',
    keys: ['topsoilMoisture', 'deepSoilMoisture'],
    run: (p) => {
      const need = calculateIrrigationNeed(Number(p.topsoilMoisture), Number(p.deepSoilMoisture));
      return { value: need, meta: { unit: '%' } };
    },
  },
  {
    type: 'CWSI',
    keys: ['canopyTemp', 'temp'],
    run: (p) => {
      const cwsi = calculateCWSI(Number(p.canopyTemp), Number(p.temp));
      return { value: cwsi, meta: { formula: 'Normalized Depression', index: cwsi } };
    },
  },
  {
    type: 'FUNGAL_RISK',
    keys: ['leafWetness', 'temp'],
    run: (p) => {
      // Instantaneous proxy / leaf wetness indicator
      const wetnessHours = Number(p.leafWetness) > 0 ? (Number(p.leafWetnessHours) || 6) : 0;
      const risk = calculateFungalRiskScore(wetnessHours, Number(p.temp));
      return { value: risk, meta: { model: 'Wallin/Mills', leafWetness: p.leafWetness } };
    },
  },
  {
    type: 'NPK_STATUS',
    keys: ['npkN', 'npkP', 'npkK'],
    run: (p) => {
      const score = calculateNPKStatus(Number(p.npkN), Number(p.npkP), Number(p.npkK));
      return { value: score, meta: { score, unit: 'health_index_pct' } };
    },
  },
];

export interface EvaluatedPrediction {
  type: string;
  value: number;
  meta?: Record<string, any>;
}

export class PredictorEngine {
  /**
   * Cascading key inspection: executes every level whose required keys exist in payload.
   */
  evaluate(payload: Record<string, any>): EvaluatedPrediction[] {
    const results: EvaluatedPrediction[] = [];

    for (const level of LEVELS) {
      const hasAllKeys = level.keys.every((key) => payload[key] !== undefined && payload[key] !== null);
      if (hasAllKeys) {
        try {
          const res = level.run(payload);
          if (res) {
            results.push({
              type: level.type,
              value: res.value,
              meta: res.meta,
            });
          }
        } catch {
          // Skip invalid evaluation for this packet without failing ingestion
        }
      }
    }

    return results;
  }

  /**
   * Device capabilities check: Inspects recent packets to detect unlocked capabilities.
   */
  getDeviceCapabilities(recentPayloads: Record<string, any>[]) {
    // Combine keys seen across recent packets
    const seenKeys = new Set<string>();
    for (const p of recentPayloads) {
      if (p && typeof p === 'object') {
        Object.keys(p).forEach((k) => seenKeys.add(k));
      }
    }

    return LEVELS.map((level) => {
      const missingKeys = level.keys.filter((key) => !seenKeys.has(key));
      return {
        type: level.type,
        unlocked: missingKeys.length === 0,
        missingKeys,
      };
    });
  }
}

export const predictorEngine = new PredictorEngine();

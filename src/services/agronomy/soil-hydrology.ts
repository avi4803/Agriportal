/**
 * Level 2: Soil Hydrology & Root-Zone Irrigation Need.
 * Evaluates topsoil vs deep root-zone volumetric water content.
 *
 * @param topsoilMoisture Topsoil moisture percentage (0-100)
 * @param deepSoilMoisture Deep root-zone soil moisture percentage (0-100)
 * @param fieldCapacity Target field capacity (default 38%)
 * @param wiltingPoint Permanent wilting point (default 18%)
 * @returns Infiltration index / deficit deficit percentage (0-100%)
 */
export function calculateIrrigationNeed(
  topsoilMoisture: number,
  deepSoilMoisture: number,
  fieldCapacity = 38,
  wiltingPoint = 18
): number {
  // Weighted moisture (40% topsoil, 60% deep root-zone)
  const effectiveMoisture = (topsoilMoisture * 0.4) + (deepSoilMoisture * 0.6);
  
  if (effectiveMoisture >= fieldCapacity) {
    return 0; // Soil is saturated or at field capacity
  }

  const deficit = ((fieldCapacity - effectiveMoisture) / (fieldCapacity - wiltingPoint)) * 100;
  return Math.round(Math.min(100, Math.max(0, deficit)) * 10) / 10;
}

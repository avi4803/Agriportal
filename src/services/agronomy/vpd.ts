/**
 * Pure agronomic formula: Vapor Pressure Deficit (VPD) & Dew Point via Tetens Equation.
 *
 * e_s(T) = 0.61078 * exp((17.27 * T) / (T + 237.3))  [saturation vapor pressure in kPa]
 * e_a = e_s(T) * (RH / 100)                          [actual vapor pressure in kPa]
 * VPD = e_s(T) - e_a                                  [VPD in kPa]
 *
 * @param tempC Air temperature in Celsius
 * @param relativeHumidityPct Relative Humidity percentage (0-100)
 * @returns VPD in kPa rounded to 3 decimal places
 */
export function calculateVPD(tempC: number, relativeHumidityPct: number): number {
  if (relativeHumidityPct < 0 || relativeHumidityPct > 100) {
    throw new Error('Relative humidity must be between 0 and 100');
  }

  const es = 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  const ea = es * (relativeHumidityPct / 100);
  const vpd = es - ea;

  return Math.round(Math.max(0, vpd) * 1000) / 1000;
}

/**
 * Calculates Dew Point in Celsius via Magnus-Tetens approximation.
 */
export function calculateDewPoint(tempC: number, relativeHumidityPct: number): number {
  const a = 17.27;
  const b = 237.3;
  const alpha = ((a * tempC) / (b + tempC)) + Math.log(Math.max(0.01, relativeHumidityPct) / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  return Math.round(dewPoint * 100) / 100;
}

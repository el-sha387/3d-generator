/**
 * Berechnet Gewicht und Materialkosten aus Volumen
 */
export function calcFilament(volumeMm3, options = {}) {
  const {
    density    = 1.24,  // PLA g/cm³
    pricePerKg = 20,    // € / kg
  } = options

  const cm3    = volumeMm3 / 1000
  const grams  = cm3 * density
  const cost   = (grams / 1000) * pricePerKg

  return {
    cm3:   cm3.toFixed(2),
    grams: grams.toFixed(1),
    cost:  cost < 0.01 ? '<0.01' : cost.toFixed(2),
  }
}

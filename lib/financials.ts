import type { ModelInputs, ModelOutputs, RevenuePoint } from './types'

const PROJECTION_YEARS = 10

/**
 * Build a 10-year revenue ramp and compute base-case NPV and risk-adjusted eNPV.
 * This is a simplified peak-sales valuation model intended for directional
 * commercial intelligence, not a substitute for a full DCF.
 */
export function computeModel(inputs: ModelInputs): ModelOutputs {
  const { peakSalesUsdM, yearsToPeak, launchYear, discountRate, pos } = inputs

  const peakOffset = Math.max(0, Math.min(yearsToPeak, PROJECTION_YEARS - 1))
  const revenueByYear: RevenuePoint[] = []

  let baseNpv = 0
  let enpv = 0

  for (let i = 0; i < PROJECTION_YEARS; i++) {
    let fraction: number
    if (i < peakOffset) {
      // Linear uptake toward peak
      fraction = (i + 1) / (peakOffset + 1)
    } else {
      // Plateau with gentle post-peak erosion (loss of exclusivity drag)
      fraction = Math.pow(0.96, i - peakOffset)
    }

    const base = peakSalesUsdM * fraction
    const riskAdjusted = base * pos
    const discountFactor = 1 / Math.pow(1 + discountRate, i + 1)

    baseNpv += base * discountFactor
    enpv += riskAdjusted * discountFactor

    revenueByYear.push({
      year: String(launchYear + i),
      base: Math.round(base),
      riskAdjusted: Math.round(riskAdjusted),
    })
  }

  return {
    revenueByYear,
    baseNpvUsdM: Math.round(baseNpv),
    enpvUsdM: Math.round(enpv),
  }
}

/** eNPV across a range of discount rates, for the sensitivity graphic. */
export function sensitivityByDiscountRate(
  inputs: ModelInputs,
  rates: number[] = [0.08, 0.1, 0.12, 0.14, 0.16],
): { rate: number; enpvUsdM: number }[] {
  return rates.map((rate) => ({
    rate,
    enpvUsdM: computeModel({ ...inputs, discountRate: rate }).enpvUsdM,
  }))
}

/** Format a USD-millions figure into a compact human string. */
export function formatUsdM(valueUsdM: number): string {
  if (valueUsdM >= 1000) {
    return `$${(valueUsdM / 1000).toFixed(2)}B`
  }
  return `$${Math.round(valueUsdM).toLocaleString()}M`
}

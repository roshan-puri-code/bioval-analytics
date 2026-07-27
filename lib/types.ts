export type RiskLevel = 'Low' | 'Medium' | 'High'

export interface Competitor {
  name: string
  company: string
  phase: string
}

export interface RevenuePoint {
  /** Calendar year label, e.g. "2027" */
  year: string
  /** Base-case (unadjusted) annual sales in USD millions */
  base: number
  /** Risk-adjusted annual sales in USD millions */
  riskAdjusted: number
}

export interface ModelInputs {
  /** Estimated peak annual sales in USD millions */
  peakSalesUsdM: number
  /** Number of years after launch that peak sales is reached */
  yearsToPeak: number
  /** First full year of commercial sales */
  launchYear: number
  /** Annual discount rate as a decimal (e.g. 0.1 for 10%) */
  discountRate: number
  /** Probability of success (LoA) as a decimal (0-1) */
  pos: number
}

export interface ModelOutputs {
  revenueByYear: RevenuePoint[]
  /** Base-case net present value of projected sales, USD millions */
  baseNpvUsdM: number
  /** Risk-adjusted (expected) net present value, USD millions */
  enpvUsdM: number
}

export interface ReportData {
  query: string
  matchType: 'nct' | 'drug'
  dataSource: 'clinicaltrials.gov' | 'estimated'
  drugName: string
  nctId: string | null
  phaseLabel: string
  status: string
  sponsor: string
  indication: string
  /** Probability of success as a decimal (0-1) */
  pos: number
  posBasis: string

  // Model inputs (defaults the user can adjust)
  peakSalesUsdM: number
  yearsToPeak: number
  launchYear: number
  discountRate: number

  // AI commercial intelligence
  payerSentiment: {
    level: RiskLevel
    bullets: string[]
  }
  regulatoryOutlook: string[]
  competitors: Competitor[]
}

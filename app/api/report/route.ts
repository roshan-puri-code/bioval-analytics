import { generateObject } from 'ai'
import { z } from 'zod'
import {
  fetchTrialFacts,
  isNctId,
  POS_BY_PHASE,
  type TrialFacts,
} from '@/lib/clinical-trials'
import type { ReportData, RiskLevel } from '@/lib/types'

export const maxDuration = 30

const MODEL = 'openai/gpt-5.4-mini'

const insightSchema = z.object({
  refinedIndication: z
    .string()
    .describe('The primary therapeutic indication, cleaned up for display'),
  peakSalesUsdM: z
    .number()
    .describe('Estimated worldwide peak annual sales in USD millions'),
  yearsToPeak: z
    .number()
    .int()
    .describe('Years after launch to reach peak sales (typically 4-7)'),
  yearsToLaunch: z
    .number()
    .int()
    .describe('Estimated years from now until first commercial launch'),
  payerSentiment: z.object({
    level: z.enum(['Low', 'Medium', 'High']),
    bullets: z
      .array(z.string())
      .describe('Exactly 3 concise bullets on coverage / reimbursement risk'),
  }),
  regulatoryOutlook: z
    .array(z.string())
    .describe('Exactly 2 concise bullets on likely FDA feedback / hurdles'),
  competitors: z
    .array(
      z.object({
        name: z.string(),
        company: z.string(),
        phase: z.string(),
      }),
    )
    .describe('Exactly 3 major active competitors in the same indication'),
})

type Insight = z.infer<typeof insightSchema>

function fallbackInsight(facts: TrialFacts): Insight {
  return {
    refinedIndication: facts.indication,
    peakSalesUsdM: 1200,
    yearsToPeak: 5,
    yearsToLaunch: 3,
    payerSentiment: {
      level: 'Medium',
      bullets: [
        'Coverage likely to require step therapy through established standard-of-care options first.',
        'Prior authorization and specialty-pharmacy channels expected given the therapeutic class.',
        'Value narrative will hinge on durable outcomes versus incumbent regimens.',
      ],
    },
    regulatoryOutlook: [
      'FDA likely to scrutinize primary endpoint durability and long-term safety follow-up.',
      'Competitive class precedent suggests an advisory committee is possible before approval.',
    ],
    competitors: [
      { name: 'Comparator A', company: 'Incumbent Pharma', phase: 'Approved' },
      { name: 'Comparator B', company: 'Mid-cap Biotech', phase: 'Phase 3' },
      { name: 'Comparator C', company: 'Emerging Biotech', phase: 'Phase 2' },
    ],
  }
}

async function generateInsight(facts: TrialFacts): Promise<{
  insight: Insight
  usedAi: boolean
}> {
  try {
    const { object } = await generateObject({
      model: MODEL,
      schema: insightSchema,
      system:
        'You are a senior life-sciences commercialization analyst at a top-tier consulting firm. ' +
        'You produce sober, defensible commercial intelligence for drug assets. ' +
        'Base peak-sales estimates on the indication size, phase, and competitive intensity. ' +
        'Be specific and avoid hedging filler. Always return exactly the requested number of bullets/items.',
      prompt:
        `Produce a commercial intelligence assessment for the following clinical asset:\n\n` +
        `Drug: ${facts.drugName}\n` +
        `Indication: ${facts.indication}\n` +
        `Current phase: ${facts.phaseLabel}\n` +
        `Trial status: ${facts.status}\n` +
        `Sponsor: ${facts.sponsor}\n` +
        (facts.briefTitle ? `Trial: ${facts.briefTitle}\n` : ''),
    })
    return { insight: object, usedAi: true }
  } catch (err) {
    console.log('[v0] AI insight generation failed, using fallback:', err)
    return { insight: fallbackInsight(facts), usedAi: false }
  }
}

function estimatedFacts(query: string): TrialFacts {
  return {
    nctId: isNctId(query) ? query.trim().toUpperCase() : null,
    drugName: isNctId(query) ? query.trim().toUpperCase() : query.trim(),
    phaseLabel: 'Phase 2',
    phaseKey: 'PHASE2',
    status: 'Estimated (no registry match)',
    sponsor: 'Undisclosed Sponsor',
    indication: 'Not specified',
    briefTitle: '',
  }
}

export async function POST(req: Request) {
  const { query } = (await req.json()) as { query?: string }
  if (!query || !query.trim()) {
    return Response.json({ error: 'A drug name or NCT ID is required.' }, { status: 400 })
  }

  const trimmed = query.trim()
  const matched = await fetchTrialFacts(trimmed)
  const facts = matched ?? estimatedFacts(trimmed)

  const { insight, usedAi } = await generateInsight(facts)

  const posInfo = POS_BY_PHASE[facts.phaseKey]
  const currentYear = new Date().getFullYear()
  const launchYear = currentYear + Math.max(0, Math.min(insight.yearsToLaunch, 12))

  const report: ReportData = {
    query: trimmed,
    matchType: isNctId(trimmed) ? 'nct' : 'drug',
    dataSource: matched ? 'clinicaltrials.gov' : 'estimated',
    drugName: facts.drugName,
    nctId: facts.nctId,
    phaseLabel: facts.phaseLabel,
    status: facts.status,
    sponsor: facts.sponsor,
    indication: insight.refinedIndication || facts.indication,
    pos: posInfo.pos,
    posBasis: `${posInfo.label} — industry-standard likelihood of approval`,
    peakSalesUsdM: Math.max(50, Math.round(insight.peakSalesUsdM)),
    yearsToPeak: Math.max(2, Math.min(insight.yearsToPeak, 8)),
    launchYear,
    discountRate: 0.1,
    payerSentiment: {
      level: insight.payerSentiment.level as RiskLevel,
      bullets: insight.payerSentiment.bullets.slice(0, 3),
    },
    regulatoryOutlook: insight.regulatoryOutlook.slice(0, 2),
    competitors: insight.competitors.slice(0, 3),
  }

  return Response.json({ report, usedAi })
}

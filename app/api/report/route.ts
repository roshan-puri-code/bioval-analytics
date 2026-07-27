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

const MODEL = 'openai/gpt-4o-mini'

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

type Competitor = { name: string; company: string; phase: string }

// Curated real-world comparators keyed by indication. Each entry lists the
// keywords that identify the therapeutic area and the top marketed/late-stage
// competitors an analyst would benchmark against.
const COMPETITOR_MAP: {
  keywords: string[]
  competitors: Competitor[]
}[] = [
  {
    keywords: ['non-small', 'nsclc', 'lung'],
    competitors: [
      { name: 'Keytruda', company: 'Merck', phase: 'Approved' },
      { name: 'Opdivo', company: 'Bristol Myers Squibb', phase: 'Approved' },
      { name: 'Imfinzi', company: 'AstraZeneca', phase: 'Approved' },
    ],
  },
  {
    keywords: ['breast'],
    competitors: [
      { name: 'Enhertu', company: 'AstraZeneca / Daiichi Sankyo', phase: 'Approved' },
      { name: 'Ibrance', company: 'Pfizer', phase: 'Approved' },
      { name: 'Kisqali', company: 'Novartis', phase: 'Approved' },
    ],
  },
  {
    keywords: ['melanoma'],
    competitors: [
      { name: 'Keytruda', company: 'Merck', phase: 'Approved' },
      { name: 'Opdualag', company: 'Bristol Myers Squibb', phase: 'Approved' },
      { name: 'Tafinlar + Mekinist', company: 'Novartis', phase: 'Approved' },
    ],
  },
  {
    keywords: ['prostate'],
    competitors: [
      { name: 'Xtandi', company: 'Pfizer / Astellas', phase: 'Approved' },
      { name: 'Erleada', company: 'Johnson & Johnson', phase: 'Approved' },
      { name: 'Nubeqa', company: 'Bayer', phase: 'Approved' },
    ],
  },
  {
    keywords: ['multiple myeloma', 'myeloma'],
    competitors: [
      { name: 'Darzalex', company: 'Johnson & Johnson', phase: 'Approved' },
      { name: 'Revlimid', company: 'Bristol Myers Squibb', phase: 'Approved' },
      { name: 'Carvykti', company: 'Johnson & Johnson / Legend', phase: 'Approved' },
    ],
  },
  {
    keywords: ['leukemia', 'lymphoma', 'cll', 'nhl'],
    competitors: [
      { name: 'Imbruvica', company: 'AbbVie / Johnson & Johnson', phase: 'Approved' },
      { name: 'Calquence', company: 'AstraZeneca', phase: 'Approved' },
      { name: 'Venclexta', company: 'AbbVie / Genentech', phase: 'Approved' },
    ],
  },
  {
    keywords: ['colorectal', 'colon'],
    competitors: [
      { name: 'Avastin', company: 'Genentech / Roche', phase: 'Approved' },
      { name: 'Erbitux', company: 'Eli Lilly / Merck KGaA', phase: 'Approved' },
      { name: 'Stivarga', company: 'Bayer', phase: 'Approved' },
    ],
  },
  {
    keywords: ['pancreatic'],
    competitors: [
      { name: 'Abraxane', company: 'Bristol Myers Squibb', phase: 'Approved' },
      { name: 'Onivyde', company: 'Ipsen', phase: 'Approved' },
      { name: 'Lynparza', company: 'AstraZeneca / Merck', phase: 'Approved' },
    ],
  },
  {
    keywords: ['ovarian'],
    competitors: [
      { name: 'Lynparza', company: 'AstraZeneca / Merck', phase: 'Approved' },
      { name: 'Zejula', company: 'GSK', phase: 'Approved' },
      { name: 'Avastin', company: 'Genentech / Roche', phase: 'Approved' },
    ],
  },
  {
    keywords: ['diabetes', 'glycemic', 'type 2'],
    competitors: [
      { name: 'Ozempic', company: 'Novo Nordisk', phase: 'Approved' },
      { name: 'Mounjaro', company: 'Eli Lilly', phase: 'Approved' },
      { name: 'Jardiance', company: 'Boehringer Ingelheim / Eli Lilly', phase: 'Approved' },
    ],
  },
  {
    keywords: ['obesity', 'weight', 'overweight'],
    competitors: [
      { name: 'Wegovy', company: 'Novo Nordisk', phase: 'Approved' },
      { name: 'Zepbound', company: 'Eli Lilly', phase: 'Approved' },
      { name: 'Saxenda', company: 'Novo Nordisk', phase: 'Approved' },
    ],
  },
  {
    keywords: ["alzheimer", 'dementia', 'cognitive'],
    competitors: [
      { name: 'Leqembi', company: 'Eisai / Biogen', phase: 'Approved' },
      { name: 'Kisunla', company: 'Eli Lilly', phase: 'Approved' },
      { name: 'Aduhelm', company: 'Biogen', phase: 'Discontinued' },
    ],
  },
  {
    keywords: ['rheumatoid', 'arthritis', 'psoriatic'],
    competitors: [
      { name: 'Humira', company: 'AbbVie', phase: 'Approved' },
      { name: 'Rinvoq', company: 'AbbVie', phase: 'Approved' },
      { name: 'Enbrel', company: 'Amgen', phase: 'Approved' },
    ],
  },
  {
    keywords: ['psoriasis', 'atopic', 'eczema', 'dermatitis'],
    competitors: [
      { name: 'Dupixent', company: 'Sanofi / Regeneron', phase: 'Approved' },
      { name: 'Skyrizi', company: 'AbbVie', phase: 'Approved' },
      { name: 'Cosentyx', company: 'Novartis', phase: 'Approved' },
    ],
  },
  {
    keywords: ['crohn', 'ulcerative colitis', 'inflammatory bowel', 'ibd'],
    competitors: [
      { name: 'Stelara', company: 'Johnson & Johnson', phase: 'Approved' },
      { name: 'Entyvio', company: 'Takeda', phase: 'Approved' },
      { name: 'Rinvoq', company: 'AbbVie', phase: 'Approved' },
    ],
  },
  {
    keywords: ['asthma', 'copd', 'respiratory'],
    competitors: [
      { name: 'Dupixent', company: 'Sanofi / Regeneron', phase: 'Approved' },
      { name: 'Trelegy Ellipta', company: 'GSK', phase: 'Approved' },
      { name: 'Fasenra', company: 'AstraZeneca', phase: 'Approved' },
    ],
  },
  {
    keywords: ['multiple sclerosis', 'sclerosis'],
    competitors: [
      { name: 'Ocrevus', company: 'Genentech / Roche', phase: 'Approved' },
      { name: 'Tysabri', company: 'Biogen', phase: 'Approved' },
      { name: 'Kesimpta', company: 'Novartis', phase: 'Approved' },
    ],
  },
  {
    keywords: ['posttraumatic', 'post-traumatic', 'ptsd', 'stress disorder'],
    competitors: [
      { name: 'Zoloft (sertraline)', company: 'Pfizer', phase: 'Approved' },
      { name: 'Paxil (paroxetine)', company: 'GSK', phase: 'Approved' },
      { name: 'MDMA-assisted therapy', company: 'Lykos Therapeutics', phase: 'Phase 3' },
    ],
  },
  {
    keywords: ['depression', 'depressive', 'mdd'],
    competitors: [
      { name: 'Spravato', company: 'Johnson & Johnson', phase: 'Approved' },
      { name: 'Auvelity', company: 'Axsome Therapeutics', phase: 'Approved' },
      { name: 'Rexulti', company: 'Otsuka / Lundbeck', phase: 'Approved' },
    ],
  },
  {
    keywords: ['schizophrenia', 'psychosis', 'bipolar'],
    competitors: [
      { name: 'Cobenfy', company: 'Bristol Myers Squibb', phase: 'Approved' },
      { name: 'Vraylar', company: 'AbbVie', phase: 'Approved' },
      { name: 'Invega', company: 'Johnson & Johnson', phase: 'Approved' },
    ],
  },
  {
    keywords: ['heart failure', 'cardiovascular', 'hypertension', 'cardiac'],
    competitors: [
      { name: 'Entresto', company: 'Novartis', phase: 'Approved' },
      { name: 'Farxiga', company: 'AstraZeneca', phase: 'Approved' },
      { name: 'Jardiance', company: 'Boehringer Ingelheim / Eli Lilly', phase: 'Approved' },
    ],
  },
]

// Generic oncology fallback used when the indication is a cancer we do not
// have a specific map entry for.
const GENERIC_ONCOLOGY: Competitor[] = [
  { name: 'Keytruda', company: 'Merck', phase: 'Approved' },
  { name: 'Opdivo', company: 'Bristol Myers Squibb', phase: 'Approved' },
  { name: 'Tecentriq', company: 'Genentech / Roche', phase: 'Approved' },
]

const GENERIC_COMPETITORS: Competitor[] = [
  { name: 'Standard of Care', company: 'Established Incumbent', phase: 'Approved' },
  { name: 'Late-stage Challenger', company: 'Large-cap Pharma', phase: 'Phase 3' },
  { name: 'Emerging Entrant', company: 'Clinical-stage Biotech', phase: 'Phase 2' },
]

const ONCOLOGY_KEYWORDS = [
  'cancer',
  'carcinoma',
  'tumor',
  'tumour',
  'oncology',
  'neoplasm',
  'sarcoma',
  'glioma',
  'glioblastoma',
]

function fallbackCompetitors(indication: string): Competitor[] {
  const text = indication.toLowerCase()
  for (const entry of COMPETITOR_MAP) {
    if (entry.keywords.some((kw) => text.includes(kw))) {
      return entry.competitors
    }
  }
  if (ONCOLOGY_KEYWORDS.some((kw) => text.includes(kw))) {
    return GENERIC_ONCOLOGY
  }
  return GENERIC_COMPETITORS
}

// Dynamic Payer & Regulatory Insights Map
const INSIGHT_MAP: {
  keywords: string[]
  payerLevel: RiskLevel
  payerBullets: string[]
  regulatoryBullets: string[]
}[] = [
  {
    keywords: ['oncology', 'cancer', 'tumor', 'tumour', 'carcinoma', 'nsclc', 'breast', 'melanoma', 'prostate', 'myeloma', 'leukemia', 'sarcoma'],
    payerLevel: 'High',
    payerBullets: [
      'High acquisition cost will trigger intensive utilization management and prior authorization.',
      'Reimbursement contingent on clear overall survival (OS) or progression-free survival (PFS) benefit.',
      'Outpatient hospital (340B) and specialty oncology channel routing expected.',
    ],
    regulatoryBullets: [
      'Eligible for Accelerated Approval pathway if backed by robust surrogate endpoints.',
      'FDA expected to require post-marketing confirmatory trials (Phase 4 commitment).',
    ],
  },
  {
    keywords: ['diabetes', 'obesity', 'metabolic', 'glycemic', 'weight', 'overweight'],
    payerLevel: 'Low',
    payerBullets: [
      'High volume demand will drive aggressive step-therapy mandates behind incumbent GLP-1s.',
      'Formulary positioning will require substantial gross-to-net discounting and rebates.',
      'Employer group coverage variation may impact initial commercial adoption.',
    ],
    regulatoryBullets: [
      'FDA requires rigorous cardiovascular outcome trials (CVOT) to confirm long-term safety.',
      'Scrutiny focused on gastrointestinal tolerability, lean mass preservation, and patient retention.',
    ],
  },
  {
    keywords: ['alzheimer', 'dementia', 'depression', 'ptsd', 'schizophrenia', 'psychosis', 'mdd', 'cognitive', 'bipolar', 'sclerosis'],
    payerLevel: 'High',
    payerBullets: [
      'Payers will scrutinize clinical meaningfulness versus statistical significance in cognitive endpoints.',
      'Coverage with Evidence Development (CED) or registry requirements likely for full reimbursement.',
      'Restricted initial access to specialized centers with standardized diagnostic capability.',
    ],
    regulatoryBullets: [
      'Heightened FDA scrutiny regarding CNS penetration and long-term neuro safety profile.',
      'Advisory Committee (PCNS) meeting highly expected prior to regulatory decision.',
    ],
  },
  {
    keywords: ['heart', 'cardiovascular', 'cardiac', 'hypertension', 'arthritis', 'psoriasis', 'crohn', 'colitis', 'asthma', 'copd'],
    payerLevel: 'Medium',
    payerBullets: [
      'Broad formulary placement conditional on demonstrating reduced acute hospitalization rates.',
      'Step therapy mandated through established generic and biosimilar standard-of-care options.',
      'Commercial plans likely to push for outcomes-based pricing or value-based rebates.',
    ],
    regulatoryBullets: [
      'Standard 10-month FDA review cycle expected unless Granted Fast Track status.',
      'Requires multi-year durability data on safety endpoints before label expansion.',
    ],
  },
]

function fallbackInsight(facts: TrialFacts): Insight {
  const text = (facts.indication || facts.drugName || '').toLowerCase()
  const matched = INSIGHT_MAP.find((entry) =>
    entry.keywords.some((kw) => text.includes(kw))
  )

  const payerLevel = matched ? matched.payerLevel : 'Medium'
  const payerBullets = matched
    ? matched.payerBullets
    : [
        'Coverage likely to require step therapy through established standard-of-care options first.',
        'Prior authorization and specialty-pharmacy channels expected given the therapeutic class.',
        'Value narrative will hinge on durable outcomes versus incumbent regimens.',
      ]
  const regulatoryBullets = matched
    ? matched.regulatoryBullets
    : [
        'FDA likely to scrutinize primary endpoint durability and long-term safety follow-up.',
        'Competitive class precedent suggests an advisory committee is possible before approval.',
      ]

  return {
    refinedIndication: facts.indication !== 'Not specified' ? facts.indication : facts.drugName,
    peakSalesUsdM: 1200,
    yearsToPeak: 5,
    yearsToLaunch: 3,
    payerSentiment: {
      level: payerLevel,
      bullets: payerBullets,
    },
    regulatoryOutlook: regulatoryBullets,
    competitors: fallbackCompetitors(facts.indication),
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
    indication: query.trim(),
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

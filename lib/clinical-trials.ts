const API_BASE = 'https://clinicaltrials.gov/api/v2/studies'

export interface TrialFacts {
  nctId: string | null
  drugName: string
  phaseLabel: string
  phaseKey: PhaseKey
  status: string
  sponsor: string
  indication: string
  briefTitle: string
}

export type PhaseKey =
  | 'PRECLINICAL'
  | 'EARLY_PHASE1'
  | 'PHASE1'
  | 'PHASE1_2'
  | 'PHASE2'
  | 'PHASE2_3'
  | 'PHASE3'
  | 'FILED'
  | 'APPROVED'
  | 'NA'

/** Industry-standard likelihood of approval (LoA) from the given phase. */
export const POS_BY_PHASE: Record<PhaseKey, { pos: number; label: string }> = {
  PRECLINICAL: { pos: 0.08, label: 'Preclinical' },
  EARLY_PHASE1: { pos: 0.12, label: 'Early Phase 1' },
  PHASE1: { pos: 0.15, label: 'Phase 1' },
  PHASE1_2: { pos: 0.22, label: 'Phase 1/2' },
  PHASE2: { pos: 0.3, label: 'Phase 2' },
  PHASE2_3: { pos: 0.45, label: 'Phase 2/3' },
  PHASE3: { pos: 0.6, label: 'Phase 3' },
  FILED: { pos: 0.85, label: 'Filed / NDA' },
  APPROVED: { pos: 0.99, label: 'Approved' },
  NA: { pos: 0.2, label: 'Not Specified' },
}

const STATUS_LABELS: Record<string, string> = {
  RECRUITING: 'Recruiting',
  ACTIVE_NOT_RECRUITING: 'Active, not recruiting',
  COMPLETED: 'Completed',
  ENROLLING_BY_INVITATION: 'Enrolling by invitation',
  NOT_YET_RECRUITING: 'Not yet recruiting',
  TERMINATED: 'Terminated',
  SUSPENDED: 'Suspended',
  WITHDRAWN: 'Withdrawn',
  UNKNOWN: 'Unknown status',
}

export function isNctId(query: string): boolean {
  return /^nct\d{8}$/i.test(query.trim())
}

function mapPhases(phases: string[] | undefined): {
  key: PhaseKey
  label: string
} {
  if (!phases || phases.length === 0) return { key: 'NA', label: 'Not Specified' }
  const set = new Set(phases.map((p) => p.toUpperCase()))
  if (set.has('PHASE4')) return { key: 'APPROVED', label: 'Phase 4 (Post-Market)' }
  if (set.has('PHASE3') && set.has('PHASE2'))
    return { key: 'PHASE2_3', label: 'Phase 2/3' }
  if (set.has('PHASE3')) return { key: 'PHASE3', label: 'Phase 3' }
  if (set.has('PHASE2') && set.has('PHASE1'))
    return { key: 'PHASE1_2', label: 'Phase 1/2' }
  if (set.has('PHASE2')) return { key: 'PHASE2', label: 'Phase 2' }
  if (set.has('PHASE1')) return { key: 'PHASE1', label: 'Phase 1' }
  if (set.has('EARLY_PHASE1')) return { key: 'EARLY_PHASE1', label: 'Early Phase 1' }
  return { key: 'NA', label: 'Not Specified' }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseStudy(study: any, fallbackName: string): TrialFacts {
  const ps = study?.protocolSection ?? {}
  const id = ps.identificationModule ?? {}
  const statusMod = ps.statusModule ?? {}
  const design = ps.designModule ?? {}
  const sponsorMod = ps.sponsorCollaboratorsModule ?? {}
  const conditions = ps.conditionsModule?.conditions ?? []
  const interventions = ps.armsInterventionsModule?.interventions ?? []

  const phase = mapPhases(design.phases)
  const rawStatus = statusMod.overallStatus ?? 'UNKNOWN'

  const drugIntervention = interventions.find(
    (i: any) => i?.type === 'DRUG' || i?.type === 'BIOLOGICAL',
  )

  return {
    nctId: id.nctId ?? null,
    drugName: drugIntervention?.name ?? fallbackName,
    phaseLabel: phase.label,
    phaseKey: phase.key,
    status: STATUS_LABELS[rawStatus] ?? rawStatus,
    sponsor: sponsorMod.leadSponsor?.name ?? 'Undisclosed Sponsor',
    indication: conditions[0] ?? 'Not specified',
    briefTitle: id.briefTitle ?? '',
  }
}

/** Look up a study by NCT id or free-text drug/condition query. Returns null on miss. */
export async function fetchTrialFacts(query: string): Promise<TrialFacts | null> {
  const trimmed = query.trim()
  try {
    if (isNctId(trimmed)) {
      const res = await fetch(`${API_BASE}/${trimmed.toUpperCase()}`, {
        headers: { accept: 'application/json' },
        cache: 'no-store',
      })
      if (!res.ok) return null
      const study = await res.json()
      return parseStudy(study, trimmed.toUpperCase())
    }

    const params = new URLSearchParams({
      'query.term': trimmed,
      pageSize: '1',
      countTotal: 'false',
    })
    const res = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    const study = data?.studies?.[0]
    if (!study) return null
    return parseStudy(study, trimmed)
  } catch {
    return null
  }
}

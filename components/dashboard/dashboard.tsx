'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, Database } from 'lucide-react'
import { TopNav } from './top-nav'
import { PipelineSnapshot } from './pipeline-snapshot'
import { ValuationModeler } from './valuation-modeler'
import { FinancialSummary } from './financial-summary'
import { AiInsights } from './ai-insights'
import { EmptyState, LoadingState } from './states'
import { Badge } from '@/components/ui/badge'
import { computeModel, sensitivityByDiscountRate } from '@/lib/financials'
import type { ReportData } from '@/lib/types'

interface Inputs {
  discountRate: number
  launchYear: number
  peakSalesUsdM: number
}

export function Dashboard() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ReportData | null>(null)
  const [usedAi, setUsedAi] = useState(false)
  const [inputs, setInputs] = useState<Inputs>({
    discountRate: 0.1,
    launchYear: new Date().getFullYear() + 3,
    peakSalesUsdM: 1000,
  })

  async function runReport(rawQuery: string) {
    const q = rawQuery.trim()
    if (!q || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = (await res.json()) as { report: ReportData; usedAi: boolean }
      setReport(data.report)
      setUsedAi(data.usedAi)
      setInputs({
        discountRate: data.report.discountRate,
        launchYear: data.report.launchYear,
        peakSalesUsdM: data.report.peakSalesUsdM,
      })
    } catch {
      setError('Unable to generate the report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const model = useMemo(() => {
    if (!report) return null
    return computeModel({
      peakSalesUsdM: inputs.peakSalesUsdM,
      yearsToPeak: report.yearsToPeak,
      launchYear: inputs.launchYear,
      discountRate: inputs.discountRate,
      pos: report.pos,
    })
  }, [report, inputs])

  const sensitivity = useMemo(() => {
    if (!report) return []
    return sensitivityByDiscountRate({
      peakSalesUsdM: inputs.peakSalesUsdM,
      yearsToPeak: report.yearsToPeak,
      launchYear: inputs.launchYear,
      discountRate: inputs.discountRate,
      pos: report.pos,
    })
  }, [report, inputs])

  return (
    <div className="min-h-screen">
      <TopNav
        value={query}
        onChange={setQuery}
        onSubmit={() => runReport(query)}
        loading={loading}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : report && model ? (
          <div className="flex flex-col gap-6">
            {/* Report header */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {report.drugName}
              </h1>
              {report.nctId && (
                <Badge variant="outline" className="font-mono text-xs">
                  {report.nctId}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="gap-1.5 text-xs text-muted-foreground"
              >
                <Database className="h-3 w-3" />
                {report.dataSource === 'clinicaltrials.gov'
                  ? 'ClinicalTrials.gov'
                  : 'Estimated'}
              </Badge>
            </div>

            <PipelineSnapshot report={report} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
              <div className="lg:col-span-2">
                <ValuationModeler
                  revenueByYear={model.revenueByYear}
                  discountRate={inputs.discountRate}
                  launchYear={inputs.launchYear}
                  peakSalesUsdM={inputs.peakSalesUsdM}
                  onDiscountRateChange={(v) =>
                    setInputs((s) => ({ ...s, discountRate: v }))
                  }
                  onLaunchYearChange={(v) =>
                    setInputs((s) => ({ ...s, launchYear: v }))
                  }
                  onPeakSalesChange={(v) =>
                    setInputs((s) => ({ ...s, peakSalesUsdM: v }))
                  }
                />
              </div>
              <div>
                <FinancialSummary
                  baseNpvUsdM={model.baseNpvUsdM}
                  enpvUsdM={model.enpvUsdM}
                  pos={report.pos}
                  discountRate={inputs.discountRate}
                  sensitivity={sensitivity}
                />
              </div>
            </div>

            <AiInsights report={report} usedAi={usedAi} />
          </div>
        ) : (
          <EmptyState onExample={(q) => { setQuery(q); runReport(q) }} />
        )}
      </main>
    </div>
  )
}

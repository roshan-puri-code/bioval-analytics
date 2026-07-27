import { Wallet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatUsdM } from '@/lib/financials'

interface FinancialSummaryProps {
  baseNpvUsdM: number
  enpvUsdM: number
  pos: number
  discountRate: number
  sensitivity: { rate: number; enpvUsdM: number }[]
}

export function FinancialSummary({
  baseNpvUsdM,
  enpvUsdM,
  pos,
  discountRate,
  sensitivity,
}: FinancialSummaryProps) {
  const maxSens = Math.max(...sensitivity.map((s) => s.enpvUsdM), 1)

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-primary">
            <Wallet className="h-4 w-4" />
          </span>
          <div>
            <CardTitle>Estimated Valuations</CardTitle>
            <CardDescription>Discounted at {Math.round(discountRate * 1000) / 10}%</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="rounded-lg border border-border bg-secondary/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Base Case NPV
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-tight tabular-nums">
            {formatUsdM(baseNpvUsdM)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Unadjusted for clinical risk</p>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            eNPV (Risk-Adjusted)
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-tight tabular-nums text-primary">
            {formatUsdM(enpvUsdM)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Applied PoS of {Math.round(pos * 100)}%
          </p>
        </div>

        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            eNPV Sensitivity to Discount Rate
          </p>
          <div className="flex flex-col gap-2">
            {sensitivity.map((s) => {
              const active = Math.abs(s.rate - discountRate) < 0.001
              return (
                <div key={s.rate} className="flex items-center gap-3">
                  <span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {Math.round(s.rate * 100)}%
                  </span>
                  <div className="h-4 flex-1 overflow-hidden rounded-sm bg-muted">
                    <div
                      className={active ? 'h-full rounded-sm bg-primary' : 'h-full rounded-sm bg-chart-2'}
                      style={{ width: `${(s.enpvUsdM / maxSens) * 100}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right font-mono text-xs tabular-nums text-foreground">
                    {formatUsdM(s.enpvUsdM)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

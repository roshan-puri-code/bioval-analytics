import type { LucideIcon } from 'lucide-react'
import { Beaker, Building2, Target, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { ReportData } from '@/lib/types'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: string
  sub: string
}

function MetricCard({ icon: Icon, label, value, sub }: MetricCardProps) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-balance">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground text-pretty">{sub}</p>
    </Card>
  )
}

export function PipelineSnapshot({ report }: { report: ReportData }) {
  const posPct = `${Math.round(report.pos * 100)}%`

  return (
    <section aria-labelledby="pipeline-heading">
      <h2 id="pipeline-heading" className="sr-only">
        Pipeline snapshot
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Beaker}
          label="Current Trial Phase"
          value={report.phaseLabel}
          sub={report.status}
        />
        <MetricCard
          icon={TrendingUp}
          label="Probability of Success"
          value={posPct}
          sub={report.posBasis}
        />
        <MetricCard
          icon={Building2}
          label="Sponsor Company"
          value={report.sponsor}
          sub={report.nctId ? report.nctId : 'Lead sponsor'}
        />
        <MetricCard
          icon={Target}
          label="Primary Indication"
          value={report.indication}
          sub="Lead indication under evaluation"
        />
      </div>
    </section>
  )
}

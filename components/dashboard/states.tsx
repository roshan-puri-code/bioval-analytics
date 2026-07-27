import { Activity, FlaskConical } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const EXAMPLES = ['NCT04852770', 'Trikafta', 'Semaglutide', 'Donanemab']

export function EmptyState({ onExample }: { onExample: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
        <FlaskConical className="h-7 w-7" />
      </span>
      <h1 className="mt-6 max-w-xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
        Commercial intelligence for any drug asset
      </h1>
      <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
        Enter a drug name or ClinicalTrials.gov NCT ID to generate a risk-adjusted
        valuation model, payer sentiment analysis, and competitive landscape.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => onExample(ex)}
            className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}

export function LoadingState() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Activity className="h-4 w-4 animate-pulse text-primary" />
        Pulling registry data and generating commercial intelligence...
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-7 w-32" />
            <Skeleton className="mt-2 h-3 w-28" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="mt-6 h-[280px] w-full" />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-6 h-20 w-full" />
          <Skeleton className="mt-4 h-20 w-full" />
        </Card>
      </div>
      <Card className="p-6">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="mt-6 h-24 w-full" />
      </Card>
    </div>
  )
}

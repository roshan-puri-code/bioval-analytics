import { Sparkles, ShieldCheck, Landmark, Swords, Dot } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ReportData, RiskLevel } from '@/lib/types'

function riskBadgeClass(level: RiskLevel): string {
  switch (level) {
    case 'Low':
      return 'border-success/40 bg-success/15 text-success'
    case 'High':
      return 'border-destructive/40 bg-destructive/15 text-destructive'
    default:
      return 'border-warning/40 bg-warning/15 text-warning'
  }
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
      <Dot className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={4} />
      <span className="text-pretty">{children}</span>
    </li>
  )
}

export function AiInsights({ report, usedAi }: { report: ReportData; usedAi: boolean }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <CardTitle>AI Commercial &amp; Payer Summary</CardTitle>
              <CardDescription>
                Generated market-access, regulatory, and competitive intelligence
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            {usedAi ? 'AI generated' : 'Model estimate'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6">
          {/* Payer sentiment */}
          <section className="lg:border-r lg:border-border lg:pr-6">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Payer Sentiment</h3>
              <Badge
                variant="outline"
                className={`ml-auto ${riskBadgeClass(report.payerSentiment.level)}`}
              >
                {report.payerSentiment.level} Risk
              </Badge>
            </div>
            <ul className="flex flex-col gap-2.5">
              {report.payerSentiment.bullets.map((b, i) => (
                <Bullet key={i}>{b}</Bullet>
              ))}
            </ul>
          </section>

          {/* Regulatory outlook */}
          <section className="lg:border-r lg:border-border lg:pr-6">
            <div className="mb-3 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Regulatory Outlook</h3>
            </div>
            <ul className="flex flex-col gap-2.5">
              {report.regulatoryOutlook.map((b, i) => (
                <Bullet key={i}>{b}</Bullet>
              ))}
            </ul>
          </section>

          {/* Competitive landscape */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Swords className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Competitive Landscape</h3>
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Asset</th>
                    <th className="px-3 py-2 font-medium">Company</th>
                    <th className="px-3 py-2 text-right font-medium">Phase</th>
                  </tr>
                </thead>
                <tbody>
                  {report.competitors.map((c, i) => (
                    <tr
                      key={i}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-3 py-2.5 font-medium">{c.name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{c.company}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-mono text-xs tabular-nums text-primary">{c.phase}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { LineChart as LineChartIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { RevenuePoint } from '@/lib/types'

const chartConfig = {
  base: { label: 'Base-Case Sales', color: 'var(--chart-2)' },
  riskAdjusted: { label: 'Risk-Adjusted Sales', color: 'var(--chart-1)' },
} satisfies ChartConfig

interface ValuationModelerProps {
  revenueByYear: RevenuePoint[]
  discountRate: number
  launchYear: number
  peakSalesUsdM: number
  onDiscountRateChange: (value: number) => void
  onLaunchYearChange: (value: number) => void
  onPeakSalesChange: (value: number) => void
}

export function ValuationModeler({
  revenueByYear,
  discountRate,
  launchYear,
  peakSalesUsdM,
  onDiscountRateChange,
  onLaunchYearChange,
  onPeakSalesChange,
}: ValuationModelerProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-primary">
            <LineChartIcon className="h-4 w-4" />
          </span>
          <div>
            <CardTitle>Risk-Adjusted Peak Sales Model</CardTitle>
            <CardDescription>
              Projected worldwide annual sales (USD, millions) over 10 years
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart data={revenueByYear} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              fontSize={11}
              tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}B` : `${v}M`)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                      </span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {`$${Number(value).toLocaleString()}M`}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="base" fill="var(--color-base)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="riskAdjusted" fill="var(--color-riskAdjusted)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartContainer>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="discount-rate" className="text-xs text-muted-foreground">
              Discount Rate (%)
            </Label>
            <Input
              id="discount-rate"
              type="number"
              min={0}
              max={40}
              step={0.5}
              value={Math.round(discountRate * 1000) / 10}
              onChange={(e) => onDiscountRateChange((Number(e.target.value) || 0) / 100)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="launch-year" className="text-xs text-muted-foreground">
              Estimated Launch Year
            </Label>
            <Input
              id="launch-year"
              type="number"
              min={2024}
              max={2045}
              step={1}
              value={launchYear}
              onChange={(e) => onLaunchYearChange(Number(e.target.value) || launchYear)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="peak-sales" className="text-xs text-muted-foreground">
              Peak Sales ($M)
            </Label>
            <Input
              id="peak-sales"
              type="number"
              min={0}
              step={50}
              value={peakSalesUsdM}
              onChange={(e) => onPeakSalesChange(Number(e.target.value) || 0)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

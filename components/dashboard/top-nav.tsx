'use client'

import type React from 'react'
import { Activity, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface TopNavProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  loading: boolean
}

export function TopNav({ value, onChange, onSubmit, loading }: TopNavProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="hidden flex-col leading-none sm:flex">
            <span className="text-sm font-semibold tracking-tight">BioVal Analytics</span>
            <span className="text-[11px] text-muted-foreground">Commercial Intelligence</span>
          </div>
        </div>

        <form
          className="relative flex flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter Drug Name or NCT ID"
              aria-label="Enter Drug Name or NCT ID"
              className="h-10 pl-9"
            />
          </div>
          <Button type="submit" disabled={loading} className="h-10 gap-2 px-4">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{loading ? 'Analyzing' : 'Search'}</span>
          </Button>
        </form>

        <Avatar className="h-9 w-9 shrink-0 border border-border">
          <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
            AC
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}

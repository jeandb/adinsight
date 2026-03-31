import { useState } from 'react'
import { Download, ChevronDown, FileText, Table, FileSpreadsheet } from 'lucide-react'
import { reportsApi, type ExportParams } from './reports.api'
import { cn } from '@/lib/utils'

interface ExportButtonProps {
  scope: ExportParams['scope']
  from: string
  to: string
}

const FORMATS: Array<{ value: ExportParams['format']; label: string; icon: React.ElementType }> = [
  { value: 'pdf',   label: 'Exportar PDF',   icon: FileText },
  { value: 'excel', label: 'Exportar Excel',  icon: FileSpreadsheet },
  { value: 'csv',   label: 'Exportar CSV',    icon: Table },
]

export function ExportButton({ scope, from, to }: ExportButtonProps) {
  const [open, setOpen] = useState(false)

  function download(format: ExportParams['format']) {
    const url = reportsApi.exportUrl({ scope, format, from, to })
    const a = document.createElement('a')
    a.href = url
    a.click()
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 border border-border bg-card text-foreground rounded-lg text-sm hover:bg-accent transition-colors"
      >
        <Download className="w-4 h-4" />
        Exportar
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 bg-card border border-border rounded-xl shadow-lg py-1 overflow-hidden">
            {FORMATS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => download(value)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

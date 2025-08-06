'use client'

import { Render } from "@measured/puck"
import { config } from "@/lib/puck-config"
import type { Data } from "@measured/puck"

interface PageRendererProps {
  data: Data
  className?: string
}

export default function PageRenderer({ data, className = "" }: PageRendererProps) {
  return (
    <div className={`page-renderer ${className}`}>
      <Render config={config} data={data} />
    </div>
  )
}

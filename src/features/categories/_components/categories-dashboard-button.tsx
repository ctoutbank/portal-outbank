"use client"

import { Button } from "@/components/ui/button"
import { LayoutGrid, ChevronRight } from "lucide-react"
import { useState } from "react"

export function CategoriesDashboardButton({
  children
}: {
  children: React.ReactNode
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div>
      <Button
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2"
      >
        <LayoutGrid className="h-4 w-4" />
        Dashboard
        <ChevronRight
          className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${
            isExpanded ? "rotate-90" : ""
          }`}
        />
      </Button>
      {isExpanded && children}
    </div>
  )
}
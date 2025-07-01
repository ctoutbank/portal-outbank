"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { CategoriesFilterButton } from "./categories-filter-button"
import { CategoriesFilterContent } from "./categories-filter-content"
import { useState } from "react"

type CategoriesFilterProps = {
  nameIn?: string
  statusIn?: string
  mccIn?: string
  cnaeIn?: string
}

export function CategoriesFilter(props: CategoriesFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = new URLSearchParams(searchParams?.toString() || "")
  const [isFiltersVisible, setIsFiltersVisible] = useState(false)



  const handleFilter = (filters: {
    name: string
    status: string
    mcc: string
    cnae: string
  }) => {
    if (filters.name) {
      params.set("name", filters.name)
    } else {
      params.delete("name")
    }
    if (filters.status) {
      params.set("status", filters.status)
    } else {
      params.delete("status")
    }
    if (filters.mcc) {
      params.set("mcc", filters.mcc)
    } else {
      params.delete("mcc")
    }
    if (filters.cnae) {
      params.set("cnae", filters.cnae)
    } else {
      params.delete("cnae")
    }
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  const handleClearFilters = () => {
    params.delete("name")
    params.delete("status")
    params.delete("mcc")
    params.delete("cnae")
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  const activeFiltersCount =
    (props.nameIn ? 1 : 0) +
    (props.statusIn ? 1 : 0) +
    (props.mccIn ? 1 : 0) +
    (props.cnaeIn ? 1 : 0)

  return (
    <CategoriesFilterButton
      activeFiltersCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      isFiltersVisible={isFiltersVisible}
      onVisibilityChange={setIsFiltersVisible}
    >
      <CategoriesFilterContent
        nameIn={props.nameIn}
        statusIn={props.statusIn}
        mccIn={props.mccIn}
        cnaeIn={props.cnaeIn}
        onFilter={handleFilter}
        onClose={() => setIsFiltersVisible(false)}
      />
    </CategoriesFilterButton>
  )
}
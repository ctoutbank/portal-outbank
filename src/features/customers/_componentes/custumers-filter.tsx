"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { CustomersFilterButton } from "./customers-filter-button"
import { CustomersFilterContent } from "./customers-filter-content"
import { useState } from "react"

type CustomersFilterProps = {
  nameIn?: string
  customerIdIn?: string
  userNameIn?: string
}

export function CustomersFilter(props: CustomersFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = new URLSearchParams(searchParams?.toString() || "")
  const [isFiltersVisible, setIsFiltersVisible] = useState(false)

  const handleFilter = (name: string, userName: string) => {
    if (name) {
      params.set("name", name)
    } else {
      params.delete("name")
    }
       
    if (userName) {
      params.set("userName", userName)
    } else {
      params.delete("userName")
    }
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  const handleClearFilters = () => {
    params.delete("name")
    params.delete("customerId")
    params.delete("userName")
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  const activeFiltersCount =
    (props.nameIn ? 1 : 0) +
    (props.customerIdIn ? 1 : 0) +
    (props.userNameIn ? 1 : 0)

  return (
    <CustomersFilterButton
      activeFiltersCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      isFiltersVisible={isFiltersVisible}
      onVisibilityChange={setIsFiltersVisible}
    >
      <CustomersFilterContent
        namein={props.nameIn}
        userNameIn={props.userNameIn}
        onFilter={handleFilter}
        onClose={() => setIsFiltersVisible(false)}
      />
    </CustomersFilterButton>
  )
}

"use client"

import React from "react"
import Image from "next/image"
import { FormControl, FormField } from "@/components/ui/form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SolicitationFeeProductTypeList } from "@/lib/lookuptables/lookuptables"
import { brandList } from "@/lib/lookuptables/lookuptables-transactions"
import type { CSSProperties } from "react"
import { useWatch } from "react-hook-form"
import { Control } from "react-hook-form";
import { PricingSolicitationSchemaAdmin } from "@/features/categories/schema/schema";

interface FeesSectionProps {
  control: Control<PricingSolicitationSchemaAdmin>
  isReadOnly?: boolean
}

const getCardImage = (cardName: string): string => {
  const cardMap: { [key: string]: string } = {
    MASTERCARD: "/mastercard.svg",
    VISA: "/visa.svg",
    ELO: "/elo.svg",
    AMERICAN_EXPRESS: "/american-express.svg",
    HIPERCARD: "/hipercard.svg",
    AMEX: "/american-express.svg",
    CABAL: "/cabal.svg",
  }
  return cardMap[cardName] || ""
}

// Style to remove all focus outlines and borders
const noFocusStyle: CSSProperties = {
  outline: "none",
  boxShadow: "none",
  border: "none",
}

// Custom percentage input component
function PercentageInput({
                           value,
                           onChange,
                           placeholder,
                           className,
                         }: {
  value: string | undefined
  onChange: (value: string) => void
  placeholder: string
  className?: string
}) {
  // Handle the input change and append % if needed
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value
    // Remove any % symbol if present
    newValue = newValue.replace(/%/g, "")
    // Only allow numbers and a single decimal point
    newValue = newValue.replace(/[^\d.,]/g, "")
    // Replace dots with commas for decimal separator
    newValue = newValue.replace(/\./g, ",")
    // Ensure only one decimal separator
    const parts = newValue.split(",")
    if (parts.length > 2) {
      newValue = parts[0] + "," + parts.slice(1).join("")
    }
    onChange(newValue)
  }

  return (
      <div className="relative w-full">
        <input
            type="text"
            value={value ? `${value}%` : ""}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
            style={noFocusStyle}
        />
      </div>
  )
}

// Custom currency input component
function CurrencyInput({
                         value,
                         onChange,
                         placeholder,
                         className,
                       }: {
  value: string | undefined
  onChange: (value: string) => void
  placeholder: string
  className?: string
}) {
  // Handle the input change and add R$ if needed
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value
    // Remove any R$ symbol if present
    newValue = newValue.replace(/R\$\s?/g, "")
    // Only allow numbers and a single decimal point
    newValue = newValue.replace(/[^\d.,]/g, "")
    // Replace dots with commas for decimal separator
    newValue = newValue.replace(/\./g, ",")
    // Ensure only one decimal separator
    const parts = newValue.split(",")
    if (parts.length > 2) {
      newValue = parts[0] + "," + parts.slice(1).join("")
    }
    onChange(newValue)
  }

  return (
      <div className="relative w-full">
        <input
            type="text"
            value={value ? `R$ ${value}` : ""}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
            style={noFocusStyle}
        />
      </div>
  )
}

// POSBrandTable component for displaying POS brand fees
function POSBrandTable({
                         control,
                         isReadOnly = false,
                         
                       }: {
  control: Control<PricingSolicitationSchemaAdmin>
  isReadOnly?: boolean
 
  
}) {
  // Define payment types as columns
  const paymentTypes = SolicitationFeeProductTypeList
  const brandsValues = useWatch({ control, name: "brands" })

  return (
      <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="min-w-0">
          <h3 className="text-lg font-medium mb-4 text-foreground border-b border-border pb-2">Taxas Transações na POS</h3>
          <Table className="w-full min-w-[600px] border border-border rounded-none">
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="sticky left-0 z-10 bg-background text-sm font-medium text-foreground border-r border-border">
                Bandeiras
              </TableHead>
              {paymentTypes.map((type, index) => (
                  <TableHead
                      key={`payment-type-${type.value}-${index}`}
                      className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border"
                  >
                    {type.label}
                  </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {brandList.map((brand, brandIndex) => (
                <TableRow key={`pos-${brand.value}-${brandIndex}`} className="border-b border-border">
                  <TableCell className="font-medium sticky left-0 z-10 bg-background text-foreground border-r border-border">
                    <div className="flex items-center gap-2">
                      {getCardImage(brand.value) && (
                          <Image
                              src={getCardImage(brand.value) || "/placeholder.svg"}
                              alt={brand.label}
                              width={40}
                              height={24}
                              className="object-contain"
                          />
                      )}
                      {brand.label}
                    </div>
                  </TableCell>
                  {paymentTypes.map((type, typeIndex) => (
                      <TableCell
                          key={`pos-brand-${brand.value}-${type.value}-${typeIndex}`}
                          className="p-1 text-center border-r border-border"
                      >
                        {isReadOnly ? (
                            <div className="rounded-none py-1 px-3 inline-block w-[70px] text-center bg-muted text-foreground border border-border">
                      <span>
                        {brandsValues?.[brandIndex]?.productTypes?.[typeIndex]?.feeAdmin
                            ? `${brandsValues[brandIndex].productTypes[typeIndex].feeAdmin}%`
                            : "-"}
                      </span>
                            </div>
                        ) : (
                            <FormField
                                control={control}
                                name={`brands.${brandIndex}.productTypes.${typeIndex}.feeAdmin`}
                                render={({ field }) => (
                                    <FormControl>
                                      <div className="rounded-none py-1 px-3 inline-block w-[70px] text-center bg-muted text-foreground border border-border">
                                        <PercentageInput
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="0%"
                                            className="border-0 p-0 h-auto text-center w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 rounded-none"
                                        />
                                      </div>
                                    </FormControl>
                                )}
                            />
                        )}
                      </TableCell>
                  ))}
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  )
}

// OnlineBrandTable component for displaying online brand fees
function OnlineBrandTable({
                            control,
                            isReadOnly = false,
                          }: {
  control: Control<PricingSolicitationSchemaAdmin>
  isReadOnly?: boolean
}) {
  // Define payment types as columns
  const paymentTypes = SolicitationFeeProductTypeList
  const brandsValues = useWatch({ control, name: "brands" })

  return (
      <div className="w-full overflow-x-auto mt-8 -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="min-w-0">
          <h3 className="text-lg font-medium mb-4 text-foreground border-b border-border pb-2">Taxas Transações Online</h3>
          <Table className="w-full min-w-[600px] border border-border rounded-none">
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="sticky left-0 z-10 bg-background text-sm font-medium text-foreground border-r border-border">
                Bandeiras
              </TableHead>
              {paymentTypes.map((type, index) => (
                  <TableHead
                      key={`online-payment-type-${type.value}-${index}`}
                      className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border"
                  >
                    {type.label}
                  </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {brandList.map((brand, brandIndex) => (
                <TableRow key={`online-${brand.value}-${brandIndex}`} className="border-b border-border">
                  <TableCell className="font-medium sticky left-0 z-10 bg-background text-foreground border-r border-border">
                    <div className="flex items-center gap-2">
                      {getCardImage(brand.value) && (
                          <Image
                              src={getCardImage(brand.value) || "/placeholder.svg"}
                              alt={brand.label}
                              width={40}
                              height={24}
                              className="object-contain"
                          />
                      )}
                      {brand.label}
                    </div>
                  </TableCell>
                  {paymentTypes.map((type, typeIndex) => (
                      <TableCell
                          key={`online-brand-${brand.value}-${type.value}-${typeIndex}`}
                          className="p-1 text-center border-r border-border"
                      >
                        {isReadOnly ? (
                            <div className="rounded-none py-1 px-3 inline-block w-[70px] text-center bg-muted text-foreground border border-border">
                      <span>
                        {brandsValues?.[brandIndex]?.productTypes?.[typeIndex]?.noCardFeeAdmin
                            ? `${brandsValues[brandIndex].productTypes[typeIndex].noCardFeeAdmin}%`
                            : "-"}
                      </span>
                            </div>
                        ) : (
                            <FormField
                                control={control}
                                name={`brands.${brandIndex}.productTypes.${typeIndex}.noCardFeeAdmin`}
                                render={({ field }) => (
                                    <FormControl>
                                      <div className="rounded-none py-1 px-3 inline-block w-[70px] text-center bg-muted text-foreground border border-border">
                                        <PercentageInput
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="0%"
                                            className="border-0 p-0 h-auto text-center w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 rounded-none"
                                        />
                                      </div>
                                    </FormControl>
                                )}
                            />
                        )}
                      </TableCell>
                  ))}
                </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>
  )
}

// PIX Fees Component
function PIXFeesSection({ control, isReadOnly = false }: { control: Control<PricingSolicitationSchemaAdmin>; isReadOnly?: boolean }) {
  const cardPixMdrAdmin = useWatch({ control, name: "cardPixMdrAdmin" })
  const cardPixMinimumCostFeeAdmin = useWatch({
    control,
    name: "cardPixMinimumCostFeeAdmin",
  })
  const cardPixCeilingFeeAdmin = useWatch({ control, name: "cardPixCeilingFeeAdmin" })
  const eventualAnticipationFeeAdmin = useWatch({
    control,
    name: "eventualAnticipationFeeAdmin",
  })

  return (
      <div className="mt-12 mb-6">
        <h3 className="text-lg font-medium mb-4 text-foreground border-b border-border pb-2">PIX</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <h4 className="font-medium mb-2 text-foreground">MDR</h4>
            <div className="flex gap-2">
              <div className="rounded-none py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{cardPixMdrAdmin ? `${cardPixMdrAdmin}%` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="cardPixMdrAdmin"
                        render={({ field }) => (
                            <FormControl>
                              <PercentageInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="0,01%"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 rounded-none"
                              />
                            </FormControl>
                        )}
                    />
                )}
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-foreground">Custo Mínimo</h4>
            <div className="flex gap-2">
              <div className="rounded-none py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{cardPixMinimumCostFeeAdmin ? `R$ ${cardPixMinimumCostFeeAdmin}` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="cardPixMinimumCostFeeAdmin"
                        render={({ field }) => (
                            <FormControl>
                              <CurrencyInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="R$ 0,09"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 rounded-none"
                              />
                            </FormControl>
                        )}
                    />
                )}
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-foreground">Custo Máximo</h4>
            <div className="flex gap-2">
              <div className="rounded-none py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{cardPixCeilingFeeAdmin ? `R$ ${cardPixCeilingFeeAdmin}` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="cardPixCeilingFeeAdmin"
                        render={({ field }) => (
                            <FormControl>
                              <CurrencyInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="R$ 0,09"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 rounded-none"
                              />
                            </FormControl>
                        )}
                    />
                )}
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-foreground">Antecipação</h4>
            <div className="flex gap-2">
              <div className="rounded-none py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{eventualAnticipationFeeAdmin ? `${eventualAnticipationFeeAdmin}%` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="eventualAnticipationFeeAdmin"
                        render={({ field }) => (
                            <FormControl>
                              <PercentageInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="1,67%"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 rounded-none"
                              />
                            </FormControl>
                        )}
                    />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

// NonCardPIXFeesSection Component for PIX without card
function NonCardPIXFeesSection({ control, isReadOnly = false }: { control: Control<PricingSolicitationSchemaAdmin>; isReadOnly?: boolean }) {
  const nonCardPixMdrAdmin = useWatch({ control, name: "nonCardPixMdrAdmin" })
  const nonCardPixMinimumCostFeeAdmin = useWatch({
    control,
    name: "nonCardPixMinimumCostFeeAdmin",
  })
  const nonCardPixCeilingFeeAdmin = useWatch({ control, name: "nonCardPixCeilingFeeAdmin" })
  const nonCardEventualAnticipationFeeAdmin = useWatch({
    control,
    name: "nonCardEventualAnticipationFeeAdmin",
  })

  return (
      <div className="mt-8 mb-6">
        <h3 className="text-lg font-medium mb-4 text-foreground border-b border-border pb-2">PIX sem Cartão</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <h4 className="font-medium mb-2 text-foreground">MDR</h4>
            <div className="flex gap-2">
              <div className="rounded-none py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{nonCardPixMdrAdmin ? `${nonCardPixMdrAdmin}%` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="nonCardPixMdrAdmin"
                        render={({ field }) => (
                            <FormControl>
                              <PercentageInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="0,01%"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 rounded-none"
                              />
                            </FormControl>
                        )}
                    />
                )}
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-foreground">Custo Mínimo</h4>
            <div className="flex gap-2">
              <div className="rounded-none py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{nonCardPixMinimumCostFeeAdmin ? `R$ ${nonCardPixMinimumCostFeeAdmin}` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="nonCardPixMinimumCostFeeAdmin"
                        render={({ field }) => (
                            <FormControl>
                              <CurrencyInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="R$ 0,09"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 rounded-none"
                              />
                            </FormControl>
                        )}
                    />
                )}
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-foreground">Custo Máximo</h4>
            <div className="flex gap-2">
              <div className="rounded-none py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{nonCardPixCeilingFeeAdmin ? `R$ ${nonCardPixCeilingFeeAdmin}` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="nonCardPixCeilingFeeAdmin"
                        render={({ field }) => (
                            <FormControl>
                              <CurrencyInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="R$ 0,09"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 rounded-none"
                              />
                            </FormControl>
                        )}
                    />
                )}
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-foreground">Antecipação</h4>
            <div className="flex gap-2">
              <div className="rounded-none py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{nonCardEventualAnticipationFeeAdmin ? `${nonCardEventualAnticipationFeeAdmin}%` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="nonCardEventualAnticipationFeeAdmin"
                        render={({ field }) => (
                            <FormControl>
                              <PercentageInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="1,67%"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 rounded-none"
                              />
                            </FormControl>
                        )}
                    />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

export function FeesAdminSection({
                              control,
                              isReadOnly = false,
                            }: FeesSectionProps) {
  return (
      <div className="space-y-8 w-full max-w-full overflow-x-hidden">
       

        
     

        {/* POS Brand Table */}
        <POSBrandTable
            control={control}
            isReadOnly={isReadOnly}
           
        />

        {/* PIX Fees Section */}
        <PIXFeesSection control={control} isReadOnly={isReadOnly} />

        {/* Online Brand Table */}
        <OnlineBrandTable
            control={control}
            isReadOnly={isReadOnly}
           
        />

        {/* Non-Card PIX Fees Section */}
        <NonCardPIXFeesSection control={control} isReadOnly={isReadOnly} />
      </div>
  )
}

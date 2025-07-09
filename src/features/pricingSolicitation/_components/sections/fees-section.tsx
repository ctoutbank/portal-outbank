"use client"

import type React from "react"

import { FormControl, FormField } from "@/components/ui/form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SolicitationFeeProductTypeList } from "@/lib/lookuptables/lookuptables"
import { brandList } from "@/lib/lookuptables/lookuptables-transactions"
import type { CSSProperties } from "react"
import { useWatch } from "react-hook-form"

interface FeesSectionProps {
  control: any
  isReadOnly?: boolean
  isNewSolicitation?: boolean
  hideFeeAdmin?: boolean
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
  value: string
  onChange: (e: any) => void
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
  value: string
  onChange: (e: any) => void
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
                         isNewSolicitation = false,
                         hideFeeAdmin = false,
                       }: {
  control: any
  isReadOnly?: boolean
  isNewSolicitation?: boolean
  hideFeeAdmin?: boolean
}) {
  // Define payment types as columns
  const paymentTypes = SolicitationFeeProductTypeList
  const brandsValues = useWatch({ control, name: "brands" })

  return (
      <div className="w-full overflow-x-auto">
        <h3 className="text-lg font-medium mb-4 text-foreground">Taxas Transações na POS</h3>
        <Table className="w-full border border-border">
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="sticky left-0 z-10 bg-background text-sm font-medium text-foreground border-r border-border">
                Bandeiras
              </TableHead>
              {paymentTypes.map((type, index) => (
                  <>
                    <TableHead
                        key={`${type.value}-fee-${index}`}
                        className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border"
                    >
                      {type.label}
                    </TableHead>
                    {!isNewSolicitation && !hideFeeAdmin && (
                        <TableHead
                            key={`${type.value}-feeAdmin-${index}`}
                            className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border"
                        >
                          {type.label}
                        </TableHead>
                    )}
                  </>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {brandList.map((brand, brandIndex) => (
                <TableRow key={`pos-${brand.value}-${brandIndex}`} className="border-b border-border">
                  <TableCell className="font-medium sticky left-0 z-10 bg-background text-foreground border-r border-border">
                    <div className="flex items-center gap-2">
                      {getCardImage(brand.value) && (
                          <img
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
                      <>
                        <TableCell
                            key={`${brand.value}-${type.value}-fee-${typeIndex}`}
                            className="p-1 text-center border-r border-border"
                        >
                          {isReadOnly ? (
                              <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-muted text-foreground border border-border">
                        <span>
                          {brandsValues?.[brandIndex]?.productTypes?.[typeIndex]?.fee
                              ? `${brandsValues[brandIndex].productTypes[typeIndex].fee}%`
                              : "-"}
                        </span>
                              </div>
                          ) : (
                              <FormField
                                  control={control}
                                  name={`brands.${brandIndex}.productTypes.${typeIndex}.fee`}
                                  render={({ field }) => (
                                      <FormControl>
                                        <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-muted text-foreground border border-border">
                                          <PercentageInput
                                              value={field.value}
                                              onChange={field.onChange}
                                              placeholder="0%"
                                              className="border-0 p-0 h-auto text-center w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                                          />
                                        </div>
                                      </FormControl>
                                  )}
                              />
                          )}
                        </TableCell>
                        {!isNewSolicitation && !hideFeeAdmin && (
                            <TableCell
                                key={`${brand.value}-${type.value}-feeAdmin-${typeIndex}`}
                                className="p-1 text-center border-r border-border"
                            >
                              {isReadOnly ? (
                                  <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-yellow-100 dark:bg-yellow-900/30 text-foreground border border-border">
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
                                            <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-yellow-100 dark:bg-yellow-900/30 text-foreground border border-border">
                                              <PercentageInput
                                                  value={field.value}
                                                  onChange={field.onChange}
                                                  placeholder="0%"
                                                  className="border-0 p-0 h-auto text-center w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                                              />
                                            </div>
                                          </FormControl>
                                      )}
                                  />
                              )}
                            </TableCell>
                        )}
                      </>
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
                            isNewSolicitation = false,
                            hideFeeAdmin = false,
                          }: {
  control: any
  isReadOnly?: boolean
  isNewSolicitation?: boolean
  hideFeeAdmin?: boolean
}) {
  // Define payment types as columns
  const paymentTypes = SolicitationFeeProductTypeList
  const brandsValues = useWatch({ control, name: "brands" })

  return (
      <div className="w-full overflow-x-auto mt-8">
        <h3 className="text-lg font-medium mb-4 text-foreground">Taxas Transações Online</h3>
        <Table className="w-full border border-border">
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="sticky left-0 z-10 bg-background text-sm font-medium text-foreground border-r border-border">
                Bandeiras
              </TableHead>
              {paymentTypes.map((type, index) => (
                  <>
                    <TableHead
                        key={`${type.value}-online-fee-${index}`}
                        className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border"
                    >
                      {type.label}
                    </TableHead>
                    {!isNewSolicitation && !hideFeeAdmin && (
                        <TableHead
                            key={`${type.value}-online-feeAdmin-${index}`}
                            className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border"
                        >
                          {type.label}
                        </TableHead>
                    )}
                  </>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {brandList.map((brand, brandIndex) => (
                <TableRow key={`online-${brand.value}-${brandIndex}`} className="border-b border-border">
                  <TableCell className="font-medium sticky left-0 z-10 bg-background text-foreground border-r border-border">
                    <div className="flex items-center gap-2">
                      {getCardImage(brand.value) && (
                          <img
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
                      <>
                        <TableCell
                            key={`${brand.value}-${type.value}-noCardFee-${typeIndex}`}
                            className="p-1 text-center border-r border-border"
                        >
                          {isReadOnly ? (
                              <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-muted text-foreground border border-border">
                        <span>
                          {brandsValues?.[brandIndex]?.productTypes?.[typeIndex]?.noCardFee
                              ? `${brandsValues[brandIndex].productTypes[typeIndex].noCardFee}%`
                              : "-"}
                        </span>
                              </div>
                          ) : (
                              <FormField
                                  control={control}
                                  name={`brands.${brandIndex}.productTypes.${typeIndex}.noCardFee`}
                                  render={({ field }) => (
                                      <FormControl>
                                        <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-muted text-foreground border border-border">
                                          <PercentageInput
                                              value={field.value}
                                              onChange={field.onChange}
                                              placeholder="0%"
                                              className="border-0 p-0 h-auto text-center w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                                          />
                                        </div>
                                      </FormControl>
                                  )}
                              />
                          )}
                        </TableCell>
                        {!isNewSolicitation && !hideFeeAdmin && (
                            <TableCell
                                key={`${brand.value}-${type.value}-noCardFeeAdmin-${typeIndex}`}
                                className="p-1 text-center border-r border-border"
                            >
                              {isReadOnly ? (
                                  <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-yellow-100 dark:bg-yellow-900/30 text-foreground border border-border">
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
                                            <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-yellow-100 dark:bg-yellow-900/30 text-foreground border border-border">
                                              <PercentageInput
                                                  value={field.value}
                                                  onChange={field.onChange}
                                                  placeholder="0%"
                                                  className="border-0 p-0 h-auto text-center w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                                              />
                                            </div>
                                          </FormControl>
                                      )}
                                  />
                              )}
                            </TableCell>
                        )}
                      </>
                  ))}
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  )
}

// PIX Fees Component
function PIXFeesSection({ control, isReadOnly = false }: { control: any; isReadOnly?: boolean }) {
  const cardPixMdr = useWatch({ control, name: "cardPixMdr" })
  const cardPixMinimumCostFee = useWatch({
    control,
    name: "cardPixMinimumCostFee",
  })
  const cardPixCeilingFee = useWatch({ control, name: "cardPixCeilingFee" })
  const eventualAnticipationFee = useWatch({
    control,
    name: "eventualAnticipationFee",
  })

  return (
      <div className="mt-12 mb-6">
        <h3 className="text-lg font-medium mb-4 text-foreground">PIX</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h4 className="font-medium mb-2 text-foreground">MDR</h4>
            <div className="flex gap-2">
              <div className="rounded-full py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{cardPixMdr ? `${cardPixMdr}%` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="cardPixMdr"
                        render={({ field }) => (
                            <FormControl>
                              <PercentageInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="0,01%"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
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
              <div className="rounded-full py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{cardPixMinimumCostFee ? `R$ ${cardPixMinimumCostFee}` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="cardPixMinimumCostFee"
                        render={({ field }) => (
                            <FormControl>
                              <CurrencyInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="R$ 0,09"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
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
              <div className="rounded-full py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{cardPixCeilingFee ? `R$ ${cardPixCeilingFee}` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="cardPixCeilingFee"
                        render={({ field }) => (
                            <FormControl>
                              <CurrencyInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="R$ 0,09"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
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
              <div className="rounded-full py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{eventualAnticipationFee ? `${eventualAnticipationFee}%` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="eventualAnticipationFee"
                        render={({ field }) => (
                            <FormControl>
                              <PercentageInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="1,67%"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
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
function NonCardPIXFeesSection({ control, isReadOnly = false }: { control: any; isReadOnly?: boolean }) {
  const nonCardPixMdr = useWatch({ control, name: "nonCardPixMdr" })
  const nonCardPixMinimumCostFee = useWatch({
    control,
    name: "nonCardPixMinimumCostFee",
  })
  const nonCardPixCeilingFee = useWatch({
    control,
    name: "nonCardPixCeilingFee",
  })
  const nonCardEventualAnticipationFee = useWatch({
    control,
    name: "nonCardEventualAnticipationFee",
  })

  return (
      <div className="mt-8 mb-6">
        <h3 className="text-lg font-medium mb-4 text-foreground">PIX sem Cartão</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h4 className="font-medium mb-2 text-foreground">MDR</h4>
            <div className="flex gap-2">
              <div className="rounded-full py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{nonCardPixMdr ? `${nonCardPixMdr}%` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="nonCardPixMdr"
                        render={({ field }) => (
                            <FormControl>
                              <PercentageInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="0,01%"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
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
              <div className="rounded-full py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{nonCardPixMinimumCostFee ? `R$ ${nonCardPixMinimumCostFee}` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="nonCardPixMinimumCostFee"
                        render={({ field }) => (
                            <FormControl>
                              <CurrencyInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="R$ 0,09"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
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
              <div className="rounded-full py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{nonCardPixCeilingFee ? `R$ ${nonCardPixCeilingFee}` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="nonCardPixCeilingFee"
                        render={({ field }) => (
                            <FormControl>
                              <CurrencyInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="R$ 0,09"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
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
              <div className="rounded-full py-2 px-4 bg-muted text-foreground border border-border inline-block">
                {isReadOnly ? (
                    <span>{nonCardEventualAnticipationFee ? `${nonCardEventualAnticipationFee}%` : "-"}</span>
                ) : (
                    <FormField
                        control={control}
                        name="nonCardEventualAnticipationFee"
                        render={({ field }) => (
                            <FormControl>
                              <PercentageInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="1,67%"
                                  className="border-0 p-0 h-auto w-full bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
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

export function FeesSection({
                              control,
                              isReadOnly = false,
                              isNewSolicitation = false,
                              hideFeeAdmin = false,
                            }: FeesSectionProps) {
  return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-foreground">Taxas</h3>

        {/* Legend for input colors - only show when not a new solicitation */}
        {!isNewSolicitation && !hideFeeAdmin && (
            <div className="flex flex-col gap-4 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-muted border border-border"></div>
                <span className="text-sm text-muted-foreground">Solicitado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 border border-border"></div>
                <span className="text-sm text-muted-foreground">Oferecido pelo Outbank</span>
              </div>
            </div>
        )}

        {/* POS Brand Table */}
        <POSBrandTable
            control={control}
            isReadOnly={isReadOnly}
            isNewSolicitation={isNewSolicitation}
            hideFeeAdmin={hideFeeAdmin}
        />

        {/* PIX Fees Section */}
        <PIXFeesSection control={control} isReadOnly={isReadOnly} />

        {/* Online Brand Table */}
        <OnlineBrandTable
            control={control}
            isReadOnly={isReadOnly}
            isNewSolicitation={isNewSolicitation}
            hideFeeAdmin={hideFeeAdmin}
        />

        {/* Non-Card PIX Fees Section */}
        <NonCardPIXFeesSection control={control} isReadOnly={isReadOnly} />
      </div>
  )
}

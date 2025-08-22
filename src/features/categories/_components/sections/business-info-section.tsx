"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { NumericFormat } from "react-number-format";
import { Control } from "react-hook-form";
import { PricingSolicitationSchemaAdmin } from "@/features/categories/schema/schema";

// Create a currency input component that uses NumericFormat with R$ prefix
const CurrencyInput = forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof NumericFormat>
>(({ className, ...props }, ref) => {
  return (
    <NumericFormat
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      prefix="R$ "
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      getInputRef={ref}
      {...props}
    />
  );
});

CurrencyInput.displayName = "CurrencyInput";

interface BusinessInfoSectionProps {
  control: Control<PricingSolicitationSchemaAdmin>;
}

export function BusinessInfoSectionFeeAdmin({ control }: BusinessInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Informações do Negócio</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
            <FormField
                control={control}
                name="cnae"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>CNAE</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="00000/00"
                                className="bg-muted cursor-not-allowed"
                                value={field.value}
                                readOnly
                                disabled
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div>
            <FormField
                control={control}
                name="mcc"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>MCC</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="0000"
                                className="bg-muted cursor-not-allowed"
                                value={field.value}
                                readOnly
                                disabled
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div>
          <FormField
            control={control}
            name="cnpjQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade de CNPJs</FormLabel>
                <FormControl>
                  <Input placeholder="1" type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
          <FormField
            control={control}
            name="averageTicket"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ticket Médio</FormLabel>
                <FormControl>
                  <CurrencyInput
                    placeholder="R$ 0,00"
                    value={field.value}
                    onValueChange={(values) => field.onChange(values.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
          <FormField
            control={control}
            name="monthlyPosFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TPV Mensal</FormLabel>
                <FormControl>
                  <CurrencyInput
                    placeholder="R$ 0,00"
                    value={field.value}
                    onValueChange={(values) => field.onChange(values.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* <div>
          <FormField
            control={control}
            name="cnaeInUse"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>CNAE em uso?</FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>*/}
      </div>
    </div>
  );
}

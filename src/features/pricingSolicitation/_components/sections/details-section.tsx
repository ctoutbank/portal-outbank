"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

interface DetailsSectionProps {
  control: any;
}

export function DetailsSection({ control }: DetailsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Detalhes Adicionais</h3>
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Descreva aqui a necessidade do cliente"
                className="resize-none"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

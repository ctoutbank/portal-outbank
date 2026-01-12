"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, CaptionProps, useNavigation } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, setMonth, setYear } from "date-fns";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface CustomCaptionProps extends CaptionProps {
  fromDate?: Date;
  toDate?: Date;
}

function CustomCaption({ displayMonth, fromDate, toDate }: CustomCaptionProps) {
  const { goToMonth } = useNavigation();
  
  const currentYear = displayMonth.getFullYear();
  const currentMonth = displayMonth.getMonth();
  
  const startYear = fromDate ? fromDate.getFullYear() : currentYear - 10;
  const endYear = toDate ? toDate.getFullYear() : currentYear + 10;
  
  const years = [];
  for (let y = endYear; y >= startYear; y--) {
    years.push(y);
  }
  
  const getAvailableMonths = () => {
    const months = [];
    for (let m = 0; m < 12; m++) {
      const date = new Date(currentYear, m, 1);
      const isBeforeStart = fromDate && date < new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
      const isAfterEnd = toDate && date > new Date(toDate.getFullYear(), toDate.getMonth(), 1);
      if (!isBeforeStart && !isAfterEnd) {
        months.push({ value: m, label: MONTHS[m] });
      }
    }
    return months;
  };
  
  const availableMonths = getAvailableMonths();
  
  const handleMonthChange = (value: string) => {
    const newMonth = parseInt(value, 10);
    const newDate = setMonth(displayMonth, newMonth);
    goToMonth(newDate);
  };
  
  const handleYearChange = (value: string) => {
    const newYear = parseInt(value, 10);
    let newDate = setYear(displayMonth, newYear);
    
    if (fromDate && newDate < fromDate) {
      newDate = new Date(newYear, fromDate.getMonth(), 1);
    }
    if (toDate && newDate > toDate) {
      newDate = new Date(newYear, toDate.getMonth(), 1);
    }
    
    goToMonth(newDate);
  };
  
  return (
    <div className="flex items-center justify-between gap-2 px-1 py-2">
      <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
        <SelectTrigger className="h-8 w-[110px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableMonths.map((month) => (
            <SelectItem key={month.value} value={month.value.toString()} className="text-xs">
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={currentYear.toString()} onValueChange={handleYearChange}>
        <SelectTrigger className="h-8 w-[80px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()} className="text-xs">
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  showMonthYearPicker?: boolean;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  showMonthYearPicker = false,
  fromDate,
  toDate,
  ...props
}: CalendarProps) {
  const captionComponent = showMonthYearPicker
    ? (captionProps: CaptionProps) => (
        <CustomCaption {...captionProps} fromDate={fromDate} toDate={toDate} />
      )
    : undefined;

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: showMonthYearPicker ? "flex justify-center pt-1 relative items-center mb-2" : "flex justify-center pt-1 relative items-center",
        caption_label: showMonthYearPicker ? "hidden" : "text-sm font-medium",
        nav: showMonthYearPicker ? "hidden" : "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
        ...(captionComponent && { Caption: captionComponent }),
      }}
      locale={ptBR}
      fromDate={fromDate}
      toDate={toDate}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

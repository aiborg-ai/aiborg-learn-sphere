import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SimpleDatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  className?: string;
  disabled?: (date: Date) => boolean;
  placeholder?: string;
}

export function SimpleDatePicker({
  value,
  onChange,
  className,
  disabled,
  placeholder = "Select date"
}: SimpleDatePickerProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
  ];

  const [selectedYear, setSelectedYear] = React.useState<number | undefined>(
    value?.getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = React.useState<number | undefined>(
    value?.getMonth()
  );
  const [selectedDay, setSelectedDay] = React.useState<number | undefined>(
    value?.getDate()
  );

  // Update internal state when value prop changes
  React.useEffect(() => {
    if (value) {
      setSelectedYear(value.getFullYear());
      setSelectedMonth(value.getMonth());
      setSelectedDay(value.getDate());
    } else {
      setSelectedYear(undefined);
      setSelectedMonth(undefined);
      setSelectedDay(undefined);
    }
  }, [value]);

  // Get days in the selected month
  const getDaysInMonth = () => {
    if (selectedYear === undefined || selectedMonth === undefined) return [];
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const handleDateChange = (year?: number, month?: number, day?: number) => {
    const newYear = year ?? selectedYear;
    const newMonth = month ?? selectedMonth;
    const newDay = day ?? selectedDay;

    if (newYear !== undefined && newMonth !== undefined && newDay !== undefined) {
      const newDate = new Date(newYear, newMonth, newDay);
      
      // Check if date should be disabled
      if (disabled && disabled(newDate)) {
        return;
      }
      
      onChange?.(newDate);
    }
  };

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr);
    setSelectedYear(year);
    handleDateChange(year, selectedMonth, selectedDay);
  };

  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr);
    setSelectedMonth(month);
    
    // If selected day doesn't exist in new month, reset to 1
    const daysInNewMonth = new Date(selectedYear || currentYear, month + 1, 0).getDate();
    const newDay = selectedDay && selectedDay <= daysInNewMonth ? selectedDay : 1;
    setSelectedDay(newDay);
    
    handleDateChange(selectedYear, month, newDay);
  };

  const handleDayChange = (dayStr: string) => {
    const day = parseInt(dayStr);
    setSelectedDay(day);
    handleDateChange(selectedYear, selectedMonth, day);
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Select value={selectedDay?.toString()} onValueChange={handleDayChange}>
        <SelectTrigger className="w-20">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          {getDaysInMonth().map((day) => (
            <SelectItem key={day} value={day.toString()}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedMonth?.toString()} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value.toString()}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedYear?.toString()} onValueChange={handleYearChange}>
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
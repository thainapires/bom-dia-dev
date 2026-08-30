import { ArrowLeftIcon } from "@solar-icons/react/linear/arrow-left";
import { ArrowRightIcon } from "@solar-icons/react/linear/arrow-right";
import { CalendarDateLinearIcon } from "@solar-icons/react";
import { DateNavigationButton } from "./DateNavigationButton";
import { Button } from "../../ui";
import { addDays, formatCompactDate, toISODate } from "../../../formatting";

interface DateNavigationProps {
  date: string
  isToday: boolean
  onDateChange: React.Dispatch<React.SetStateAction<string>>
}

export function DateNavigation({ date, isToday, onDateChange }: DateNavigationProps) {
  const handlePreviousDay = () => {
    onDateChange((current) => addDays(current, -1))
  }

  const handleNextDay = () => {
    onDateChange((current) => addDays(current, 1))
  }

  const handleToday = () => {
    onDateChange(toISODate(new Date()))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg bg-surface p-1">
        <DateNavigationButton
          title="Dia anterior"
          icon={<ArrowLeftIcon size={16} />}
          onClick={handlePreviousDay}
        />

        <div className="flex items-center gap-1.5 whitespace-nowrap px-2 text-sm font-medium text-foreground">
          <CalendarDateLinearIcon size={16} className="flex-none text-foreground-subtle" />
          {formatCompactDate(date)}
        </div>

        <DateNavigationButton
          title="Próximo dia"
          icon={<ArrowRightIcon size={16} />}
          onClick={handleNextDay}
          disabled={isToday}
        />
      </div>

      {isToday ? (
        <span className="flex-none rounded-md bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary">
          Hoje
        </span>
      ) : (
        <Button variant="ghost" onClick={handleToday} className="h-8 rounded-md px-2 text-xs">
          Hoje
        </Button>
      )}
    </div>
  )
}

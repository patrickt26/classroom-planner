"use client";

import { CalendarDays } from "lucide-react";
import {
  type ComponentProps,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { WeekStartContext } from "@/features/workspace/week-start-context";

type DatePickerProps = Pick<
  ComponentProps<typeof Input>,
  "aria-describedby" | "aria-invalid" | "disabled" | "required"
> & {
  id: string;
  label: string;
  name: string;
  value?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
  onValueChange?: (value: string) => void;
};

const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
const displayPattern = /^\d{2}\/\d{2}\/\d{4}$/;
const reverseDate = (value: string, from: string, to: string) =>
  value.split(from).reverse().join(to);
const displayDate = (value: string) =>
  isoPattern.test(value) ? reverseDate(value, "-", "/") : value;

function toIsoDate(date: Date) {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseDate(value?: string) {
  if (!value || !isoPattern.test(value)) return undefined;
  const date = new Date(`${value}T12:00:00`);
  return toIsoDate(date) === value ? date : undefined;
}

const dayButtonClass =
  "size-11 rounded-lg font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";
const navigationButtonClass = `${dayButtonClass} hover:bg-muted aria-disabled:opacity-50`;
const fullDate = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" });

export function DatePicker({
  id,
  label,
  name,
  value,
  defaultValue = "",
  min,
  max,
  onValueChange,
  ...inputProps
}: DatePickerProps) {
  const weekStart = useContext(WeekStartContext);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const input = useRef<HTMLInputElement>(null);
  const dateValue = value ?? internalValue;
  const selected = parseDate(dateValue);
  const first = parseDate(min);
  const last = parseDate(max);
  const validationMessage = !dateValue
    ? ""
    : !selected
      ? "Informe uma data válida no formato DD/MM/AAAA."
      : first && min && dateValue < min
        ? `Escolha uma data a partir de ${displayDate(min)}.`
        : last && max && dateValue > max
          ? `Escolha uma data até ${displayDate(max)}.`
          : "";

  useEffect(() => {
    input.current?.setCustomValidity(validationMessage);
  }, [validationMessage]);

  function updateValue(next: string) {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  }

  const today = new Date();
  const preferred = selected ?? today;
  const initialMonth =
    first && preferred < first
      ? first
      : last && preferred > last
        ? last
        : preferred;
  const year = initialMonth.getFullYear();

  return (
    <div className="relative min-w-0">
      <Input
        {...inputProps}
        ref={input}
        id={id}
        type="text"
        placeholder="DD/MM/AAAA"
        value={displayDate(dateValue)}
        className="pr-12"
        onChange={(event) => {
          const text = event.currentTarget.value;
          updateValue(
            displayPattern.test(text) ? reverseDate(text, "/", "-") : text,
          );
        }}
      />
      <input
        type="hidden"
        name={name}
        value={dateValue}
        disabled={inputProps.disabled}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={inputProps.disabled}
            aria-label={`Abrir calendário: ${label}`}
            className="absolute inset-y-0 right-0"
          >
            <CalendarDays aria-hidden="true" />
          </Button>
        </DialogTrigger>
        <DialogContent
          aria-describedby={undefined}
          className="max-w-[min(calc(100%-1rem),21.5rem)] gap-2 px-2 sm:max-w-[21.5rem]"
          onOpenAutoFocus={(event) => {
            const content = event.currentTarget;
            if (!(content instanceof HTMLElement)) return;
            const day = content.querySelector<HTMLButtonElement>(
              '[role="grid"] button[tabindex="0"]:not(:disabled)',
            );
            if (day) {
              event.preventDefault();
              day.focus();
            }
          }}
        >
          <DialogTitle className="pl-2 pr-12 leading-8">{label}</DialogTitle>
          <DayPicker
            mode="single"
            required
            autoFocus
            locale={ptBR}
            weekStartsOn={weekStart === "sunday" ? 0 : 1}
            captionLayout="dropdown"
            navLayout="after"
            reverseYears
            today={today}
            defaultMonth={initialMonth}
            startMonth={first ?? new Date(year - 100, 0)}
            endMonth={last ?? new Date(year + 10, 11)}
            selected={selected}
            disabled={[
              ...(first ? [{ before: first }] : []),
              ...(last ? [{ after: last }] : []),
            ]}
            modifiers={{ weekend: { dayOfWeek: [0, 6] } }}
            modifiersClassNames={{
              weekend: "[&>button]:bg-yellow/40 [&>button]:text-brown",
            }}
            onSelect={(date) => {
              updateValue(toIsoDate(date));
              setOpen(false);
            }}
            labels={{
              labelNav: () => "Navegação do calendário",
              labelPrevious: () => "Mês anterior",
              labelNext: () => "Próximo mês",
              labelMonthDropdown: () => "Mês",
              labelYearDropdown: () => "Ano",
              labelDayButton: (date, { today, selected }) =>
                `${today ? "Hoje, " : ""}${fullDate.format(date)}${selected ? ", selecionado" : ""}`,
            }}
            formatters={{
              formatWeekdayName: (date) =>
                date
                  .toLocaleDateString("pt-BR", { weekday: "short" })
                  .replace(/\.$/, ""),
            }}
            classNames={{
              root: "mx-auto w-fit",
              months: "relative",
              month_caption: "flex min-h-11 items-center pr-[5.5rem]",
              dropdowns: "flex gap-1",
              dropdown_root: "flex",
              dropdown:
                "min-h-11 min-w-0 rounded-lg border border-input bg-card px-1 capitalize focus-visible:ring-2 focus-visible:ring-ring",
              caption_label: "sr-only",
              nav: "absolute top-0 right-0 flex",
              button_previous: navigationButtonClass,
              button_next: navigationButtonClass,
              chevron: "mx-auto size-4 fill-current",
              month_grid: "border-collapse",
              weekday: "h-8 font-semibold capitalize",
              day: "size-11 p-0 text-center",
              day_button: `${dayButtonClass} hover:bg-muted disabled:opacity-50`,
              today: "[&>button]:border [&>button]:border-primary",
              selected:
                "[&>button]:bg-primary! [&>button]:text-primary-foreground!",
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
